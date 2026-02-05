const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, withErrorHandler, parseBody } = require('../shared/response');
const { UnauthorizedError, ValidationError } = require('../shared/errors');
const { withAuth } = require('./middleware');
const { loginSchema, changePasswordSchema } = require('./validator');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
const JWT_EXPIRES_IN = '24h';

const findUserByEmail = async (email) => {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${email}`, SK: 'PROFILE' },
    })
  );
  return Item || null;
};

const generateToken = (user) =>
  jwt.sign(
    { userId: user.PK, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const login = async (event) => {
  const body = parseBody(event);

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  const { email, password } = result.data;

  const user = await findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError();
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError();
  }

  const token = generateToken(user);

  return success({
    token,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
};

const changePassword = async (event) => {
  const { email } = event.user;
  const body = parseBody(event);

  const result = changePasswordSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(result.error.issues[0]?.message || 'Invalid data');
  }

  const { currentPassword, newPassword } = result.data;

  const user = await findUserByEmail(email);
  if (!user) throw new UnauthorizedError('User not found');

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new ValidationError('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${email}`, SK: 'PROFILE' },
      UpdateExpression: 'SET #password = :password',
      ExpressionAttributeNames: { '#password': 'password' },
      ExpressionAttributeValues: { ':password': hashedPassword },
    }),
  );

  return success({ message: 'Password changed successfully' });
};

module.exports = {
  login: withErrorHandler('Login', login),
  changePassword: withAuth(withErrorHandler('Change password', changePassword)),
};
