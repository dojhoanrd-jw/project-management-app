const { AppError, ValidationError } = require('./errors');

const success = (body, statusCode = 200) => ({
  statusCode,
  body: JSON.stringify(body),
});

const error = (message, statusCode = 500) => ({
  statusCode,
  body: JSON.stringify({ error: message }),
});

const withErrorHandler = (label, handler) => async (event) => {
  try {
    return await handler(event);
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    if (err.name === 'ConditionalCheckFailedException') {
      return error('Resource not found', 404);
    }
    console.error(`${label} error:`, err);
    return error('Internal server error', 500);
  }
};

const parseBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    throw new ValidationError('Invalid JSON body');
  }
};

module.exports = { success, error, withErrorHandler, parseBody };
