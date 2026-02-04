const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');
const { fetchAllItems, calcWeightedProgress, calcProjectHealth } = require('./shared');

const projectsSummary = async (event) => {
  const { userId } = event.user;

  const [projects, allTasks] = await Promise.all([
    fetchAllItems(userId, 'PROJECT#'),
    fetchAllItems(userId, 'TASK#'),
  ]);

  const summary = projects.map((project) => {
    const projectTasks = allTasks.filter((t) => t.projectId === project.projectId);
    const completedTasks = projectTasks.filter((t) => t.status === 'completed');

    return {
      projectId: project.projectId,
      name: project.name,
      status: project.status,
      progress: calcProjectHealth(projectTasks, project.dueDate, project.createdAt),
      dueDate: project.dueDate,
      managerName: project.managerName,
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      completionPercent: calcWeightedProgress(projectTasks),
    };
  });

  return success({ projectsSummary: summary });
};

module.exports = { projectsSummary: withAuth(withErrorHandler('Dashboard projects-summary', projectsSummary)) };
