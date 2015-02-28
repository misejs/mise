// Build for our client - adds a 'build' command to our grunt commands that browserifies our client.
var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var inject = require("gulp-inject");
var gutil = require('gulp-util');
var server = require('../bin/www');

var production = (process.env.NODE_ENV === 'production');
var pkg = require('../package.json');

var getBundleName = function () {
  var version = pkg.version;
  var name = pkg.name;
  return version + '.' + name + '.' + 'min';
};

var args = watchify.args;
args.entries = ['./public/javascripts/main.js'];
args.insertGlobals = !production;
args.debug = !production;
var bundler = browserify(args);
bundler = watchify(bundler);
bundler.on('update', bundle);
bundler.on('update', restart);
bundler.on('log', gutil.log);

var clientName = getBundleName() + (production ? '.min' : '') + '.js';
function bundle(){
  var stream = bundler
    .bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(clientName))
    .pipe(buffer());

  if(!production) {
    stream
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('../'))
  } else {
    stream
      .pipe(uglify());
  }
  stream.pipe(gulp.dest('./dist/js/'));
  return stream;
};

function restart(){
  server.stop();
  server.start();
};

gulp.task('build-javascripts',bundle);

// Inject scripts - injects scripts in to index.html
gulp.task('inject-scripts', ['build-javascripts'], function () {
  var target = gulp.src('./views/layout.html');
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  var sources = gulp.src([
    './dist/js/'+clientName,
    './dist/**/*.css'], {read: false});

  return target.pipe(inject(sources))
    .pipe(gulp.dest('./views'));
});

gulp.task('build-client',['build-javascripts','inject-scripts']);
