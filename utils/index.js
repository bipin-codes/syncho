const { unmarshall } = require('@aws-sdk/util-dynamodb');

const getCurrentTimeInString = () => {
  return new Date().toISOString();
};
const getKeyByFilename = (fileName) => {
  return `${fileName}_${Date.now()}`;
};
const convertToHigherForm = (dynamoRecord) => {
  return unmarshall(dynamoRecord);
};

module.exports = {
  getCurrentTimeInString,
  getKeyByFilename,
  convertToHigherForm,
};
