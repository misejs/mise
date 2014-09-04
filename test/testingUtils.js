var assert = require('assert');
var exec = require('child_process').exec;
var mkdirp = require('mkdirp');
var path = require('path');
var rimraf = require('rimraf');
var spawn = require('child_process').spawn;

var utils = module.exports = {
  binPath : path.resolve(__dirname, '../bin/mise'),
  tempDir : path.resolve(__dirname, '../temp'),
  cleanup : function(dir, callback) {
    if (typeof dir === 'function') {
      callback = dir;
      dir = utils.tempDir;
    }

    rimraf(utils.tempDir, function (err) {
      callback(err);
    });
  },
  createEnvironment : function(callback) {
    var num = process.pid + Math.random();
    var dir = path.join(utils.tempDir, ('app-' + num));

    mkdirp(dir, function ondir(err) {
      if (err) return callback(err);
      callback(null, dir);
    });
  },
  npmInstall : function(dir, callback) {
    exec('npm install', {cwd: dir}, function (err, stderr) {
      if (err) {
        err.message += stderr;
        callback(err);
        return;
      }

      callback();
    });
  },
  parseCreatedFiles : function(output, dir) {
    var files = [];
    var lines = output.split(/[\r\n]+/);
    var match;

    for (var i = 0; i < lines.length; i++) {
      if ((match = /create.*?: (.*)$/.exec(lines[i]))) {
        var file = match[1];

        if (dir) {
          file = path.resolve(dir, file);
          file = path.relative(dir, file);
        }

        file = file.replace(/\\/g, '/');
        files.push(file);
      }
    }

    return files;
  },
  run : function(dir, args, callback) {
    var argv = [utils.binPath].concat(args);
    var chunks = [];
    var exec = process.argv[0];
    var stderr = [];

    var child = spawn(exec, argv, {
      cwd: dir
    });

    child.stdout.on('data', function ondata(chunk) {
      chunks.push(chunk);
    });
    child.stderr.on('data', function ondata(chunk) {
      stderr.push(chunk);
    });

    child.on('error', callback);
    child.on('exit', function onexit() {
      var err = null;
      var stdout = Buffer.concat(chunks)
        .toString('utf8')
        .replace(/\x1b\[(\d+)m/g, '_color_$1_');

      try {
        assert.equal(Buffer.concat(stderr).toString('utf8'), '');
      } catch (e) {
        err = e;
      }

      callback(err, stdout);
    });
  }
};
