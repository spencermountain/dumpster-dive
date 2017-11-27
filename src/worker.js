// run job queue dashboard to see statistics
// node node_modules/kue/bin/kue-dashboard -p 3050
let util = require('util');
let cluster = require('cluster');
let clusterWorkerSize = require('os').cpus().length;
let concurrency = 1;
let doPage = require('./doPage');
let MongoClient = require('mongodb').MongoClient;
let queue = require('./queue');

if (cluster.isMaster) {
  for (let i = 0; i < clusterWorkerSize; i++) {
    cluster.fork();
  }
} else {
  // url should be improved by configuration or cli arguments
  let url = 'mongodb://localhost:27017/wikipedia_queue';

  MongoClient.connect(url, function(err, db) {
    let collection = db.collection('wikipedia');
    queue.process('article', concurrency, function(job, done) {
      let url = job.data.url;
      let data = job.data;
      data.collection = collection;
      try {
        doPage.parse(data, done);
      } catch (err) {
        console.log(err);
      }
    });
  });
}
