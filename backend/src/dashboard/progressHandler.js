const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');
const { fetchAllItems } = require('./shared');

const progress = async (event) => {
  const { userId } = event.user;

  const projects = await fetchAllItems(userId, 'PROJECT#');

  const health = {
    on_track: projects.filter((p) => p.progress === 'on_track').length,
    at_risk: projects.filter((p) => p.progress === 'at_risk').length,
    delayed: projects.filter((p) => p.progress === 'delayed').length,
    completed: projects.filter((p) => p.progress === 'completed').length,
  };

  const totalProjects = projects.length;
  const completedPercent = totalProjects > 0
    ? Math.round((health.completed / totalProjects) * 100)
    : 0;

  return success({
    totalProjects,
    completedPercent,
    projectsHealth: health,
  });
};

module.exports = { progress: withAuth(withErrorHandler('Dashboard progress', progress)) };
