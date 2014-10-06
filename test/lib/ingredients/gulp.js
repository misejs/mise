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
          utils.npmInstall(expressDir,function(){
            console.log('nuking...');
            utils.nukePort(3000,done);
          });
        });
      });
    });

    after(function (done) {
      this.timeout(30000);
      cleanup(done);
    });

    it('should automatically pick up other grunt tasks when added',function(done){
      this.timeout(10000);
      var completed = false;
      var complete = function(err){
        if(proc){
          proc.kill(0);
          proc = null;
        }
        setTimeout(function(){
          if(!completed){
            completed = true;
            done(err);
          }
        },500);
      }
      var output = '';
      var stderroutput = '';
      fileUtils.copyTemplate('gulp/gulp/task.js', expressDir + '/gulp/task.js');
      proc = utils.shell(expressDir,'gulp',['{taskname}'],function(data){
        output += data.toString();
        if(output.match(/Finished '{taskname}' after/i)){
          // successfully ran the task
          setTimeout(function(){
            complete();
          },500);
        };
      },function(stderr){
        stderroutput += stderr.toString();
      },function(err){
        if(err){
          console.error(stderroutput,output);
        } else {
          assert(!(stderroutput.trim().length),'expected to not receive any stderr messages when starting the server ('+stderroutput+')');
          assert(output.match(/Finished '{taskname}' after/i));
        }
        complete(err);
      });
    });

    it('should start the server when running gulp',function(done){
      this.timeout(10000);
      var completed = false;
      var complete = function(err){
        if(proc){
          proc.kill(0);
          proc = null;
        }
        setTimeout(function(){
          if(!completed){
            completed = true;
            done(err);
          }
        },500);
      }
      var output = '';
      var stderroutput = '';
      proc = utils.shell(expressDir,'gulp',function(data){
        output += data.toString();
        if(output.match(/Finished 'default' after/i)){
          // successfully ran server
          setTimeout(function(){
            complete();
          },500);
        };
      },function(stderr){
        stderroutput += stderr.toString();
      },function(err){
        if(err){
          console.error(stderroutput,output);
        } else {
          assert(!(stderroutput.trim().length),'expected to not receive any stderr messages when starting the server ('+stderroutput+')');
          assert(output.match(/Finished '{taskname}' after/i));
        }
        complete(err);
      });
    });
  });

});
