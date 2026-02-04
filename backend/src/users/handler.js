const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('../shared/dynamo');
const { success, withErrorHandler } = require('../shared/response');
const { withAuth } = require('../auth/middleware');

const list = async (event) => {
  const params = event.queryStringParameters || {};
  const returnAll = params.all === 'true';

  const items = [];
  let lastKey;

  do {
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: returnAll
        ? '#type = :type'
        : '#type = :type AND (#role = :pm OR #role = :admin)',
      ExpressionAttributeNames: { '#type': 'type', '#name': 'name', '#role': 'role' },
      ExpressionAttributeValues: returnAll
        ? { ':type': 'user' }
        : { ':type': 'user', ':pm': 'project_manager', ':admin': 'admin' },
      ProjectionExpression: 'email, #name, #role',
    };
    if (lastKey) scanParams.ExclusiveStartKey = lastKey;

    const { Items = [], LastEvaluatedKey } = await docClient.send(
      new ScanCommand(scanParams),
    );
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

  return success({ users: items });
};

module.exports = {
  list: withAuth(withErrorHandler('List users', list)),
};
