var async = require('async');
var express = require('./express');
var gulp = require('./gulp');
var client = require('./client');
var config = require('./config');
var prompt = require('prompt');
var utils = require('../../utils');
var exec = require('child_process').exec;

var options = express.options.concat(gulp.options,client.options);

// strip out options that the site generator automatically makes.
options = options.filter(function(option){
  if(option.name == 'appName' || option.name == 'destinationPath' || option.name == 'regenerate') return false;
  return true;
});

options.unshift({
  name : 'skipInstall',
  longFlag : 'skip-install',
  description : 'setting this flag skips the npm install step'
});

module.exports = {
  name : 'site',
  usage : 'site [sitename]',
  description : 'generates a mise site: an express backend, gulp build/launch scripts with browserify, an optional css preprocessor, and eggs data binding.\n    specify the directory to create the app in with the last argument (defaults to the current directory).',
  options : options,
  run : function(options,pkg,callback){
    var self = this;
    var lastArg = this.unmatchedArgs[this.unmatchedArgs.length-1];
    var destinationPath = lastArg || '.'
    var overwriting = destinationPath == '.';
    var skipped;

    // pass this to the callback so cuisinart can detect that this is async
    var done = function(err){
      var created = (skipped || overwriting) ? null : [destinationPath];
      if (options.skipInstall || err || skipped) {
        callback(err,created);
      } else {
        console.log('installing dependencies...');
        var child = exec('cd '+destinationPath+' && npm install && cd ..', function (error, stdout, stderr) {
          callback(error,created);
        });
        // child.stderr.pipe(process.stderr);
        child.stdout.pipe(process.stdout);
      }
    };
    utils.emptyDirectory(destinationPath, function(empty){
      if (empty) {
        runGenerators.call(self,lastArg,destinationPath,done);
      } else {
        utils.ask('destination ('+destinationPath+') is not empty, continue? ', function(err,ok){
          if (ok) {
            overwriting = true;
            runGenerators.call(self,lastArg,destinationPath,done);
          } else {
            skipped = true;
            done();
          }
        });
      }
    });
  }
}

var runGenerators = function(lastArg,destinationPath,done){
  var self = this;
  prompt.start();
  prompt.get({
    properties : {
      'site name' : {
        default : lastArg,
        required : true
      }
    }
  },function(err,result){
    if(err || !result) throw err || new Error('You must specify an app name.');
    var appName = result['site name'];
    var args = self.args;
    self.baseArgs(destinationPath,appName);
    async.series([
      self.run.bind(self,express,args),
      self.run.bind(self,gulp,args),
      self.run.bind(self,client,args),
      self.run.bind(self,config,args)
    ],done);
  });
}
