const { GetCommand, BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLE_NAME } = require('./dynamo');
const { queryAll } = require('./queryAll');
const { ForbiddenError } = require('./errors');

/**
 * Get all projectIds the user is a member of.
 */
const fetchUserProjectIds = async (email) => {
  const items = await queryAll({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `USER#${email}`, ':sk': 'MEMBER#' },
    ProjectionExpression: 'projectId',
  });
  return items.map((i) => i.projectId);
};

/**
 * Verify that a user is a member of a project. Throws ForbiddenError if not.
 */
const verifyMembership = async (email, projectId) => {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${email}`, SK: `MEMBER#${projectId}` },
    }),
  );

  if (!Item) {
    throw new ForbiddenError('You are not a member of this project');
  }

  return Item;
};

/**
 * Fetch all items under a project partition with a given SK prefix.
 * e.g. fetchProjectItems(projectId, 'TASK#') returns all tasks.
 */
const fetchProjectItems = async (projectId, skPrefix) => {
  return queryAll({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `PROJECT#${projectId}`, ':sk': skPrefix },
  });
};

/**
 * Get a single project's META record.
 */
const fetchProjectMeta = async (projectId) => {
  const { Item } = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PROJECT#${projectId}`, SK: 'META' },
    }),
  );
  return Item || null;
};

/**
 * BatchGet multiple project META records by their projectIds.
 * DynamoDB BatchGetItem limit is 100 keys per request.
 */
const batchGetProjects = async (projectIds) => {
  if (projectIds.length === 0) return [];

  const results = [];
  const chunks = [];
  for (let i = 0; i < projectIds.length; i += 100) {
    chunks.push(projectIds.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    const { Responses } = await docClient.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: chunk.map((id) => ({ PK: `PROJECT#${id}`, SK: 'META' })),
          },
        },
      }),
    );
    if (Responses && Responses[TABLE_NAME]) {
      results.push(...Responses[TABLE_NAME]);
    }
  }

  return results;
};

/**
 * Fetch all members of a project via GSI1.
 */
const fetchProjectMembers = async (projectId) => {
  return queryAll({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
    ExpressionAttributeValues: { ':pk': `PROJECT#${projectId}`, ':sk': 'MEMBER#' },
  });
};

module.exports = {
  fetchUserProjectIds,
  verifyMembership,
  fetchProjectItems,
  fetchProjectMeta,
  batchGetProjects,
  fetchProjectMembers,
};
