var assert = require('assert');
var path = require('path');
var utils = require('../../_utils/testingUtils');
var fileUtils = require('../../../lib/utils');
var fs = require('fs');

var cleanup = utils.cleanup;
var createEnvironment = utils.createEnvironment;
var npmInstall = utils.npmInstall;
var parseCreatedFiles = utils.parseCreatedFiles;
var run = utils.run;

describe('base',function(){
  var dir;
  var files;
  var proc;

  before(function (done) {
    createEnvironment(function (err, newDir) {
      if (err) return done(err);
      dir = newDir;
      done();
    });
  });

  after(function (done) {
    this.timeout(30000);
    cleanup(dir, done);
    if(proc) proc.kill(0);
  });


});
