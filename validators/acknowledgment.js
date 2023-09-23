const { body } = require('express-validator');

const acknowledgmentValidations = [
  body('key').trim().notEmpty().isString().withMessage('Invalid Request'),
];

module.exports = acknowledgmentValidations;
