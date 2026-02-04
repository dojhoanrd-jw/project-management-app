const crypto = require('crypto');
const { PutCommand, QueryCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, error } = require('../shared/response');
const { AppError, NotFoundError, ValidationError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { createTaskSchema, updateTaskSchema } = require('./validator');

const verifyProjectExists = async (userId, projectId) => {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userId, SK: `PROJECT#${projectId}` },
    })
  );
  return Item || null;
};

const create = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
    }

    const {
      title, description, projectId, status, priority,
      category, assigneeId, assigneeName, estimatedHours, dueDate,
    } = result.data;
    const { userId } = event.user;

    const project = await verifyProjectExists(userId, projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const taskId = crypto.randomUUID();

    const task = {
      PK: userId,
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

const update = async (event) => {
  try {
    const { userId } = event.user;
    const { taskId } = event.pathParameters || {};

    if (!taskId) {
      throw new ValidationError('Task ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    const result = updateTaskSchema.safeParse(body);
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
        Key: { PK: userId, SK: `TASK#${taskId}` },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ConditionExpression: 'attribute_exists(PK)',
        ReturnValues: 'ALL_NEW',
      })
    );

    return success({ task: Attributes });
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    if (err.name === 'ConditionalCheckFailedException') {
      return error('Task not found', 404);
    }
    console.error('Update task error:', err);
    return error('Internal server error', 500);
  }
};

const remove = async (event) => {
  try {
    const { userId } = event.user;
    const { taskId } = event.pathParameters || {};

    if (!taskId) {
      throw new ValidationError('Task ID is required');
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: userId, SK: `TASK#${taskId}` },
        ConditionExpression: 'attribute_exists(PK)',
      })
    );

    return success({ message: 'Task deleted' });
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    if (err.name === 'ConditionalCheckFailedException') {
      return error('Task not found', 404);
    }
    console.error('Delete task error:', err);
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

    if (params.status) {
      queryParams.FilterExpression = '#status = :status';
      queryParams.ExpressionAttributeNames = { '#status': 'status' };
      queryParams.ExpressionAttributeValues[':status'] = params.status;
    }

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

const myTasks = async (event) => {
  try {
    const { email } = event.user;

    const { Items = [] } = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `ASSIGNEE#${email}`,
          ':sk': 'TASK#',
        },
      })
    );

    return success({ tasks: Items });
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    console.error('My tasks error:', err);
    return error('Internal server error', 500);
  }
};

module.exports = {
  create: withAuth(create),
  update: withAuth(update),
  remove: withAuth(remove),
  list: withAuth(list),
  myTasks: withAuth(myTasks),
};
