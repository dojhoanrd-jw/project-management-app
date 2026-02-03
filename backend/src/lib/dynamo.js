const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const useDynamoLocal = process.env.DYNAMO_LOCAL === 'true';

const client = new DynamoDBClient(
  useDynamoLocal
    ? { region: 'localhost', endpoint: 'http://localhost:8000' }
    : { region: process.env.AWS_REGION || 'us-east-2' }
);

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'AppData';

module.exports = { docClient, TABLE_NAME };
