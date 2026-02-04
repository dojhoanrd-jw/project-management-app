const crypto = require('crypto');
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, withErrorHandler, parseBody } = require('../shared/response');
const { ValidationError, NotFoundError, ForbiddenError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { requireProjectRole } = require('../shared/authorization');
const { createProjectSchema, updateProjectSchema } = require('./validator');
const {
  fetchUserProjectIds,
  verifyMembership,
  fetchProjectItems,
  fetchProjectMeta,
  batchGetProjects,
  fetchProjectMembers,
} = require('../shared/membership');
const { calcWeightedProgress, calcProjectHealth } = require('../dashboard/shared');

const create = async (event) => {
  const body = parseBody(event);

  const result = createProjectSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  const { name, description, status, progress, managerId, managerName, dueDate, members } = result.data;
  const { email: creatorEmail, name: creatorName } = event.user;
  const projectId = crypto.randomUUID();

  const project = {
    PK: `PROJECT#${projectId}`,
    SK: 'META',
    projectId,
    name,
    description,
    status,
    progress,
    managerId,
    managerName,
    dueDate,
    members: members || [],
    type: 'project',
    createdAt: new Date().toISOString(),
  };

  // Creator membership record
  const creatorMembership = {
    PK: `USER#${creatorEmail}`,
    SK: `MEMBER#${projectId}`,
    GSI1PK: `PROJECT#${projectId}`,
    GSI1SK: `MEMBER#${creatorEmail}`,
    projectId,
    email: creatorEmail,
    name: creatorName,
    memberRole: 'owner',
    type: 'membership',
    createdAt: new Date().toISOString(),
  };

  // Write project + creator membership
  const writeItems = [
    { PutRequest: { Item: project } },
    { PutRequest: { Item: creatorMembership } },
  ];

  // Also create membership records for initial members
  for (const member of (members || [])) {
    if (member.email === creatorEmail) continue;
    writeItems.push({
      PutRequest: {
        Item: {
          PK: `USER#${member.email}`,
          SK: `MEMBER#${projectId}`,
          GSI1PK: `PROJECT#${projectId}`,
          GSI1SK: `MEMBER#${member.email}`,
          projectId,
          email: member.email,
          name: member.name,
          memberRole: member.role || 'member',
          type: 'membership',
          createdAt: new Date().toISOString(),
        },
      },
    });
  }

  // BatchWrite in chunks of 25
  for (let i = 0; i < writeItems.length; i += 25) {
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: { [TABLE_NAME]: writeItems.slice(i, i + 25) },
      }),
    );
  }

  return success({ project }, 201);
};

const update = async (event) => {
  const { email } = event.user;
  const { projectId } = event.pathParameters || {};

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  const membership = await verifyMembership(email, projectId);
  requireProjectRole(membership.memberRole, ['owner', 'project_manager']);

  const body = parseBody(event);
  const result = updateProjectSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  const fields = result.data;
  const keys = Object.keys(fields);

  if (keys.length === 0) {
    throw new ValidationError('No fields to update');
  }

  const expressionParts = [];
  const exprNames = {};
  const exprValues = {};

  for (const key of keys) {
    expressionParts.push(`#${key} = :${key}`);
    exprNames[`#${key}`] = key;
    exprValues[`:${key}`] = fields[key];
  }

  expressionParts.push('#updatedAt = :updatedAt');
  exprNames['#updatedAt'] = 'updatedAt';
  exprValues[':updatedAt'] = new Date().toISOString();

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    }),
  );

  return success({ project: Attributes });
};

const remove = async (event) => {
  const { email } = event.user;
  const { projectId } = event.pathParameters || {};

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  const membership = await verifyMembership(email, projectId);
  requireProjectRole(membership.memberRole, ['owner']);

  // Fetch all items under this project partition (META + TASKs)
  const allProjectItems = [];
  let lastKey;
  do {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `PROJECT#${projectId}` },
    };
    if (lastKey) params.ExclusiveStartKey = lastKey;

    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new QueryCommand(params),
    );
    allProjectItems.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

  // Fetch all membership records via GSI1
  const membershipRecords = await fetchProjectMembers(projectId);

  // Collect all delete requests
  const deleteRequests = [];

  for (const item of allProjectItems) {
    deleteRequests.push({
      DeleteRequest: { Key: { PK: item.PK, SK: item.SK } },
    });
  }

  for (const member of membershipRecords) {
    deleteRequests.push({
      DeleteRequest: { Key: { PK: member.PK, SK: member.SK } },
    });
  }

  // BatchWrite delete in chunks of 25
  for (let i = 0; i < deleteRequests.length; i += 25) {
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: { [TABLE_NAME]: deleteRequests.slice(i, i + 25) },
      }),
    );
  }

  const deletedTasks = allProjectItems.filter((i) => i.SK.startsWith('TASK#')).length;
  return success({ message: 'Project deleted', deletedTasks });
};

