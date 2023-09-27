const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { TABLE_NAME } = require('../constants');
const {
  createGetItemCommand,
  createUpdateItemCommand,
} = require('../utils/commandBuilder');
const { dynamoClient } = require('../utils/awsClients');
const { getPresignedURLs } = require('../utils');
const InvalidKeyException = require('../utils/errors/InvalidKeyException');
const InvalidVerificationCodeException = require('../utils/errors/InvalidVerificationCodeException');

const validateCode = async (key, code) => {
  const { Item } = await dynamoClient.send(
    createGetItemCommand(TABLE_NAME, key)
  );

  if (!Item)
    return Promise.reject(new InvalidKeyException('Invalid Key!', 400));

  const { verificationCode: codeInDb } = unmarshall(Item);

  if (code !== codeInDb) {
    return Promise.reject(
      new InvalidVerificationCodeException('Invalid verification code', 401)
    );
  }

  return Promise.resolve(true);
};

module.exports = async (req, res, next) => {
  const { code, key } = req.body;

  const { downloadURL, uploadURL } = await getPresignedURLs(key);
  try {
    await validateCode(key, code);
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
    req.session.redirected = true;
    res.status(200).json({
      message: 'Verified Successfully!',
      data: { downloadURL, uploadURL, key },
    });
  } catch (e) {
    next(e);
  }
};
