// html & eggs view engine setup
var client = require('../../public/javascripts/viewmodels');
var ejs = require('ejs');
var url = require('url');
var cheerio = require('cheerio');

module.exports = function(app){
  app.use(require('express-layout')());
  app.use(function(req,res,next){
    res.locals.url = url.parse('http' + (req.connection.secure ? 's' : '') + '://' + req.headers.host + req.url);
    res.locals.headers = req.headers;
    next();
  });
  app.engine('html', function(filename,options,callback){
    ejs.renderFile(filename,options,function(err,html){
      var $ = cheerio.load(html);
      client($,callback);
    });
  });
}
