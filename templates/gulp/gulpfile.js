var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var server = require('./bin/www');

// include all the files in the build dir
var buildDir = path.join(__dirname,'gulp');
if(fs.existsSync(buildDir)){
  var files = glob.sync(path.join(buildDir,'**/*.js'));
  files.forEach(function(file){
    require(file);
  });
}

// Serve - starts the express server
gulp.task('serve',[],function(){
  server.start(true);
});

// Default
gulp.task('default',['serve']);
