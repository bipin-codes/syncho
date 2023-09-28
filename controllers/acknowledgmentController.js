const { TABLE_NAME } = require('../constants');
const { convertToHigherForm } = require('../utils');
const { dynamoClient, sesClient } = require('../utils/awsClients');
const {
  createGetItemCommand,
  createSendEmailCommand,
} = require('../utils/commandBuilder');

module.exports = async (req, res) => {
  const { key } = req.body;
  const { Item } = await dynamoClient.send(
    createGetItemCommand(TABLE_NAME, key)
  );
  const { downloadURL, to, from } = convertToHigherForm(Item);
  await sesClient.send(
    createSendEmailCommand(
      [to],
      from,
      'Please find the download link to the file',
      `<a href=${downloadURL}>Download File</a>`
    )
  );
  req.session.redirected = true;
  res.cookie('url', downloadURL).redirect(`/success`);
};
