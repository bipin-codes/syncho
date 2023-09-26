const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { BUCKET_NAME } = require('../constants');
const { s3Client } = require('./awsClients');
const {
  createPutObjectCommand,
  createGetObjectCommand,
} = require('./commandBuilder');

const getCurrentTimeInString = () => {
  return new Date().toISOString();
};
const getKeyByFilename = (fileName) => {
  return `${fileName}_${Date.now()}`;
};
const convertToHigherForm = (dynamoRecord) => {
  return unmarshall(dynamoRecord);
};
const getRandomCode = () => {
  const min = 100000;
  const max = 999999;
  const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomCode.toString();
};

const getPresignedURLs = async (key) => {
  const uploadURL = await getSignedUrl(
    s3Client,
    createPutObjectCommand(BUCKET_NAME, key),
    {
      expiresIn: 5 * 60, //10 minutes..
    }
  );
  const downloadURL = await getSignedUrl(
    s3Client,
    createGetObjectCommand(BUCKET_NAME, key),
    {
      expiresIn: 3 * 60 * 60, //3 hours...
    }
  );
  return { uploadURL, downloadURL };
};

module.exports = {
  getPresignedURLs,
  getCurrentTimeInString,
  getKeyByFilename,
  convertToHigherForm,
  getRandomCode,
};
