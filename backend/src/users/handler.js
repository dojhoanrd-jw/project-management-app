const bcrypt = require('bcryptjs');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { queryAll } = require('../shared/queryAll');
const { success, withErrorHandler, parseBody } = require('../shared/response');
const { ValidationError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { requireAdmin } = require('../shared/authorization');
const { createUserSchema, updateUserSchema } = require('./validator');

const list = async (event) => {
  const params = event.queryStringParameters || {};
  const returnAll = params.all === 'true';

  const queryParams = {
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeNames: { '#name': 'name', '#role': 'role' },
    ExpressionAttributeValues: { ':pk': 'USERS' },
    ProjectionExpression: 'email, #name, #role',
  };

  if (!returnAll) {
    queryParams.FilterExpression = '#role = :pm OR #role = :admin';
    queryParams.ExpressionAttributeValues[':pm'] = 'project_manager';
    queryParams.ExpressionAttributeValues[':admin'] = 'admin';
  }

  const items = await queryAll(queryParams);

  return success({ users: items });
};

const create = async (event) => {
  await requireAdmin(event.user.email);
  const body = parseBody(event);

  const result = createUserSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  const { email, name, role, password } = result.data;

  // Check if user already exists
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${email}`, SK: 'PROFILE' },
    })
  );

  if (Item) {
    throw new ValidationError('A user with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    PK: `USER#${email}`,
    SK: 'PROFILE',
    GSI1PK: 'USERS',
    GSI1SK: `USER#${email}`,
    email,
    name,
    role,
    password: hashedPassword,
    type: 'user',
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({ TableName: TABLE_NAME, Item: user })
  );

  return success({
    user: { email, name, role },
  }, 201);
};

const update = async (event) => {
  await requireAdmin(event.user.email);
  const { email } = event.pathParameters || {};

  if (!email) {
    throw new ValidationError('Email is required');
  }

  const decodedEmail = decodeURIComponent(email);
  const body = parseBody(event);
  const result = updateUserSchema.safeParse(body);

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

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${decodedEmail}`, SK: 'PROFILE' },
      UpdateExpression: `SET ${expressionParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ConditionExpression: 'attribute_exists(PK)',
      ReturnValues: 'ALL_NEW',
    })
  );

  return success({
    user: { email: Attributes.email, name: Attributes.name, role: Attributes.role },
  });
};

const remove = async (event) => {
  await requireAdmin(event.user.email);
  const { email } = event.pathParameters || {};

  if (!email) {
    throw new ValidationError('Email is required');
  }

  const decodedEmail = decodeURIComponent(email);

  if (decodedEmail === event.user.email) {
    throw new ValidationError('Cannot delete your own account');
  }

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${decodedEmail}`, SK: 'PROFILE' },
      ConditionExpression: 'attribute_exists(PK)',
    })
  );

  return success({ message: 'User deleted' });
};

module.exports = {
  list: withAuth(withErrorHandler('List users', list)),
  create: withAuth(withErrorHandler('Create user', create)),
  update: withAuth(withErrorHandler('Update user', update)),
  remove: withAuth(withErrorHandler('Delete user', remove)),
};
