const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');
const { SESClient } = require('@aws-sdk/client-ses');

const { REGION } = require('../constants');

const dynamoClient = new DynamoDBClient({ region: REGION });
const sesClient = new SESClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

module.exports = {
  dynamoClient,
  sesClient,
  s3Client,
};
