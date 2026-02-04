const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const isLocal = process.argv.includes('--local');

const client = new DynamoDBClient(
  isLocal
    ? { region: 'localhost', endpoint: 'http://localhost:8000' }
    : { region: 'us-east-2' }
);

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AppData';

async function fetchAll(pk, skPrefix) {
  const items = [];
  let lastKey;
  do {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': pk, ':sk': skPrefix },
    };
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const { Items = [], LastEvaluatedKey } = await docClient.send(new QueryCommand(params));
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function cleanup() {
  // Get the userId from args or scan for users
  const userId = process.argv.find((a) => a.startsWith('--user='))?.split('=')[1];

  if (!userId) {
    console.log('Usage: node cleanup-orphan-tasks.js [--local] --user=USER#<email>');
    console.log('Example: node cleanup-orphan-tasks.js --local --user=USER#admin@demo.com');
    process.exit(1);
  }

  console.log(`Scanning for user: ${userId}`);

  const [projects, tasks] = await Promise.all([
    fetchAll(userId, 'PROJECT#'),
    fetchAll(userId, 'TASK#'),
  ]);

  const projectIds = new Set(projects.map((p) => p.projectId));

  const orphans = tasks.filter((t) => !projectIds.has(t.projectId));

  console.log(`Found ${projects.length} projects, ${tasks.length} tasks`);
  console.log(`Orphan tasks (no matching project): ${orphans.length}`);

  if (orphans.length === 0) {
    console.log('Nothing to clean up.');
    return;
  }

  orphans.forEach((t) => {
    console.log(`  - "${t.title}" (projectId: ${t.projectId})`);
  });

  // Delete orphans in batches of 25
  for (let i = 0; i < orphans.length; i += 25) {
    const chunk = orphans.slice(i, i + 25);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk.map((task) => ({
            DeleteRequest: {
              Key: { PK: userId, SK: `TASK#${task.taskId}` },
            },
          })),
        },
      })
    );
    console.log(`Deleted batch ${Math.floor(i / 25) + 1} (${chunk.length} tasks)`);
  }

  console.log(`Done. Deleted ${orphans.length} orphan tasks.`);
}

cleanup().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
