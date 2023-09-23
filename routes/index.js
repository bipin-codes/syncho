var router = require('express').Router();

const submitRequestValidations = require('../validators/submit');
const acknowledgmentValidations = require('../validators/acknowledgment');
const processValidations = require('../utils/processValidations');

const {
  indexController,
  acknowledgmentController,
  submitController,
  successController,
} = require('../controllers');

router.get('/', indexController);

router.post(
  '/submit',
  submitRequestValidations,
  processValidations,
  submitController
);

router.post(
  '/ack',
  acknowledgmentValidations,
  processValidations,
  acknowledgmentController
);

router.get('/success', successController);

module.exports = router;
