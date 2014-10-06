var assert = require('assert');
var path = require('path');
var utils = require('../../_utils/testingUtils');
var fileUtils = require('../../../lib/utils');
var request = require('supertest');
var fs = require('fs');

var cleanup = utils.cleanup;
var createEnvironment = utils.createEnvironment;
var npmInstall = utils.npmInstall;
var parseCreatedFiles = utils.parseCreatedFiles;
var run = utils.run;

describe('gulp',function(){
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

  it('should create the right number of files',function(done){
    run(dir, ['gulp'], function (err, stdout) {
      if (err) return done(err);
      files = parseCreatedFiles(stdout, dir);
      assert.equal(files.length,3);
      done();
    });
  });

  it('should generate a gulpfile & gulp folder', function(){
    assert.notEqual(files.indexOf('gulpfile.js'), -1);
    assert(fs.existsSync(path.join(dir,'gulp')));
  });

  it('should update package.json file to include gulp',function(){
    var json = JSON.parse(fs.readFileSync(path.join(dir,'package.json')));
    assert(json.devDependencies);
    assert(json.devDependencies.gulp);
  });

  it('should run npm install without failing',function(done){
    this.timeout(30000);
    npmInstall(dir, done);
  });

  describe('when running over an existing app',function(){

    var proc;
    var expressDir;

    before(function (done) {
      this.timeout(30000);
      createEnvironment(function (err, newDir) {
        if (err) return done(err);
        expressDir = newDir;
        run(expressDir, ['express','gulp'], function (err, stdout) {
          if (err) return done(err);
          utils.npmInstall(expressDir,done);
        });
      });
    });

    after(function (done) {
      this.timeout(30000);
      cleanup(done);
      if(proc) proc.kill(0);
    });

    it('should automatically pick up other grunt tasks when added',function(done){
      this.timeout(10000);
      var output = '';
      var stderroutput = '';
      fileUtils.copyTemplate('gulp/gulp/task.js', expressDir + '/gulp/task.js');
      proc = utils.shell(expressDir,'gulp',['{taskname}'],function(data){
        output += data.toString();
        if(output.match(/Finished '{taskname}' after/i)){
          // successfully ran the task
          proc.kill(0);
          proc = null;
          done();
        };
      },function(stderr){
        stderroutput += stderr.toString();
      },function(err){
        assert(!(stderroutput.trim().length),'expected to not receive any stderr messages when running the new task ('+stderroutput+')');
        if(err) throw err;
        assert(output.match(/Finished '{taskname}' after/i));
      });
    });

    it('should start the server when running gulp',function(done){
      this.timeout(10000);
      var output = '';
      var stderroutput = '';
      proc = utils.shell(expressDir,'gulp',function(data){
        output += data.toString();
        if(output.match(/Finished 'default' after/i)){
          // successfully ran server
          proc.kill(0);
          proc = null;
          done();
        };
      },function(stderr){
        stderroutput += stderr.toString();
      },function(err){
        assert(!(stderroutput.trim().length),'expected to not receive any stderr messages when starting the server ('+stderroutput+')');
        assert(output.match(/Finished 'default' after/i),'unexpected output : ' + output);
        if(err) throw err;
      });
    });
  });

});
