const jwt = require('jsonwebtoken');
const { error } = require('../lib/response');

const JWT_SECRET = process.env.JWT_SECRET;

const extractToken = (headers) => {
  const authorization = headers?.authorization || headers?.Authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice(7);
};

const withAuth = (handler) => async (event) => {
  const token = extractToken(event.headers);

  if (!token) {
    return error('Missing authentication token', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    event.user = decoded;
    return handler(event);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error('Token expired', 401);
    }
    return error('Invalid token', 401);
  }
};

module.exports = { withAuth };
