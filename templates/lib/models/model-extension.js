var {{name}} = require('../{{name}}');
var extend = require('{{packageName}}');

{{usageWarning}}

var ExtendedModel = extend({{name}},{
  /* add your config here */
});

module.exports = ExtendedModel;
