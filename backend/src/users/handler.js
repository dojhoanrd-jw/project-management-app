const bcrypt = require('bcryptjs');
const { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, withErrorHandler, parseBody } = require('../shared/response');
const { ValidationError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');
const { requireAdmin } = require('../shared/authorization');
const { createUserSchema, updateUserSchema } = require('./validator');

const list = async (event) => {
  const params = event.queryStringParameters || {};
  const returnAll = params.all === 'true';

  const items = [];
  let lastKey;

  do {
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: returnAll
        ? '#type = :type'
        : '#type = :type AND (#role = :pm OR #role = :admin)',
      ExpressionAttributeNames: { '#type': 'type', '#name': 'name', '#role': 'role' },
      ExpressionAttributeValues: returnAll
        ? { ':type': 'user' }
        : { ':type': 'user', ':pm': 'project_manager', ':admin': 'admin' },
      ProjectionExpression: 'email, #name, #role',
    };
    if (lastKey) scanParams.ExclusiveStartKey = lastKey;

    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new ScanCommand(scanParams),
    );
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

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
