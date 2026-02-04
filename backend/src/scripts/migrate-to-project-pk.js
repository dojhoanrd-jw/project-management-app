/**
 * Migration script: Converts old user-scoped PK model to project-scoped PK model.
 *
 * Old model:
 *   Projects: PK=USER#<email>, SK=PROJECT#<projectId>
 *   Tasks:    PK=USER#<email>, SK=TASK#<taskId>
 *
 * New model:
 *   Projects: PK=PROJECT#<projectId>, SK=META
 *   Tasks:    PK=PROJECT#<projectId>, SK=TASK#<taskId>
 *   Members:  PK=USER#<email>, SK=MEMBER#<projectId> (GSI1PK=PROJECT#<projectId>, GSI1SK=MEMBER#<email>)
 *
 * Usage:
 *   node src/scripts/migrate-to-project-pk.js --local
 *   node src/scripts/migrate-to-project-pk.js --local --dry-run
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const isLocal = process.argv.includes('--local');
const isDryRun = process.argv.includes('--dry-run');

const client = new DynamoDBClient(
  isLocal
    ? { region: 'localhost', endpoint: 'http://localhost:8000' }
    : { region: 'us-east-2' }
);

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AppData';

const scanAll = async () => {
  const items = [];
  let lastKey;

  do {
    const params = { TableName: TABLE_NAME };
    if (lastKey) params.ExclusiveStartKey = lastKey;

    const { Items = [], LastEvaluatedKey } = await docClient.send(new ScanCommand(params));
    items.push(...Items);
    lastKey = LastEvaluatedKey;
  } while (lastKey);

  return items;
};

const batchDelete = async (keys) => {
  for (let i = 0; i < keys.length; i += 25) {
    const chunk = keys.slice(i, i + 25);
    if (!isDryRun) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: chunk.map((key) => ({
              DeleteRequest: { Key: key },
            })),
          },
        }),
      );
    }
    console.log(`  Deleted ${Math.min(i + 25, keys.length)}/${keys.length} items`);
  }
};

const batchPut = async (items) => {
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    if (!isDryRun) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: chunk.map((item) => ({
              PutRequest: { Item: item },
            })),
          },
        }),
      );
    }
    console.log(`  Written ${Math.min(i + 25, items.length)}/${items.length} items`);
  }
};

const migrate = async () => {
  console.log(`Migration mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Target: ${isLocal ? 'localhost:8000' : 'AWS'}\n`);

  // Step 1: Scan all items
  console.log('Scanning all items...');
  const allItems = await scanAll();
  console.log(`Found ${allItems.length} total items\n`);

  // Classify old-model items
  const oldProjects = allItems.filter(
    (item) => item.SK && item.SK.startsWith('PROJECT#') && item.PK && item.PK.startsWith('USER#'),
  );
  const oldTasks = allItems.filter(
    (item) => item.SK && item.SK.startsWith('TASK#') && item.PK && item.PK.startsWith('USER#'),
  );

  // Check if already migrated items exist
  const newProjects = allItems.filter(
    (item) => item.PK && item.PK.startsWith('PROJECT#') && item.SK === 'META',
  );

  if (newProjects.length > 0 && oldProjects.length === 0) {
    console.log('Data appears to already be migrated. No old-model items found.');
    return;
  }

  console.log(`Old-model projects: ${oldProjects.length}`);
  console.log(`Old-model tasks: ${oldTasks.length}\n`);

  if (oldProjects.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  // Step 2: Build new items
  const newItems = [];
  const deleteKeys = [];

  for (const project of oldProjects) {
    const projectId = project.projectId;
    const ownerEmail = project.PK.replace('USER#', '');

    // New project META record
    const projectMeta = { ...project };
    projectMeta.PK = `PROJECT#${projectId}`;
    projectMeta.SK = 'META';
    delete projectMeta.GSI1PK;
    delete projectMeta.GSI1SK;
    newItems.push(projectMeta);

    // Create membership for the owner
    newItems.push({
      PK: `USER#${ownerEmail}`,
      SK: `MEMBER#${projectId}`,
      GSI1PK: `PROJECT#${projectId}`,
      GSI1SK: `MEMBER#${ownerEmail}`,
      projectId,
      email: ownerEmail,
      name: project.managerName || ownerEmail,
      memberRole: 'owner',
      type: 'membership',
      createdAt: new Date().toISOString(),
    });

    // Create memberships for existing members array
    const members = project.members || [];
    for (const member of members) {
      if (member.email === ownerEmail) continue; // skip duplicate
      newItems.push({
        PK: `USER#${member.email}`,
        SK: `MEMBER#${projectId}`,
        GSI1PK: `PROJECT#${projectId}`,
        GSI1SK: `MEMBER#${member.email}`,
        projectId,
        email: member.email,
        name: member.name,
        memberRole: member.role || 'member',
        type: 'membership',
        createdAt: new Date().toISOString(),
      });
    }

    // Mark old record for deletion
    deleteKeys.push({ PK: project.PK, SK: project.SK });
  }

  for (const task of oldTasks) {
    const projectId = task.projectId;

    if (!projectId) {
      console.warn(`  WARNING: Task ${task.taskId} has no projectId, skipping`);
      continue;
    }

    // New task record under project partition
    const newTask = { ...task };
    newTask.PK = `PROJECT#${projectId}`;
    newTask.SK = `TASK#${task.taskId}`;
    // GSI1 stays the same (ASSIGNEE#email)
    newItems.push(newTask);

    // Mark old record for deletion
    deleteKeys.push({ PK: task.PK, SK: task.SK });
  }

  console.log(`New items to write: ${newItems.length}`);
  console.log(`Old items to delete: ${deleteKeys.length}\n`);

  // Step 3: Write new items
  console.log('Writing new items...');
  await batchPut(newItems);

  // Step 4: Delete old items
  console.log('\nDeleting old items...');
  await batchDelete(deleteKeys);

  console.log(`\n--- Migration ${isDryRun ? '(DRY RUN) ' : ''}complete ---`);
  console.log(`Projects migrated: ${oldProjects.length}`);
  console.log(`Tasks migrated: ${oldTasks.length}`);
  console.log(`Membership records created: ${newItems.length - oldProjects.length - oldTasks.length}`);
};

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
