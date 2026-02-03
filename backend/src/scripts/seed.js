const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const isLocal = process.argv.includes('--local');

const client = new DynamoDBClient(
  isLocal
    ? { region: 'localhost', endpoint: 'http://localhost:8000' }
    : { region: 'us-east-2' }
);

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AppData';

const SEED_USER = {
  email: 'admin@demo.com',
  password: 'admin123',
  name: 'Admin User',
};

const seed = async () => {
  const hashedPassword = await bcrypt.hash(SEED_USER.password, 10);

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${SEED_USER.email}`,
        SK: 'PROFILE',
        email: SEED_USER.email,
        name: SEED_USER.name,
        password: hashedPassword,
        type: 'user',
        createdAt: new Date().toISOString(),
      },
    })
  );

  console.log('Seed completed successfully');
  console.log(`Email: ${SEED_USER.email}`);
  console.log(`Password: ${SEED_USER.password}`);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
