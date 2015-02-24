// Build for our client - adds a 'build' command to our grunt commands that browserifies our client.
var gulp = require('gulp');
var browserify = require('browserify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var inject = require("gulp-inject");
var watch = require('gulp-watch');

var getBundleName = function () {
  var version = require('../package.json').version;
  var name = require('../package.json').name;
  return version + '.' + name + '.' + 'min';
};

// Browserify - concatenates the browserify files and dumps them in app.js
gulp.task('build-javascripts',function(){
  var bundler = browserify({
    entries : ['./public/javascripts/main.js'],
    insertGlobals : true,
    debug : true
  });

  return bundler
    .bundle()
    .pipe(source(getBundleName() + '.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('../'))
    .pipe(gulp.dest('./dist/js/'));
});

// Inject scripts - injects scripts in to index.html
gulp.task('inject-scripts', ['build-javascripts'], function () {
  var target = gulp.src('./views/layout.html');
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  var sources = gulp.src(['./dist/js/'+getBundleName()+'.js', './dist/**/*.css'], {read: false});

  return target.pipe(inject(sources))
  .pipe(gulp.dest('./views'));
});

gulp.task('build-client',['build-javascripts','inject-scripts']);

gulp.task('watch',['build-client'],function(){
  return watch([
    '../public/**/*.js',
    '../lib/**/*.js',
    '../routes/**/*.js',
    '../gulp/**/*.js',
    '../public/stylesheets/**/*.css',
    '../views/**/*.html'
  ],function(){
    gulp.start('build-client');
  });
});
