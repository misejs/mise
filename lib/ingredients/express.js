var utils = require('../utils');

var load_template = utils.loadTemplate;
var copy_template = utils.copyTemplate;
var emptyDirectory = utils.emptyDirectory;
var write = utils.write;
var mkdir = utils.mkdir;
var abort = utils.abort;

module.exports = {
  name : 'express',
  options : [
    {
      flag : 'e',
      longFlag : 'ejs',
      hint : 'adds ejs support (defaults to jade)'
    },
    {
      longFlag : 'hbs',
      hint : 'adds handlebars engine support'
    },
    {
      flag : 'H',
      longFlag : 'hogan',
      hint : 'add hogan.js engine support'
    },
    {
      flag : 'c',
      longFlag : 'css',
      hint : 'add stylesheet <engine> support (less|stylus|compass) (defaults to plain css)',
      validArgs : ['less','stylus','compass']
    },
    {
      flag : 'f',
      longFlag : 'force',
      hint : 'force on non-empty directory'
    }
  ],
  run : function(program,pkg,destination_path,app_name){
    emptyDirectory(destination_path, function(empty){
      if (empty || program.force) {
        createApplicationAt(destination_path,program,app_name);
      } else {
        program.confirm('destination is not empty, continue? ', function(ok){
          if (ok) {
            process.stdin.destroy();
            createApplicationAt(destination_path,program,app_name);
          } else {
            abort('aborting');
          }
        });
      }
    });
  }
};

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 * @param {Object} program
 */

function createApplicationAt(path,program,app_name) {
  // Template engine

  program.template = 'jade';
  if (program.ejs) program.template = 'ejs';
  if (program.hogan) program.template = 'hjs';
  if (program.hbs) program.template = 'hbs';

  var index = load_template('express/js/routes/index.js');
  var users = load_template('express/js/routes/users.js');

  var css = load_template('express/css/style.css');
  var less = load_template('express/css/style.less');
  var stylus = load_template('express/css/style.styl');
  var compass = load_template('express/css/style.scss');

  var app = load_template('express/js/app.js');
  var www = load_template('express/js/www');

  console.log();
  process.on('exit', function(){
    console.log();
    console.log('   install dependencies:');
    console.log('     $ cd %s && npm install', path);
    console.log();
    console.log('   run the app:');
    console.log('     $ DEBUG=' + app_name + ' ./bin/www');
    console.log();
  });

  mkdir(path, function(){
    mkdir(path + '/public');
    mkdir(path + '/public/javascripts');
    mkdir(path + '/public/images');
    mkdir(path + '/public/stylesheets', function(){
      switch (program.css) {
        case 'less':
          write(path + '/public/stylesheets/style.less', less);
          break;
        case 'stylus':
          write(path + '/public/stylesheets/style.styl', stylus);
          break;
        case 'compass':
          write(path + '/public/stylesheets/style.scss', compass);
          break;
        default:
          write(path + '/public/stylesheets/style.css', css);
      }
    });

    mkdir(path + '/routes', function(){
      write(path + '/routes/index.js', index);
      write(path + '/routes/users.js', users);
    });

    mkdir(path + '/views', function(){
      switch (program.template) {
        case 'ejs':
          copy_template('express/ejs/index.ejs', path + '/views/index.ejs');
          copy_template('express/ejs/error.ejs', path + '/views/error.ejs');
          break;
        case 'jade':
          copy_template('express/jade/index.jade', path + '/views/index.jade');
          copy_template('express/jade/layout.jade', path + '/views/layout.jade');
          copy_template('express/jade/error.jade', path + '/views/error.jade');
          break;
        case 'hjs':
          copy_template('express/hogan/index.hjs', path + '/views/index.hjs');
          copy_template('express/hogan/error.hjs', path + '/views/error.hjs');
          break;
        case 'hbs':
          copy_template('express/hbs/index.hbs', path + '/views/index.hbs');
          copy_template('express/hbs/layout.hbs', path + '/views/layout.hbs');
          copy_template('express/hbs/error.hbs', path + '/views/error.hbs');
          break;
      }
    });

    // CSS Engine support
    switch (program.css) {
      case 'less':
        app = app.replace('{css}', eol + 'app.use(require(\'less-middleware\')(path.join(__dirname, \'public\')));');
        break;
      case 'stylus':
        app = app.replace('{css}', eol + 'app.use(require(\'stylus\').middleware(path.join(__dirname, \'public\')));');
        break;
      case 'compass':
        app = app.replace('{css}', eol + 'app.use(require(\'node-compass\')({mode: \'expanded\'}));');
        break;
      default:
        app = app.replace('{css}', '');
    }

    // Template support
    app = app.replace('{views}', program.template);

    // package.json
    var pkg = {
        name: app_name
      , version: '0.0.0'
      , private: true
      , scripts: { start: 'node ./bin/www' }
      , dependencies: {
          'express': '~4.8.6',
          'body-parser': '~1.6.6',
          'cookie-parser': '~1.3.2',
          'morgan': '~1.2.3',
          'serve-favicon': '~2.0.1',
          'debug': '~1.0.4'
      }
    }

    switch (program.template) {
      case 'jade':
        pkg.dependencies['jade'] = '~1.5.0';
        break;
      case 'ejs':
        pkg.dependencies['ejs'] = '~0.8.5';
        break;
      case 'hjs':
        pkg.dependencies['hjs'] = '~0.0.6';
        break;
      case 'hbs':
        pkg.dependencies['hbs'] = '~2.7.0';
        break;
      default:
    }

    // CSS Engine support
    switch (program.css) {
      case 'less':
        pkg.dependencies['less-middleware'] = '1.0.x';
        break;
      case 'compass':
        pkg.dependencies['node-compass'] = '0.2.3';
        break;
      case 'stylus':
        pkg.dependencies['stylus'] = '0.42.3';
        break;
      default:
    }

    write(path + '/package.json', JSON.stringify(pkg, null, 2));
    write(path + '/app.js', app);
    mkdir(path + '/bin', function(){
      www = www.replace('{name}', app_name);
      write(path + '/bin/www', www, 0755);
    });
  });
}