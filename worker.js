// run job queue dashboard to see statistics
// node node_modules/kue/bin/kue-dashboard -p 3050

var util = require('util');
var cluster = require('cluster')
var clusterWorkerSize = require('os').cpus().length;
var concurrency = 1;
var helper = require('./helper')
var queue = require('./config/queue');
var MongoClient = require('mongodb').MongoClient

if (cluster.isMaster) {
  for (var i = 0; i < clusterWorkerSize; i++) {
    cluster.fork();
  }
} else {
  // url should be improved by configuration or cli arguments
  var url = 'mongodb://localhost:27017/wikipedia_queue';

  MongoClient.connect(url, function(err, db) {
    var collection = db.collection('wikipedia');
    queue.process('article', concurrency, function(job, done){
      var url = job.data.url;
      var data = job.data
      data.collection = collection;
      helper.processScript(data, function(err, res) {
        //console.log('processed');
        done(err, res)
      })
    })

  })
}
