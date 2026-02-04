const crypto = require('crypto');
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, error } = require('../shared/response');
const { AppError, ValidationError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { createProjectSchema, updateProjectSchema } = require('./validator');

const create = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

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
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    console.error('Create project error:', err);
    return error('Internal server error', 500);
  }
};

const update = async (event) => {
  try {
    const { userId } = event.user;
    const { projectId } = event.pathParameters || {};

    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    const body = JSON.parse(event.body || '{}');
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
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    if (err.name === 'ConditionalCheckFailedException') {
      return error('Project not found', 404);
    }
    console.error('Update project error:', err);
    return error('Internal server error', 500);
  }
};

const remove = async (event) => {
  try {
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
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    if (err.name === 'ConditionalCheckFailedException') {
      return error('Project not found', 404);
    }
    console.error('Delete project error:', err);
    return error('Internal server error', 500);
  }
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

const fetchAllTasks = async (userId) => {
  const items = [];
  let lastKey;

  do {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': userId,
        ':sk': 'TASK#',
      },
    };
    if (lastKey) params.ExclusiveStartKey = lastKey;

    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new QueryCommand(params)
    );
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

  return items;
};

const list = async (event) => {
  try {
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
      fetchAllTasks(userId),
    ]);

    const enrichedProjects = Items.map((project) =>
      enrichProjectWithMetrics(project, allTasks)
    );

    const response = { projects: enrichedProjects };
    if (LastEvaluatedKey) {
      response.nextKey = Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64');
    }

    return success(response);
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    console.error('List projects error:', err);
    return error('Internal server error', 500);
  }
};

module.exports = {
  create: withAuth(create),
  update: withAuth(update),
  remove: withAuth(remove),
  list: withAuth(list),
};
