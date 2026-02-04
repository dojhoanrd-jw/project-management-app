const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');

const HOURS_PER_MONTH = 160;

const PERIOD_MAP = {
  '7days': { months: 0, days: 7 },
  '1month': { months: 1, days: 0 },
  '3months': { months: 3, days: 0 },
  '6months': { months: 6, days: 0 },
  '1year': { months: 12, days: 0 },
};

const getDateRange = (period) => {
  const config = PERIOD_MAP[period] || PERIOD_MAP['1month'];
  const now = new Date();

  const start = new Date(now);
  if (config.days > 0) {
    start.setDate(start.getDate() - config.days);
  } else {
    start.setMonth(start.getMonth() - config.months);
  }

  const prevStart = new Date(start);
  if (config.days > 0) {
    prevStart.setDate(prevStart.getDate() - config.days);
  } else {
    prevStart.setMonth(prevStart.getMonth() - config.months);
  }

  const months = config.months || config.days / 30;

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
      new QueryCommand(params),
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

const parsePeriod = (queryStringParameters) => {
  const period = (queryStringParameters && queryStringParameters.period) || '1month';
  return PERIOD_MAP[period] ? period : '1month';
};

module.exports = {
  HOURS_PER_MONTH,
  PERIOD_MAP,
  getDateRange,
  fetchAllItems,
  filterByPeriod,
  parsePeriod,
};
