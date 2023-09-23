const { PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

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

module.exports = {
  createPutObjectCommand,
  createGetObjectCommand,
  createPutItemCommand,
  createGetItemCommand,
  createSendEmailCommand,
};
