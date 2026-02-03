const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const isOffline = process.env.IS_OFFLINE === 'true';

const client = new DynamoDBClient(
  isOffline
    ? { region: 'localhost', endpoint: 'http://localhost:8000' }
    : {}
);

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AppData';

module.exports = { docClient, TABLE_NAME };
