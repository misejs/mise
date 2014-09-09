var assert = require('assert');
var utils = require('../_utils/testingUtils');

var cleanup = utils.cleanup;
var createEnvironment = utils.createEnvironment;
var parseCreatedFiles = utils.parseCreatedFiles;
var run = utils.run;

var assertUsage = function(stdout,dir,done){
  var files = parseCreatedFiles(stdout, dir);
  assert.equal(files.length, 0);
  assert.ok(/Usage: mise/.test(stdout));
  assert.ok(/--help/.test(stdout));
  assert.ok(/--version/.test(stdout));
  done();
};

describe('mise(1)', function () {
  before(function (done) {
    this.timeout(30000);
    cleanup(done);
  });

  after(function (done) {
    this.timeout(30000);
    cleanup(done);
  });

  describe('(no args)', function () {
    var dir;

    before(function (done) {
      createEnvironment(function (err, newDir) {
        if (err) return done(err);
        dir = newDir;
        done();
      });
    });

    it('should print options and exit',function(done){
      run(dir,[],function(err,stdout){
        if(err) return done(err);
        assertUsage(stdout,dir,done);
      });
    });
  });

  describe('-h', function () {
    var dir;

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
    });

    it('should print usage', function (done) {
      run(dir, ['-h'], function (err, stdout) {
        if (err) return done(err);
        assertUsage(stdout,dir,done);
      });
    });
  });

  describe('--help', function () {
    var dir;

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
    });

    it('should print usage', function (done) {
      run(dir, ['--help'], function (err, stdout) {
        if (err) return done(err);
        var files = parseCreatedFiles(stdout, dir);
        assert.equal(files.length, 0);
        assert.ok(/Usage: mise/.test(stdout));
        assert.ok(/--help/.test(stdout));
        assert.ok(/--version/.test(stdout));
        done();
      });
    });
  });
});
