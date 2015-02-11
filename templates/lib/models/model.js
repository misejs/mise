var Model = require('mise-model');

var {{name}} = module.exports = new Model('{{name}}',{
  /*
    Define your properties here. Each property is an object, with any of the following options:
    type : Boolean, String, Number, or 'Any' - this will enforce type cooercion on this property.
    get : a getter function
    set : a setter function (overrides type checks)
  */
  name : {
    type : String
  }
},'{{pluralName}}');
