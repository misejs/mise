var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = {
  name : 'client',
  options :[],
  run : function(options,pkg,destinationPath,appName,done){
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

    var addEggsMiddleware = function(cb){
      var replacePattern = /^\s*\/\/\s*view\s*middleware\s*$/m;
      utils.updateFile(appPath,replacePattern,"\nrequire('./lib/middleware/eggs-html')(app);",function(err){
        if(err){
          console.error('Error: app.js does not appear to include a `//view middleware` line, unable to add the eggs view middleware.');
          return cb(err);
        }
        // copy over the eggs middleware, now that we are pointing to it in our file.
        var middlewareFile = utils.loadTemplate('client/lib/middleware/eggs-html.js');
        var middlewareDir = path.join(destinationPath,'lib/middleware');
        utils.mkdir(middlewareDir,function(){
          utils.write(path.join(middlewareDir,'eggs-html.js'),middlewareFile,function(err){
            if(err) return cb(err);
            // now copy over our view model stuff & routes
            utils.mkdir(path.join(destinationPath,'public/javascripts/viewmodels'));
            utils.copyTemplate('client/public/javascripts/main.js',path.join(destinationPath,'public/javascripts/main.js'));
            utils.copyTemplate('client/public/javascripts/routes.js',path.join(destinationPath,'public/javascripts/routes.js'));
            utils.copyTemplate('client/public/javascripts/viewmodels/index.js',path.join(destinationPath,'public/javascripts/viewmodels/index.js'));
            utils.copyTemplate('client/public/javascripts/viewmodels/home.js',path.join(destinationPath,'public/javascripts/viewmodels/home.js'));
            cb();
          });
        });
      });
    }

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
      addEggsMiddleware
    ],function(err){
      if(err) return done(err);
      utils.updatePackage(destinationPath,{
        scripts: {
          start: "gulp build-client serve"
        },
        dependencies : {
          'ejs' : '~0.8.8',
          'cheerio' : '~0.17.0',
          'express-layout' : 'misejs/express-layout',
          'async' : '0.9.0',
          'eggs' : '~0.0.0',
          'jquery-browserify' : '~1.8.1'
        },
        devDependencies : {
          'glob' : '~3.2.3',
          'gulp' : '~3.8.7',
          'gulp-browserify': '^0.5.0',
          'gulp-concat': '^2.4.1',
          'gulp-inject': '^1.0.2'
        }
      },function(err){
        if(err) return done(err);
        console.log();
        console.log('   rebuild the client:');
        console.log('     $ gulp build-client');
        console.log('   run the server');
        console.log('     $ npm run-script start');
        console.log();
        done(err);
      });
    });
  }
}
