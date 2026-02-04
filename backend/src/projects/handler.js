const crypto = require('crypto');
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, withErrorHandler, parseBody } = require('../shared/response');
const { ValidationError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { createProjectSchema, updateProjectSchema } = require('./validator');
const { fetchAllItems } = require('../dashboard/shared');

const create = async (event) => {
  const body = parseBody(event);

  const result = createProjectSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  const { name, description, status, progress, managerId, managerName, dueDate } = result.data;
  const { userId } = event.user;
  const projectId = crypto.randomUUID();

  const project = {
    PK: userId,
    SK: `PROJECT#${projectId}`,
    GSI1PK: `MANAGER#${managerId}`,
    GSI1SK: `PROJECT#${projectId}`,
    projectId,
    name,
    description,
    status,
    progress,
    managerId,
    managerName,
    dueDate,
    type: 'project',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: project })
  );

  return success({ project }, 201);
};

const update = async (event) => {
  const { userId } = event.user;
  const { projectId } = event.pathParameters || {};

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

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
      Key: { PK: userId, SK: `PROJECT#${projectId}` },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    })
  );

  return success({ project: Attributes });
};

const remove = async (event) => {
  const { userId } = event.user;
  const { projectId } = event.pathParameters || {};

  if (!projectId) {
    throw new ValidationError('Project ID is required');
  }

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: userId, SK: `PROJECT#${projectId}` },
      ConditionExpression: 'attribute_exists(PK)',
    })
  );

  return success({ message: 'Project deleted' });
};

const enrichProjectWithMetrics = (project, tasks) => {
  const projectTasks = tasks.filter((t) => t.projectId === project.projectId);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;
  const totalHours = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completionPercent = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return {
    ...project,
    totalHours,
    completionPercent,
    totalTasks,
    completedTasks,
  };
};

const list = async (event) => {
  const { userId } = event.user;
  const params = event.queryStringParameters || {};
  const limit = Math.min(parseInt(params.limit) || 20, 100);

  const queryParams = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': userId,
      ':sk': 'PROJECT#',
    },
    Limit: limit,
  };

  if (params.nextKey) {
    queryParams.ExclusiveStartKey = JSON.parse(
      Buffer.from(params.nextKey, 'base64').toString()
    );
  }

  const [{ Items = [], LastEvaluatedKey }, allTasks] = await Promise.all([
    docClient.send(new QueryCommand(queryParams)),
    fetchAllItems(userId, 'TASK#'),
  ]);

  const enrichedProjects = Items.map((project) =>
    enrichProjectWithMetrics(project, allTasks)
  );

  const response = { projects: enrichedProjects };
  if (LastEvaluatedKey) {
    response.nextKey = Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64');
  }

  return success(response);
};

module.exports = {
  create: withAuth(withErrorHandler('Create project', create)),
  update: withAuth(withErrorHandler('Update project', update)),
  remove: withAuth(withErrorHandler('Delete project', remove)),
  list: withAuth(withErrorHandler('List projects', list)),
};
