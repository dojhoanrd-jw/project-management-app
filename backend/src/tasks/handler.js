const crypto = require('crypto');
const { PutCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, error } = require('../shared/response');
const { AppError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { createTaskSchema } = require('./validator');

const verifyProjectExists = async (userId, projectId) => {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userId, SK: `PROJECT#${projectId}` },
    })
  );
  return !!Item;
};

const create = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Invalid data';
      return error(message, 400);
    }

    const { title, description, projectId, status, dueDate } = result.data;
    const { userId } = event.user;

    const projectExists = await verifyProjectExists(userId, projectId);
    if (!projectExists) {
      return error('Project not found', 404);
    }

    const taskId = crypto.randomUUID();

    const task = {
      PK: userId,
      SK: `TASK#${taskId}`,
      taskId,
      title,
      description,
      projectId,
      status,
      dueDate,
      type: 'task',
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({ TableName: TABLE_NAME, Item: task })
    );

    return success({ task }, 201);
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    console.error('Create task error:', err);
    return error('Internal server error', 500);
  }
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
        ':sk': 'TASK#',
      },
      Limit: limit,
    };

    if (params.nextKey) {
      queryParams.ExclusiveStartKey = JSON.parse(
        Buffer.from(params.nextKey, 'base64').toString()
      );
    }

    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new QueryCommand(queryParams)
    );

    const response = { tasks: Items };
    if (LastEvaluatedKey) {
      response.nextKey = Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64');
    }

    return success(response);
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    console.error('List tasks error:', err);
    return error('Internal server error', 500);
  }
};

module.exports = {
  create: withAuth(create),
  list: withAuth(list),
};
