const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { TABLE_NAME } = require('../constants');
const {
  createGetItemCommand,
  createUpdateItemCommand,
} = require('../utils/commandBuilder');
const { dynamoClient } = require('../utils/awsClients');
const { getPresignedURLs } = require('../utils');

const isValidCode = async (key, code) => {
  const { Item } = await dynamoClient.send(
    createGetItemCommand(TABLE_NAME, key)
  );
  const { verificationCode: codeInDb } = unmarshall(Item);
  return code === codeInDb;
};

module.exports = async (req, res) => {
  const { code, key } = req.body;

  const { downloadURL, uploadURL } = await getPresignedURLs(key);

  if (!isValidCode(key, code)) {
    res.status(403).json({ message: 'Invalid verification code!' });
    return;
  }

  await dynamoClient.send(
    createUpdateItemCommand(
      TABLE_NAME,
      { file_id: { S: key } },
      {
        '#uURL': 'uploadURL',
        '#dURL': 'downloadURL',
      },
      {
        ':uURL': {
          S: uploadURL,
        },
        ':dURL': {
          S: downloadURL,
        },
      },
      'SET #uURL = :uURL, #dURL = :dURL'
    )
  );
  res.status(200).json({
    message: 'Verified Successfully!',
    data: { downloadURL, uploadURL, key },
  });
};
