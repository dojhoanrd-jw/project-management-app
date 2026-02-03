const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const success = (body, statusCode = 200) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

const error = (message, statusCode = 500) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
});

module.exports = { success, error, CORS_HEADERS };
