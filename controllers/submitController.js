const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { BUCKET_NAME } = require('../constants');
const { getCurrentTimeInString, getKeyByFilename } = require('../utils');
const { dynamoClient, s3Client } = require('../utils/awsClients');
const {
  createPutObjectCommand,
  createGetObjectCommand,
  createPutItemCommand,
} = require('../utils/commandBuilder');

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

module.exports = async (req, res) => {
  const { from, to, fileMetadata } = req.body;

  const createdTime = getCurrentTimeInString();
  const key = getKeyByFilename(fileMetadata.name);
  const { uploadURL, downloadURL } = await getPresignedURLs(key);

  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        file_id: { S: key },
        uploadURL: { S: uploadURL },
        downloadURL: { S: downloadURL },
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
    res.status(201).json({ msg: 'Success!', data: { uploadURL, key } });
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
