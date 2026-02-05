const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AppData-prod';

const client = new DynamoDBClient({
  region: 'localhost',
  endpoint: 'http://localhost:8000',
});

const createTable = async () => {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table "${TABLE_NAME}" already exists. Skipping creation.`);
    return;
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') throw err;
  }

  await client.send(new CreateTableCommand({
    TableName: TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  }));

  console.log(`Table "${TABLE_NAME}" created successfully.`);
};

createTable().catch((err) => {
  console.error('Failed to create table:', err.message);
  process.exit(1);
});
