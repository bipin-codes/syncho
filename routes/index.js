var router = require('express').Router();
const {
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const {
  PutItemCommand,
  GetItemCommand,
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');

const { submitValidations, validations } = require('../validators/submit');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const REGION = 'ap-south-1';
const BUCKET_NAME = 'syncho';
const TABLE_NAME = 'syncho';

router.get('/', (req, res, next) => {
  res.clearCookie('url');
  res.render('index', { title: 'Syncho' });
});

router.post(
  '/submit',
  validations,
  submitValidations,
  async (req, res, next) => {
    const { from, to, fileMetadata } = req.body;
    const createdTime = new Date().toISOString();
    const key = `${fileMetadata.name}_${Date.now()}`;

    const s3 = new S3Client({ region: REGION });
    const dynamoDB = new DynamoDBClient({ region: REGION });

    const puCommand = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });

    try {
      //get signedURLs for upload and download...
      const uploadURL = await getSignedUrl(s3, puCommand, {
        expiresIn: 5 * 60, //10 minutes..
      });
      const downloadURL = await getSignedUrl(s3, getCommand, {
        expiresIn: 3 * 60 * 60, //3 hours...
      });

      //save record in dynamodb...

      await dynamoDB.send(
        new PutItemCommand({
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
              N: (Math.floor(Date.now() / 1000) + 3 * 60 * 60).toString(),
            }, //3 hours from current time...
          },
        })
      );

      res.status(201).json({ msg: 'Success!', data: { uploadURL, key } });
    } catch (e) {
      console.log(e);
      let msg = 'Internal Server Error!';

      if (e.errno === -3008) {
        msg = 'There is some network issue, please try later.'; //If the server having network issue
      }

      res
        .status(500)
        .json({ msg: 'Failed to process your request!', data: { cause: msg } });
    }
  }
);

// TODO : Add validations to this handler...
router.post('/ack', async (req, res, next) => {
  const { key } = req.body;

  const command = new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { file_id: { S: key } },
  });
  const dynamoClient = new DynamoDBClient({ region: REGION });
  const sesClient = new SESClient({ region: REGION });

  const { Item } = await dynamoClient.send(command);
  const { downloadURL, to, from } = unmarshall(Item);

  await sesClient.send(
    new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Source: from,
      Message: {
        Subject: { Data: 'Download link...' },
        Body: { Html: { Data: `<a href=${downloadURL}>Download File</a>` } },
      },
    })
  );

  res.cookie('url', downloadURL);
  res.redirect(`/success`);
});

router.get('/success', (req, res, next) => {
  const { url } = req.cookies;
  try {
    res.render('success', { url });
  } catch (e) {
    res.render('error');
  }
});

module.exports = router;
