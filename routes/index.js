var router = require('express').Router();

const submitRequestValidations = require('../validators/submit');
const acknowledgmentValidations = require('../validators/acknowledgment');
const processValidations = require('../utils/processValidations');

const {
  indexController,
  acknowledgmentController,
  submitController,
  successController,
  verificationController,
} = require('../controllers');
const verificationValidations = require('../validators/verification');

router.get('/', indexController);
router.post(
  '/submit',
  submitRequestValidations,
  processValidations,
  submitController
);
router.post(
  '/verify',
  verificationValidations,
  processValidations,
  verificationController
);
router.post(
  '/ack',
  acknowledgmentValidations,
  processValidations,
  acknowledgmentController
);
router.get(
  '/success',
  (req, res, next) => {
    if (!req.session.redirected) {
      return res.redirect('/');
    }
    next();
  },
  successController
);

module.exports = router;
