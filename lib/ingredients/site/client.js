var utils = require('../../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = {
  name : 'client',
  options :[
    {
      name : 'destinationPath',
      flag : 'p',
      longFlag : 'path',
      description : 'The destination of this app'
    }
  ],
  run : function(options,pkg,destinationPath,appName,done){
    if (typeof destinationPath == 'function') {
      callback = destinationPath;
      destinationPath = options.destinationPath;
    }
    if(!destinationPath) throw new Error('You must specify a destination path when running the client generator.');

    console.log('running client generator.');
    // make sure there's an express app that we can build on
    var appPath = path.join(destinationPath,'app.js');
    if(!fs.existsSync(appPath)){
      return done(new Error('No app.js found - are you inside of a mise app directory?'));
    }
    // gulp file for rebuilding client
    var gulpDir = path.join(destinationPath,'gulp');
    var taskFile = utils.loadTemplate('gulp/gulp/build-client.js');
    var taskPath = path.join(gulpDir,'build-client.js');

    async.waterfall([
      utils.mkdir.bind(null,gulpDir),
      function(cb){
        fs.exists(taskPath,function(exists){
          var done = function(err,overwrite){
            if(err) return cb(err);
            cb(exists && !overwrite ? new Error('Build client task already exists') : null);
          }
          if(exists){
            utils.ask('Looks like there\'s already a build-client task. Overwrite?', done);
          } else {
            done(false);
          }
        });
      },
      function(cb){
        utils.write(taskPath,taskFile);
        cb();
      },
      function(cb){
        // now copy over our view model stuff & routes
        utils.mkdir(path.join(destinationPath,'public/javascripts/viewmodels'));
        utils.copyTemplate('client/public/javascripts/main.js',path.join(destinationPath,'public/javascripts/main.js'));
        utils.copyTemplate('client/public/javascripts/routes.js',path.join(destinationPath,'public/javascripts/routes.js'));
        utils.copyTemplate('client/public/javascripts/viewmodels/index.js',path.join(destinationPath,'public/javascripts/viewmodels/index.js'));
        utils.copyTemplate('client/public/javascripts/viewmodels/home.js',path.join(destinationPath,'public/javascripts/viewmodels/home.js'));
        cb();
      }
    ],function(err){
      if(err) return done(err);
      utils.updatePackage(destinationPath,{
        scripts: {
          start: "gulp build-client serve"
        },
        dependencies : {
          'async' : '~0.9.0',
          'eggs' : '~0.1.0',
          'jquery-browserify' : '~1.8.1'
        },
        devDependencies : {
          'glob' : '~3.2.3',
          'gulp' : '~3.8.7',
          'gulp-browserify': '~0.5.0',
          'gulp-concat': '~2.4.1',
          'gulp-inject': '~1.0.2'
        }
      },function(err){
        if(err) return done(err);
        console.log();
        console.log('   rebuild the client:');
        console.log('     $ gulp build-client');
        console.log('   run the server');
        console.log('     $ npm start');
        console.log();
        done(err);
      });
    });
  }
}