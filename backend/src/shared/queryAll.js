const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./dynamo');

/**
 * Execute a paginated DynamoDB Query, collecting all pages into a single array.
 */
const queryAll = async (params) => {
  const items = [];
  let lastKey;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new QueryCommand(params),
    );
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

  return items;
};

/**
 * Execute a paginated DynamoDB Scan, collecting all pages into a single array.
 */
const scanAll = async (params) => {
  const items = [];
  let lastKey;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new ScanCommand(params),
    );
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

  return items;
};

module.exports = { queryAll, scanAll };
