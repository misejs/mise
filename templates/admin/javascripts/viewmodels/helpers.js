var helpers = {};

helpers.modelFromFields = function(Model,fields){
  var model = new Model();
  fields.forEach(function(field){
    fields.forEach(function(field){
      var value = field.value;
      try {
        value = JSON.parse(value);
      } catch(e){}
      model[field.name] = value;
    });
  });
  return model;
};

helpers.parseSchema = function(schema){
  var fields = [];
  Object.keys(schema).forEach(function(key){
    var keyInfo = schema[key];
    var info = {
      name : key,
      disabled : keyInfo.disabled === true
    };
    switch(keyInfo.type){
      case Boolean:
        info.textInput = false;
        info.checkbox = true;
        info.type = 'checkbox';
        break;
      case Number:
        info.textInput = true;
        info.type = 'number';
        break;
      case String:
      default:
        info.textInput = !keyInfo.text;
        info.textArea = keyInfo.text;
        info.secure = keyInfo.secure;
        info.tag = keyInfo.text ? 'textarea' : 'input';
        info.type = keyInfo.secure ? 'password' : 'text';
        break;
    }
    fields.push(info);
  });
  return fields;
};

helpers.currentId = function(url){
  url = url || (typeof window !== 'undefined' && window.location.href);
  var parts = url.split('/');
  var id = parts[parts.length-1];
  return id;
};

module.exports = helpers;
