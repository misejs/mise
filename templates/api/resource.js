var {{modelName}} = require('{{modelPath}}');
var {{name}} = {};

var resourceName = {{modelName}}.prototype.collection;

{{name}}.index = function(req,res,next){
  {{modelName}}.all(function(err,items){
    if(err){
      res.status(500).json({error : err.message});
    } else {
      var obj = {};
      obj[resourceName] = items;
      res.json(obj);
    }
  });
};

{{name}}.show = function(req,res,next){
  {{modelName}}.one(req.params.id,function(err,item){
    if (err) {
      res.status(500).json({error : err.message});
    } else if(!item){
      res.status(404).json({error : 'Item not found'});
    } else {
      res.json(item.toObject());
    }
  });
};

var upsert = function(data,callback){
  var new{{modelName}} = new {{modelName}}(data);
  new{{modelName}}.save(callback);
};

{{name}}.create = function(req,res,next){
  upsert(req.body,function(err,item){
    if (err) {
      res.status(500).json({error : err.message});
    } else {
      res.json(item.toObject());
    }
  });
};

{{name}}.update = function(req,res,next){
  var id = req.params.id;
  if(!id){
    res.status(406).json({error : "invalid id"});
  } else {
    upsert(req.body,function(err,item){
      if(!err && !item){
        res.status(404).json({error : 'Item not found'});
      } else if(err){
        res.status(500).json({error : err.message});
      } else {
        res.json(item.toObject());
      }
    });
  }
};

{{name}}.destroy = function(req,res,next){
  var id = req.params.id;
  if(!id){
    res.status(406).json({error : "invalid id"});
  } else {
    {{modelName}}.destroy(id,function(err,result){
      if(!err && !result){
        res.status(404).json({error : 'Item not found'});
      } else if(err){
        res.status(500).json({error : err.message});
      } else {
        res.sendStatus(204);
      }
    });
  }
};

module.exports = {{name}};
