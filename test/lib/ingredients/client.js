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

describe('client',function(){
  var dir;

  before(function (done) {
    cleanup(function(){
      createEnvironment(function (err, newDir) {
        if (err) return done(err);
        dir = newDir;
        done();
      });
    });
  });

  after(function (done) {
    this.timeout(3000);
    cleanup(done);
  });

  describe('run client over an existing express & gulp app',function(){
    var files;

    before(function(done){
      run(dir,['./ingredients/express','./ingredients/gulp','./ingredients/client','express','gulp','client'],function(err,stdout){
        if(err) return done(err);
        // wait for a second to make sure everything resolved
        setTimeout(function(){
          files = parseCreatedFiles(stdout, dir);
          done(err);
        },1000);
      });
    });

    it('should create the correct number of files',function(){
      assert.equal(files.length, 31);
    });

    it('should add a build-client.js file to the gulp directory',function(){
      assert.notEqual(files.indexOf('gulp/build-client.js'),-1);
    });

    it('should add a the eggs middleware',function(done){
      fs.readFile(path.join(dir,'app.js'),'utf-8',function(err,appFile){
        if(err) return done(err);
        var pattern = /require\('\.\/lib\/middleware\/eggs-html'\)\(app\);/;
        assert(pattern.test(appFile));
        assert.notEqual(files.indexOf('lib/middleware/eggs-html.js'),-1);
        assert.notEqual(files.indexOf('public/javascripts/viewmodels/home.js'),-1);
        assert.notEqual(files.indexOf('public/javascripts/viewmodels/index.js'),-1);
        assert.notEqual(files.indexOf('public/javascripts/main.js'),-1);
        assert.notEqual(files.indexOf('public/javascripts/routes.js'),-1);
        done();
      });
    });

    it('should update package.json file to include client dependencies',function(done){
      fs.readFile(path.join(dir,'package.json'),'utf-8',function(err,file){
        if(err) return done(err);
        assert(file);
        var json = JSON.parse(file);
        assert(json.dependencies);
        assert(json.dependencies.ejs);
        assert(json.dependencies.cheerio);
        assert(json.dependencies['express-layout']);
        assert(json.dependencies.eggs);
        assert(json.dependencies['jquery-browserify']);
        assert(json.devDependencies);
        assert(json.devDependencies['gulp-browserify']);
        assert(json.devDependencies.gulp);
        assert(json.devDependencies.glob);
        assert(json.devDependencies['gulp-concat']);
        assert(json.devDependencies['gulp-inject']);
        assert(json.scripts);
        assert(json.scripts.start);
        done();
      });
    });

    it('should have installable dependencies', function (done) {
      this.timeout(60000);
      npmInstall(dir, done);
    });

    describe('running the new app',function(done){
      var proc;

      before(function(done){
        console.log('nuking...');
        utils.nukePort(3000,function(e){console.log('e',e.toString())},function(o){console.log('o',o.toString())},function(){
          console.log('nuke results',arguments);
          done();
        });
      });

      it('should rebuild and start the server when running `npm start`',function(done){
        this.timeout(30000);
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
          },500)
        }
        var output = '';
        var validOutput = function(){
          var success = output.match(/Finished 'build-client' after/i)
                      && output.match(/Finished 'browserify' after/i)
                      && output.match(/Finished 'injectScripts' after/i)
                      && output.match(/Finished 'serve' after/i);
          return success;
        }
        var stderroutput = '';
        proc = utils.shell(dir,'npm',['start'],function(data){
          output += data.toString();
          if (validOutput()) {
            setTimeout(function(){
              complete();
            },500);
          }
        },function(stderr){
          stderroutput += stderr.toString();
        },function(err){
          if(err){
            console.error(stderroutput,output);
          } else {
            assert(!(stderroutput.trim().length),'expected to not receive any stderr messages when starting the server ('+stderroutput+')');
            assert(validOutput(),'unexpected output : ' + output);
          }
          complete(err);
        });
      });
    });

  });

});
