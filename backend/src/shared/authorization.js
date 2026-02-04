const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('./dynamo');
const { ForbiddenError } = require('./errors');

const requireAdmin = async (email) => {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${email}`, SK: 'PROFILE' },
    }),
  );

  if (!Item || Item.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  return Item;
};

const requireProjectRole = (memberRole, allowedRoles) => {
  if (!allowedRoles.includes(memberRole)) {
    throw new ForbiddenError('Insufficient permissions for this action');
  }
};

module.exports = { requireAdmin, requireProjectRole };
