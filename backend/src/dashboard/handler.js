const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, error } = require('../shared/response');
const { AppError } = require('../shared/errors');
const { withAuth } = require('../auth/middleware');

const HOURS_PER_MONTH = 160;

const PERIOD_MAP = {
  '1month': 1,
  '2months': 2,
  '6months': 6,
  '1year': 12,
  all: null,
};

const getDateRange = (period) => {
  if (!PERIOD_MAP[period] && period !== 'all') period = '1month';

  const now = new Date();
  const months = PERIOD_MAP[period];

  if (!months) return { start: null, end: now.toISOString(), prevStart: null, prevEnd: null };

  const start = new Date(now);
  start.setMonth(start.getMonth() - months);

  const prevStart = new Date(start);
  prevStart.setMonth(prevStart.getMonth() - months);

  return {
    start: start.toISOString(),
    end: now.toISOString(),
    prevStart: prevStart.toISOString(),
    prevEnd: start.toISOString(),
    months,
  };
};

const fetchAllItems = async (userId, skPrefix) => {
  const items = [];
  let lastKey;

  do {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': userId,
        ':sk': skPrefix,
      },
    };
    if (lastKey) params.ExclusiveStartKey = lastKey;

    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new QueryCommand(params)
    );
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

  return items;
};

const filterByPeriod = (items, start) => {
  if (!start) return items;
  return items.filter((item) => item.createdAt >= start);
};

const buildTaskMetrics = (tasks) => {
  const today = new Date().toISOString().split('T')[0];

  return {
    totalTasks: tasks.length,
    todoTasks: tasks.filter((t) => t.status === 'todo').length,
    inProgressTasks: tasks.filter((t) => t.status === 'in_progress').length,
    inReviewTasks: tasks.filter((t) => t.status === 'in_review').length,
    approvedTasks: tasks.filter((t) => t.status === 'approved').length,
    completedTasks: tasks.filter((t) => t.status === 'completed').length,
    overdueTasks: tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate < today
    ).length,
  };
};

const buildProjectsHealth = (projects) => ({
  on_track: projects.filter((p) => p.progress === 'on_track').length,
  at_risk: projects.filter((p) => p.progress === 'at_risk').length,
  delayed: projects.filter((p) => p.progress === 'delayed').length,
  completed: projects.filter((p) => p.progress === 'completed').length,
});

const buildProjectsSummary = (projects, allTasks) => {
  return projects.map((project) => {
    const projectTasks = allTasks.filter((t) => t.projectId === project.projectId);
    const completedTasks = projectTasks.filter((t) => t.status === 'completed');
    const totalHours = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const completedHours = completedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return {
      projectId: project.projectId,
      name: project.name,
      status: project.status,
      progress: project.progress,
      dueDate: project.dueDate,
      managerName: project.managerName,
      totalHours,
      completedHours,
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      completionPercent: projectTasks.length > 0
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0,
    };
  });
};

const buildTeamResources = (tasks, months) => {
  const resourceMap = {};

  for (const task of tasks) {
    if (!task.assigneeId) continue;

    if (!resourceMap[task.assigneeId]) {
      resourceMap[task.assigneeId] = {
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        totalHours: 0,
        taskCount: 0,
        completedCount: 0,
      };
    }

    const entry = resourceMap[task.assigneeId];
    entry.totalHours += task.estimatedHours || 0;
    entry.taskCount += 1;
    if (task.status === 'completed') entry.completedCount += 1;
  }

  const periodMonths = months || 1;
  const totalAvailable = HOURS_PER_MONTH * periodMonths;

  return Object.values(resourceMap).map((r) => ({
    ...r,
    availableHours: Math.max(0, totalAvailable - r.totalHours),
    utilizationPercent: Math.min(100, Math.round((r.totalHours / totalAvailable) * 100)),
  }));
};

const getUniqueAssignees = (tasks) => {
  const ids = new Set();
  for (const t of tasks) {
    if (t.assigneeId) ids.add(t.assigneeId);
  }
  return ids.size;
};

