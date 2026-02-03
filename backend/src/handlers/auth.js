const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { docClient, TABLE_NAME } = require('../lib/dynamo');
const { success, error } = require('../lib/response');
const { AppError } = require('../lib/errors');
const { loginSchema } = require('../validators/auth');

const JWT_SECRET = process.env.JWT_SECRET;
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
  try {
    const body = JSON.parse(event.body || '{}');

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues[0]?.message || 'Invalid data';
      return error(message, 400);
    }

    const { email, password } = result.data;

    const user = await findUserByEmail(email);
    if (!user) {
      return error('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return error('Invalid credentials', 401);
    }

    const token = generateToken(user);

    return success({
      token,
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    console.error('Login error:', err);
    return error('Internal server error', 500);
  }
};

module.exports = { login };
