const {
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SendEmailCommand } = require('@aws-sdk/client-ses');

const createPutObjectCommand = (bucketName, key) =>
  new PutObjectCommand({ Bucket: bucketName, Key: key });

const createGetObjectCommand = (bucketName, key) =>
  new GetObjectCommand({ Bucket: bucketName, Key: key });

const createPutItemCommand = (params) => {
  return new PutItemCommand(params);
};

const createGetItemCommand = (tableName, key) => {
  return new GetItemCommand({
    TableName: tableName,
    Key: { file_id: { S: key } },
  });
};

const createSendEmailCommand = (toAdresses, fromAddress, subject, body) => {
  return new SendEmailCommand({
    Destination: { ToAddresses: toAdresses },
    Source: fromAddress,
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: body } },
    },
  });
};

const createUpdateItemCommand = (
  TABLE_NAME,
  key,
  attributeNames,
  attributeValues,
  updateExpression
) => {
  const updateItemParams = {
    TableName: TABLE_NAME,
    Key: { file_id: { S: key } },
    Key: key,
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues,
    UpdateExpression: updateExpression,
  };

  return new UpdateItemCommand(updateItemParams);
};

module.exports = {
  createPutObjectCommand,
  createGetObjectCommand,
  createPutItemCommand,
  createGetItemCommand,
  createSendEmailCommand,
  createUpdateItemCommand,
};
