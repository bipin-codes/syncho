const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { BUCKET_NAME, TABLE_NAME } = require('../constants');
const {
  getCurrentTimeInString,
  getKeyByFilename,
  getRandomCode,
} = require('../utils');
const { dynamoClient, sesClient } = require('../utils/awsClients');
const {
  createPutItemCommand,
  createSendEmailCommand,
} = require('../utils/commandBuilder');

module.exports = async (req, res) => {
  const { from, to, fileMetadata } = req.body;

  const createdTime = getCurrentTimeInString();
  const key = getKeyByFilename(fileMetadata.name);
  const code = getRandomCode();

  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        file_id: { S: key },
        verificationCode: { S: code },
        is_verified: { BOOL: false },
        from: { S: from },
        to: { S: to },
        meta: { S: JSON.stringify(fileMetadata) },
        createdTime: { S: createdTime },
        expiry: {
          N: (Math.floor(Date.now() / 1000) + 3 * 60 * 60).toString(), //3 hours from current time...
        },
      },
    };

    await dynamoClient.send(createPutItemCommand(params));
    await sesClient.send(
      createSendEmailCommand(
        [from],
        'bipincodes@outlook.com',
        'verification code',
        `verification code : ${code}`
      )
    );
    res.status(201).json({ msg: 'Success!', data: { key } });
  } catch (e) {
    let msg = 'Internal Server Error!';
    if (e.errno === -3008) {
      msg = 'There is some network issue, please try later.'; //If the server having network issue
    }

    res
      .status(500)
      .json({ msg: 'Failed to process your request!', data: { cause: msg } });
  }
};
