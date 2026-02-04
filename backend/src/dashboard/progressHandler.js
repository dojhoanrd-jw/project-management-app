const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');
const { fetchAllItems, calcProjectHealth } = require('./shared');

const progress = async (event) => {
  const { userId } = event.user;

  const [projects, tasks] = await Promise.all([
    fetchAllItems(userId, 'PROJECT#'),
    fetchAllItems(userId, 'TASK#'),
  ]);

  const totalProjects = projects.length;

  // Project health based on weighted progress vs time elapsed toward due date
  const health = { on_track: 0, at_risk: 0, delayed: 0, completed: 0 };

  for (const project of projects) {
    const projectTasks = tasks.filter((t) => t.projectId === project.projectId);
    const status = calcProjectHealth(projectTasks, project.dueDate, project.createdAt);
    health[status]++;
  }

  // Center %: percentage of projects that are fully completed
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
