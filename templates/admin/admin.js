var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views/admin'));
// set up eggs view engine
var eggs = require('eggs');
app.engine('html',eggs.viewEngine(require('./public/admin/javascripts/routes')));
app.set('view engine','html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('admin'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/dist/admin',express.static(path.join(__dirname, 'dist/admin')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(JSON.stringify({
        message: err.message,
        error: err,
        stack : err.stack
    }));
});

module.exports = app;
