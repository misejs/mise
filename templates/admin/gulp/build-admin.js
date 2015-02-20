// Build for our client - adds a 'build-admin' command to our grunt commands that browserifies our admin.
var gulp = require('gulp');
var browserify = require('browserify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var inject = require("gulp-inject");

var getBundleName = function () {
  var version = require('../package.json').version;
  var name = require('../package.json').name + '-admin';
  return version + '.' + name + '.' + 'min';
};

// Browserify - concatenates the browserify files and dumps them in app.js
gulp.task('build-admin-javascripts',function(){
  var bundler = browserify({
    entries : ['./public/admin/javascripts/main.js'],
    insertGlobals : true,
    debug : true
  });

  return bundler
  .bundle()
  .pipe(source(getBundleName() + '.js'))
  .pipe(buffer())
  .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest('./public/build/admin/js'));
});

// Inject scripts - injects scripts in to index.html
gulp.task('inject-admin-scripts', ['build-admin-javascripts'], function () {
  var target = gulp.src('./views/admin/layout.html');
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  var sources = gulp.src(['./public/build/admin/js/'+getBundleName()+'.js', './public/build/admin/css/**/*.css'], {read: false});

  return target.pipe(inject(sources))
  .pipe(gulp.dest('./views'));
});

gulp.task('build-admin',['build-admin-javascripts','inject-admin-scripts']);