const buildGrowth = ({ currentTasks, previousTasks, currentProjects, previousProjects }) => {
  const calcPercent = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const currentCreated = currentTasks.length;
  const previousCreated = previousTasks.length;

  const currentCompleted = currentTasks.filter((t) => t.status === 'completed').length;
  const previousCompleted = previousTasks.filter((t) => t.status === 'completed').length;

  const currentHours = currentTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const previousHours = previousTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  const currentProjectCount = currentProjects.length;
  const previousProjectCount = previousProjects.length;

  const currentTeam = getUniqueAssignees(currentTasks);
  const previousTeam = getUniqueAssignees(previousTasks);

  return {
    tasksCreated: {
      current: currentCreated,
      previous: previousCreated,
      percent: calcPercent(currentCreated, previousCreated),
    },
    tasksCompleted: {
      current: currentCompleted,
      previous: previousCompleted,
      percent: calcPercent(currentCompleted, previousCompleted),
    },
    hoursLogged: {
      current: currentHours,
      previous: previousHours,
      percent: calcPercent(currentHours, previousHours),
    },
    projectsCreated: {
      current: currentProjectCount,
      previous: previousProjectCount,
      percent: calcPercent(currentProjectCount, previousProjectCount),
    },
    teamMembers: {
      current: currentTeam,
      previous: previousTeam,
      percent: calcPercent(currentTeam, previousTeam),
    },
  };
};

const buildTodayTasks = (tasks) => {
  const today = new Date().toISOString().split('T')[0];

  return tasks
    .filter((t) => t.dueDate === today && t.status !== 'completed')
    .map((t) => ({
      taskId: t.taskId,
      title: t.title,
      projectId: t.projectId,
      projectName: t.projectName,
      status: t.status,
      priority: t.priority,
      category: t.category,
      assigneeName: t.assigneeName,
      estimatedHours: t.estimatedHours,
      dueDate: t.dueDate,
    }));
};

const buildWorkload = (tasks, projects) => {
  const projectMap = {};

  for (const project of projects) {
    projectMap[project.projectId] = {
      projectId: project.projectId,
      projectName: project.name,
      members: {},
    };
  }

  for (const task of tasks) {
    if (!task.assigneeId || !task.projectId) continue;

    const project = projectMap[task.projectId];
    if (!project) continue;

    if (!project.members[task.assigneeId]) {
      project.members[task.assigneeId] = {
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        taskCount: 0,
      };
    }

    project.members[task.assigneeId].taskCount += 1;
  }

  return Object.values(projectMap)
    .map((p) => ({
      projectId: p.projectId,
      projectName: p.projectName,
      members: Object.values(p.members),
    }))
    .filter((p) => p.members.length > 0);
};

const buildRecentTasks = (tasks) =>
  tasks
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10)
    .map((t) => ({
      taskId: t.taskId,
      title: t.title,
      projectId: t.projectId,
      projectName: t.projectName,
      status: t.status,
      priority: t.priority,
      category: t.category,
      assigneeName: t.assigneeName,
      estimatedHours: t.estimatedHours,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
    }));

const metrics = async (event) => {
  try {
    const { userId } = event.user;
    const params = event.queryStringParameters || {};
    const period = params.period || '1month';
    const dateRange = getDateRange(period);

    const [projects, allTasks] = await Promise.all([
      fetchAllItems(userId, 'PROJECT#'),
      fetchAllItems(userId, 'TASK#'),
    ]);

    const filteredTasks = filterByPeriod(allTasks, dateRange.start);
    const filteredProjects = filterByPeriod(projects, dateRange.start);
    const previousTasks = dateRange.prevStart
      ? allTasks.filter((t) => t.createdAt >= dateRange.prevStart && t.createdAt < dateRange.prevEnd)
      : [];
    const previousProjects = dateRange.prevStart
      ? projects.filter((p) => p.createdAt >= dateRange.prevStart && p.createdAt < dateRange.prevEnd)
      : [];

    return success({
      period,
      metrics: {
        totalProjects: projects.length,
        ...buildTaskMetrics(filteredTasks),
      },
      projectsHealth: buildProjectsHealth(projects),
      projectsSummary: buildProjectsSummary(projects, allTasks),
      todayTasks: buildTodayTasks(allTasks),
      recentTasks: buildRecentTasks(filteredTasks),
      teamResources: buildTeamResources(filteredTasks, dateRange.months),
      workload: buildWorkload(allTasks, projects),
      growth: buildGrowth({
        currentTasks: filteredTasks,
        previousTasks,
        currentProjects: filteredProjects,
        previousProjects,
      }),
    });
  } catch (err) {
    if (err instanceof AppError) {
      return error(err.message, err.statusCode);
    }
    console.error('Dashboard metrics error:', err);
    return error('Internal server error', 500);
  }
};

module.exports = {
  metrics: withAuth(metrics),
};