const get = async (event) => {
  const { email } = event.user;
  const { projectId } = event.pathParameters || {};

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  const membership = await verifyMembership(email, projectId);

  const [project, tasks] = await Promise.all([
    fetchProjectMeta(projectId),
    fetchProjectItems(projectId, 'TASK#'),
  ]);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const enriched = enrichProjectWithMetrics(project, tasks);

  return success({ project: { ...enriched, currentUserRole: membership.memberRole }, tasks });
};

const enrichProjectWithMetrics = (project, tasks) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completionPercent = calcWeightedProgress(tasks);
  const healthStatus = calcProjectHealth(tasks, project.dueDate, project.createdAt);

  return {
    ...project,
    totalHours,
    completionPercent,
    totalTasks,
    completedTasks,
    healthStatus,
  };
};

const list = async (event) => {
  const { email } = event.user;

  const projectIds = await fetchUserProjectIds(email);

  if (projectIds.length === 0) {
    return success({ projects: [] });
  }

  const projects = await batchGetProjects(projectIds);

  // Fetch tasks for all projects in parallel
  const tasksByProject = await Promise.all(
    projectIds.map((id) => fetchProjectItems(id, 'TASK#')),
  );

  const allTasks = tasksByProject.flat();

  const enrichedProjects = projects.map((project) => {
    const projectTasks = allTasks.filter((t) => t.projectId === project.projectId);
    return enrichProjectWithMetrics(project, projectTasks);
  });

  return success({ projects: enrichedProjects });
};

const addMember = async (event) => {
  const { email: callerEmail } = event.user;
  const { projectId } = event.pathParameters || {};

  if (!projectId) throw new ValidationError('Project ID is required');

  const callerMembership = await verifyMembership(callerEmail, projectId);
  requireProjectRole(callerMembership.memberRole, ['owner']);

  const body = parseBody(event);
  const { email, name, role } = body;

  if (!email || !name) throw new ValidationError('Member email and name are required');

  // Check if already a member
  const existing = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${email}`, SK: `MEMBER#${projectId}` },
    }),
  );

  if (existing.Item) {
    throw new ValidationError('Member already exists in this project');
  }

  const membership = {
    PK: `USER#${email}`,
    SK: `MEMBER#${projectId}`,
    GSI1PK: `PROJECT#${projectId}`,
    GSI1SK: `MEMBER#${email}`,
    projectId,
    email,
    name,
    memberRole: role || 'member',
    type: 'membership',
    createdAt: new Date().toISOString(),
  };

  const project = await fetchProjectMeta(projectId);
  if (!project) throw new NotFoundError('Project not found');

  const members = project.members || [];
  members.push({ email, name, role: role || 'member' });

  await Promise.all([
    docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: membership })),
    docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
        UpdateExpression: 'SET #members = :members, #updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#members': 'members', '#updatedAt': 'updatedAt' },
        ExpressionAttributeValues: {
          ':members': members,
          ':updatedAt': new Date().toISOString(),
        },
      }),
    ),
  ]);

  return success({ member: { email, name, role: role || 'member' } });
};

const removeMember = async (event) => {
  const { email: callerEmail } = event.user;
  const { projectId, memberEmail } = event.pathParameters || {};

  if (!projectId) throw new ValidationError('Project ID is required');
  if (!memberEmail) throw new ValidationError('Member email is required');

  const decodedEmail = decodeURIComponent(memberEmail);
  const isSelfLeave = decodedEmail === callerEmail;

  if (isSelfLeave) {
    // Anyone can leave except the owner
    const selfMembership = await verifyMembership(callerEmail, projectId);
    if (selfMembership.memberRole === 'owner') {
      throw new ForbiddenError('Project owner cannot leave the project');
    }
  } else {
    // Only owner can remove others
    const callerMembership = await verifyMembership(callerEmail, projectId);
    requireProjectRole(callerMembership.memberRole, ['owner']);

    // Cannot remove the owner
    const targetMembership = await verifyMembership(decodedEmail, projectId);
    if (targetMembership.memberRole === 'owner') {
      throw new ForbiddenError('Cannot remove project owner');
    }
  }

  // Check if target is the project manager
  const project = await fetchProjectMeta(projectId);
  if (!project) throw new NotFoundError('Project not found');

  if (project.managerId === decodedEmail) {
    throw new ForbiddenError('Cannot remove the assigned project manager. Update the project manager first.');
  }

  // Delete membership record
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${decodedEmail}`, SK: `MEMBER#${projectId}` },
    }),
  );

  const members = (project.members || []).filter((m) => m.email !== decodedEmail);

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
      UpdateExpression: 'SET #members = :members, #updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#members': 'members', '#updatedAt': 'updatedAt' },
      ExpressionAttributeValues: {
        ':members': members,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }),
  );

  return success({ project: Attributes });
};

module.exports = {
  create: withAuth(withErrorHandler('Create project', create)),
  get: withAuth(withErrorHandler('Get project', get)),
  update: withAuth(withErrorHandler('Update project', update)),
  remove: withAuth(withErrorHandler('Delete project', remove)),
  list: withAuth(withErrorHandler('List projects', list)),
  addMember: withAuth(withErrorHandler('Add project member', addMember)),
  removeMember: withAuth(withErrorHandler('Remove project member', removeMember)),
};
