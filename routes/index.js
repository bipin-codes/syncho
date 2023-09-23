var router = require('express').Router();

const { submitValidations, validations } = require('../validators/submit');
const indexController = require('../controllers/indexController');
const submitController = require('../controllers/submitController');
const ackController = require('../controllers/ackController');
const successController = require('../controllers/successController');

router.get('/', indexController);
router.post('/submit', validations, submitValidations, submitController);
// TODO : Add validations to this handler...
router.post('/ack', ackController);

router.get('/success', successController);

module.exports = router;
