var async = require('async');
var express = require('./express');
var gulp = require('./gulp');
var client = require('./client');

module.exports = {
  name : 'site',
  usage : 'site [sitename]',
  description : 'generates a mise site: an express backend, gulp build/launch scripts, browserify and compass preprocessors, and eggs data binding.',
  options : [
    {
      flag : 'c',
      longFlag : 'css',
      description : 'add stylesheet <engine> support (less|stylus|compass) (defaults to plain css)',
      validArgs : ['less','stylus','compass']
    },
    {
      flag : 'f',
      longFlag : 'force',
      description : 'force on non-empty directory'
    }
  ],
  run : function(options,pkg,destinationPath,appName,done){
    async.series([
      this.run.bind(this,express,this._args),
      this.run.bind(this,gulp,this._args),
      this.run.bind(this,client,this._args)
    ],done);
  }
}
