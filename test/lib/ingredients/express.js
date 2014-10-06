var assert = require('assert');
var path = require('path');
var utils = require('../../_utils/testingUtils');
var request = require('supertest');
var fs = require('fs');

var binPath = utils.binPath;
var tempDir = utils.tempDir;
var cleanup = utils.cleanup;
var createEnvironment = utils.createEnvironment;
var npmInstall = utils.npmInstall;
var parseCreatedFiles = utils.parseCreatedFiles;
var run = utils.run;

// Express

describe('express',function(){

  describe('(no args)',function(){
    var dir;
    var files;

    before(function (done) {
      createEnvironment(function (err, newDir) {
        if (err) return done(err);
        dir = newDir;
        done();
      });
    });

    after(function (done) {
      this.timeout(30000);
      cleanup(done);
    });

    it('should create a basic app', function (done) {
      run(dir, ['express'], function (err, stdout) {
        if (err) return done(err);
        files = parseCreatedFiles(stdout, dir);
        assert.equal(files.length, 16);
        done();
      });
    });

    it('should have basic files', function () {
      assert.notEqual(files.indexOf('bin/www'), -1);
      assert.notEqual(files.indexOf('app.js'), -1);
      assert.notEqual(files.indexOf('package.json'), -1);
    });

    it('should have ejs templates', function () {
      assert.notEqual(files.indexOf('views/error.ejs'), -1);
      assert.notEqual(files.indexOf('views/index.ejs'), -1);
    });

    it('should have installable dependencies', function (done) {
      this.timeout(30000);
      npmInstall(dir, done);
    });

    it('should export an express app from app.js', function () {
      var file = path.resolve(dir, 'app.js');
      var app = require(file);
      assert.equal(typeof app, 'function');
      assert.equal(typeof app.handle, 'function');
    });

    it('should respond to HTTP request', function (done) {
      var file = path.resolve(dir, 'app.js');
      var app = require(file);

      request(app)
      .get('/')
      .expect(200, /<title>Mise<\/title>/, done);
    });
  });

// Disabled for now, as we don't support other templates until later.
  // describe('--hbs', function () {
  //   var dir;
  //   var files;
  //
  //   before(function (done) {
  //     createEnvironment(function (err, newDir) {
  //       if (err) return done(err);
  //       dir = newDir;
  //       done();
  //     });
  //   });
  //
  //   after(function (done) {
  //     this.timeout(30000);
  //     cleanup(dir, done);
  //   });
  //
  //   it('should create basic app with hbs templates', function (done) {
  //     run(dir, ['express','--hbs'], function (err, stdout) {
  //       if (err) return done(err);
  //       files = parseCreatedFiles(stdout, dir);
  //       assert.equal(files.length, 19);
  //       done();
  //     });
  //   });
  //
  //   it('should have basic files', function () {
  //     assert.notEqual(files.indexOf('bin/www'), -1);
  //     assert.notEqual(files.indexOf('app.js'), -1);
  //     assert.notEqual(files.indexOf('package.json'), -1);
  //   });
  //
  //   it('should have hbs templates', function () {
  //     assert.notEqual(files.indexOf('views/error.hbs'), -1);
  //     assert.notEqual(files.indexOf('views/index.hbs'), -1);
  //     assert.notEqual(files.indexOf('views/layout.hbs'), -1);
  //   });
  //
  //   it('should have installable dependencies', function (done) {
  //     this.timeout(30000);
  //     npmInstall(dir, done);
  //   });
  //
  //   it('should export an express app from app.js', function () {
  //     var file = path.resolve(dir, 'app.js');
  //     var app = require(file);
  //     assert.equal(typeof app, 'function');
  //     assert.equal(typeof app.handle, 'function');
  //   });
  //
  //   it('should respond to HTTP request', function (done) {
  //     var file = path.resolve(dir, 'app.js');
  //     var app = require(file);
  //
  //     request(app)
  //     .get('/')
  //     .expect(200, /<title>Mise<\/title>/, done);
  //   });
  // });
});
