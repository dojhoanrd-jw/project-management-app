const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');
const { fetchAllItems, filterByPeriod, getDateRange, parsePeriod } = require('./shared');

const workload = async (event) => {
  const { userId } = event.user;
  const period = parsePeriod(event.queryStringParameters);
  const dateRange = getDateRange(period);

  const allTasks = await fetchAllItems(userId, 'TASK#');
  const filteredTasks = filterByPeriod(allTasks, dateRange.start);

  // Aggregate totals per member (business logic stays in backend)
  const memberTotals = {};

  for (const task of filteredTasks) {
    if (!task.assigneeId) continue;

    if (!memberTotals[task.assigneeId]) {
      memberTotals[task.assigneeId] = {
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        taskCount: 0,
      };
    }
    memberTotals[task.assigneeId].taskCount += 1;
  }

  return success({
    members: Object.values(memberTotals),
  });
};

module.exports = { workload: withAuth(withErrorHandler('Dashboard workload', workload)) };
