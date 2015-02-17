var passport = require('passport');
var express = require('express');
var oauth2 = require('{{oauth2Path}}');
var router = express.Router();

require('{{authPath}}');

router.get('{{authDialogURL}}', oauth2.authorization);
router.post('{{authDialogURL}}/decision', oauth2.decision);
router.post('/oauth/token', oauth2.token);

module.exports = router;
