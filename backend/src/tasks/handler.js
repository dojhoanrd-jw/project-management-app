const crypto = require('crypto');
const { PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { queryAll } = require('../shared/queryAll');
const { success, withErrorHandler, parseBody } = require('../shared/response');
const { ValidationError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { requireProjectRole } = require('../shared/authorization');
const { createTaskSchema, updateTaskSchema } = require('./validator');
const {
  fetchUserProjectIds,
  verifyMembership,
  fetchProjectItems,
  fetchProjectMeta,
} = require('../shared/membership');

const updateProjectStatusIfNeeded = async (projectId) => {
  const tasks = await fetchProjectItems(projectId, 'TASK#');
  if (tasks.length === 0) return;

  const allDone = tasks.every((t) => t.status === 'completed' || t.status === 'approved');
  const project = await fetchProjectMeta(projectId);
  if (!project) return;

  let newStatus = null;
  if (allDone && project.status !== 'completed') {
    newStatus = 'completed';
  } else if (!allDone && project.status === 'completed') {
    newStatus = 'active';
  }

  if (newStatus) {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
        UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status', '#updatedAt': 'updatedAt' },
        ExpressionAttributeValues: { ':status': newStatus, ':updatedAt': new Date().toISOString() },
      }),
    );
  }
};

const create = async (event) => {
  const body = parseBody(event);

  const result = createTaskSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  const {
    title, description, projectId, status, priority,
    category, assigneeId, assigneeName, estimatedHours, dueDate,
  } = result.data;
  const { email } = event.user;

  // Verify caller is a member of the project
  await verifyMembership(email, projectId);

  // Verify assignee is also a project member
  await verifyMembership(assigneeId, projectId);

  const project = await fetchProjectMeta(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const taskId = crypto.randomUUID();

  const task = {
    PK: `PROJECT#${projectId}`,
    SK: `TASK#${taskId}`,
    GSI1PK: `ASSIGNEE#${assigneeId}`,
    GSI1SK: `TASK#${taskId}`,
    taskId,
    title,
    description,
    projectId,
    projectName: project.name,
    status,
    priority,
    category,
    assigneeId,
    assigneeName,
    estimatedHours,
    dueDate,
    type: 'task',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: task }),
  );

  await updateProjectStatusIfNeeded(projectId);

  return success({ task }, 201);
};

const update = async (event) => {
  const { email } = event.user;
  const { taskId } = event.pathParameters || {};

  if (!taskId) {
    throw new ValidationError('Task ID is required');
  }

  const body = parseBody(event);
  const result = updateTaskSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  // projectId must be provided in body so we know which partition to update
  const projectId = body.projectId;
  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  const callerMembership = await verifyMembership(email, projectId);

  const fields = result.data;

  // Verify new assignee is a project member if changed
  if (fields.assigneeId) {
    await verifyMembership(fields.assigneeId, projectId);
  }

  // Only owner/project_manager can approve tasks
  if (fields.status === 'approved') {
    requireProjectRole(callerMembership.memberRole, ['owner', 'project_manager']);
  }
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
      Key: { PK: `PROJECT#${projectId}`, SK: `TASK#${taskId}` },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    }),
  );

  await updateProjectStatusIfNeeded(projectId);

  return success({ task: Attributes });
};

const remove = async (event) => {
  const { email } = event.user;
  const { taskId } = event.pathParameters || {};

  if (!taskId) {
    throw new ValidationError('Task ID is required');
  }

  // projectId passed as query parameter
  const params = event.queryStringParameters || {};
  const projectId = params.projectId;

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  await verifyMembership(email, projectId);

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PROJECT#${projectId}`, SK: `TASK#${taskId}` },
      ConditionExpression: 'attribute_exists(PK)',
    }),
  );

  return success({ message: 'Task deleted' });
};

const list = async (event) => {
  const { email } = event.user;
  const params = event.queryStringParameters || {};

  // Get all projects the user is a member of
  const projectIds = await fetchUserProjectIds(email);

  if (projectIds.length === 0) {
    return success({ tasks: [] });
  }

  // Fetch tasks from all projects in parallel
  const tasksByProject = await Promise.all(
    projectIds.map((id) => fetchProjectItems(id, 'TASK#')),
  );

  let tasks = tasksByProject.flat();

  // Optional status filter
  if (params.status) {
    tasks = tasks.filter((t) => t.status === params.status);
  }

  return success({ tasks });
};

const myTasks = async (event) => {
  const { email } = event.user;

  const items = await queryAll({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: { ':pk': `ASSIGNEE#${email}`, ':sk': 'TASK#' },
  });

  return success({ tasks: items });
};

module.exports = {
  create: withAuth(withErrorHandler('Create task', create)),
  update: withAuth(withErrorHandler('Update task', update)),
  remove: withAuth(withErrorHandler('Delete task', remove)),
  list: withAuth(withErrorHandler('List tasks', list)),
  myTasks: withAuth(withErrorHandler('My tasks', myTasks)),
};
