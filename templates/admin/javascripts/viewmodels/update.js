var Model = require({{modelPath}});
var helpers = require('./helpers');

function AdminUpdate{{modelName}}ViewModel(ready) {
  var self = this;
  self.model = new Model();
  self.fields = helpers.parseSchema(self.model.schema);

  // TODO: how do we get the ID now?
  Model.show(helpers.currentID(),function(info){
    self.model = info;
    self.fields.forEach(function(field){
      field.value = self.model[field.name];
    });
  },function(err){
    console.error(err);
  },ready);
  self.save = function(){
    self.model = helpers.modelFromFields(Model,self.fields);
    self.model.save(function(saved){
      self.model = saved;
    },function(){
      console.error(arguments);
    });
  };
};

module.exports = AdminUpdate{{modelName}}ViewModel;
