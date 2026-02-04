const success = (body, statusCode = 200) => ({
  statusCode,
  body: JSON.stringify(body),
});

const error = (message, statusCode = 500) => ({
  statusCode,
  body: JSON.stringify({ error: message }),
});

module.exports = { success, error };
