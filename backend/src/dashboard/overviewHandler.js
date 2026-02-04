const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');
const { getDateRange, fetchAllItems, filterByPeriod, parsePeriod } = require('./shared');

const getUniqueAssignees = (tasks) => {
  const ids = new Set();
  for (const t of tasks) {
    if (t.assigneeId) ids.add(t.assigneeId);
  }
  return ids.size;
};

const calcPercent = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
};

const overview = async (event) => {
  const { userId } = event.user;
  const period = parsePeriod(event.queryStringParameters);
  const dateRange = getDateRange(period);

  const [projects, allTasks] = await Promise.all([
    fetchAllItems(userId, 'PROJECT#'),
    fetchAllItems(userId, 'TASK#'),
  ]);

  const currentTasks = filterByPeriod(allTasks, dateRange.start);
  const currentProjects = filterByPeriod(projects, dateRange.start);

  const previousTasks = allTasks.filter(
    (t) => t.createdAt >= dateRange.prevStart && t.createdAt < dateRange.prevEnd,
  );
  const previousProjects = projects.filter(
    (p) => p.createdAt >= dateRange.prevStart && p.createdAt < dateRange.prevEnd,
  );

  const currentHours = currentTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const previousHours = previousTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  return success({
    period,
    totalProjects: projects.length,
    teamResourcesCount: getUniqueAssignees(allTasks),
    growth: {
      projectsCreated: {
        current: currentProjects.length,
        previous: previousProjects.length,
        percent: calcPercent(currentProjects.length, previousProjects.length),
      },
      hoursLogged: {
        current: currentHours,
        previous: previousHours,
        percent: calcPercent(currentHours, previousHours),
      },
      teamMembers: {
        current: getUniqueAssignees(currentTasks),
        previous: getUniqueAssignees(previousTasks),
        percent: calcPercent(
          getUniqueAssignees(currentTasks),
          getUniqueAssignees(previousTasks),
        ),
      },
    },
  });
};

module.exports = { overview: withAuth(withErrorHandler('Dashboard overview', overview)) };
