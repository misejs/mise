var utils = require('../utils');
var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = {
  name : 'client',
  options :[],
  run : function(program,pkg,destinationPath,appName,done){
    // gulp file for rebuilding client
    var gulpDir = path.join(destinationPath,'gulp');
    var taskFile = utils.loadTemplate('base/gulp/build-client.js');
    var taskPath = path.join(gulpDir,'build-client.js');

    process.on('exit', function(){
      console.log();
      console.log('   rebuild the client:');
      console.log('     $ gulp build-client');
      console.log();
    });

    var addEggsMiddleware = function(cb){
      // make sure there's an express app that we can build on
      var appPath = path.join(destinationPath,'app.js');
      var appErr = utils.updateFile(appPath,/^\/\/view middleware$/m,"\nrequire('./middleware/eggs-html')(app);");
      if(appErr){
        return cb(new Error('Error: app.js does not include a `//view middleware` line, unable to add the eggs view middleware.'));
      }
      // copy over the eggs middleware, now that we are pointing to it in our file.
      var middlewareFile = utils.loadTemplate('client/lib/middleware/eggs-html.js');
      var middlewareDir = path.join(destinationPath,'lib/middleware');
      utils.mkdir(middlewareDir);
      utils.write(path.join(middlewareDir,'eggs-html.js',middlewareFile));

      // now copy over our view model stuff & routes
      utils.mkdir(path.join(destinationPath,'public/javascripts/viewmodels'));
      utils.copyTemplate('client/public/javascripts/main.js',path.join(destinationPath,'public/javascripts/main.js'));
      utils.copyTemplate('client/public/javascripts/routes.js',path.join(destinationPath,'public/javascripts/routes.js'));
      utils.copyTemplate('client/public/javascripts/viewmodels/index.js',path.join(destinationPath,'public/javascripts/viewmodels/index.js'));
      cb();
    }

    async.waterfall([
      utils.mkdir.bind(null,gulpDir),
      function(cb){
        fs.exists(taskPath,function(exists){
          var done = function(overwrite){
            cb(exists && !overwrite ? new Error('Build client task already exists') : null);
          }
          if(exists){
            program.confirm('Looks like there\'s already a build-client task. Overwrite?', done);
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
          'express-layout' : '~0.1.0',
          'eggs' : '~0.0.0',
          'jquery-browserify' : '~1.8.1'
        },
        devDependencies : {
          'gulp' : '~3.8.7',
          'gulp-browserify': '^0.5.0',
          'gulp-concat': '^2.4.1',
          'gulp-inject': '^1.0.2'
        }
      });
      done();
    });
  }
}
