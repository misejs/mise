// Build for our client - adds a 'build' command to our grunt commands that browserifies our client.
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var inject = require("gulp-inject");
var concat = require('gulp-concat');

// Inject scripts - injects scripts in to index.html
gulp.task('injectScripts', ['browserify'], function () {
  var target = gulp.src('./views/layout.html');
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  var sources = gulp.src(['./public/build/js/main.js', './public/build/**/*.css'], {read: false});

  return target.pipe(inject(sources))
    .pipe(gulp.dest('./views'));
});

// Browserify - concatenates the browserify files and dumps them in app.js
gulp.task('browserify', function() {
  var target = gulp.src(['./public/javascripts/main.js'])
    .pipe(browserify({
      insertGlobals: true,
      debug: true
    }))
    // Bundle to a single file
    .pipe(concat('main.js'))
    // Output it to our dist folder
    .pipe(gulp.dest('./public/build/js'));
  return target;
});

gulp.task('build-client',['browserify','injectScripts']);
