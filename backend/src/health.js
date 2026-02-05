module.exports.status = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    service: 'PM',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    documentation: 'This is a REST API for the Project Management application.',
    endpoints: {
      auth: '/auth/login',
      users: '/users',
      projects: '/projects',
      tasks: '/tasks',
      dashboard: '/dashboard/overview',
    },
  }),
});
