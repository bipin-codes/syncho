const { body, validationResult, check } = require('express-validator');

const validations = [
  body().custom((val) => {
    if (Object.keys(val).length === 0) {
      throw new Error('Invalid request body');
    }
    return true;
  }),
  body('from')
    .trim()
    .notEmpty()
    .withMessage('Send email address cannot be empty.')
    .isEmail()
    .withMessage('Incorrect email address format for the sender.'),
  body('to')
    .trim()
    .notEmpty()
    .withMessage("Receiver's email address cannot be empty.")
    .isEmail()
    .withMessage('Incorrect email address format for the receiver.'),
  body('fileMetadata').notEmpty().isObject().withMessage('Invalid file data'),

  body('fileMetadata').custom((val) => {
    const keys = Object.keys(val);
    if (
      keys.includes('name') &&
      keys.includes('type') &&
      keys.includes('size')
    ) {
      return true;
    }
    throw new Error('Invalid file data is passed');
  }),
  check('fileMetadata.name')
    .notEmpty()
    .isString()
    .withMessage('Invalid file data is passed'),
  check('fileMetadata.type')
    .notEmpty()
    .isString()
    .withMessage('Invalid file data is passed'),
  check('fileMetadata.size')
    .notEmpty()
    .toInt()
    .isNumeric()
    .withMessage('Invalid file data is passed'),
];

const submitValidations = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};
module.exports = { validations, submitValidations };
