const { body } = require('express-validator');

const verificationValidations = [
  body('key').trim().notEmpty().isString().withMessage('Invalid Request'),
  body('code').trim().notEmpty().isString().withMessage('Invalid Request'),
];

module.exports = verificationValidations;
