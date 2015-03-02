var Model = require('{{modelPath}}');
var helpers = require('./helpers');

function Admin{{modelName}}ListViewModel(ready) {
  var self = this;
  self.items = [];
  self.createLink = '/admin/{{collectionName}}/create';

  var decorateItems = function(items){
    items = items.map(function(item){
      return {
        item : item,
        title : item.title || item[Model.idKey],
        remove : function(){
          if(confirm('Are you sure you want to delete this item? This cannot be undone.')){
            item.destroy(function(err){
              if(err) return console.error('error removing item: ',err);
              reload();
            });
          }
        },
        link : '/admin/{{collectionName}}/' + item[Model.idKey]
      }
    });
    return items;
  };

  var reload = function(cb){
    Model.all(function(err,items){
      if(err) return console.error('error listing items: ',err);
      self.items = decorateItems(items);
      if(cb) cb();
    });
  }

  reload(ready);
};

module.exports = Admin{{modelName}}ListViewModel;
