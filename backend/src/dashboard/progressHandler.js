const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');
const { fetchAllUserProjects, fetchAllUserTasks, calcProjectHealth } = require('./shared');

const progress = async (event) => {
  const { email } = event.user;

  const [projects, tasks] = await Promise.all([
    fetchAllUserProjects(email),
    fetchAllUserTasks(email),
  ]);

  const totalProjects = projects.length;

  const health = { on_track: 0, at_risk: 0, delayed: 0, completed: 0 };

  for (const project of projects) {
    const projectTasks = tasks.filter((t) => t.projectId === project.projectId);
    const status = calcProjectHealth(projectTasks, project.dueDate, project.createdAt);
    health[status]++;
  }

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
