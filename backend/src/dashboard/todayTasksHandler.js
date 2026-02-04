const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');
const { fetchAllItems } = require('./shared');

const COMPLETED_STATUSES = new Set(['completed', 'approved']);

const todayTasks = async (event) => {
  const { userId } = event.user;

  const allTasks = await fetchAllItems(userId, 'TASK#');

  const today = new Date().toISOString().split('T')[0];

  const tasks = allTasks
    .filter((t) => t.dueDate === today && t.status !== 'completed')
    .map((t) => ({
      taskId: t.taskId,
      title: t.title,
      status: t.status,
      priority: t.priority,
      category: t.category,
      projectName: t.projectName,
      dueDate: t.dueDate,
      assigneeName: t.assigneeName,
      isCompleted: COMPLETED_STATUSES.has(t.status),
    }));

  // Category counts for tabs
  const categoryCounts = { all: tasks.length };
  for (const task of tasks) {
    categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
  }

  return success({ todayTasks: tasks, categoryCounts });
};

module.exports = { todayTasks: withAuth(withErrorHandler('Dashboard today-tasks', todayTasks)) };
