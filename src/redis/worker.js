let cluster = require('cluster');
let clusterWorkerSize = require('os').cpus().length;
let MongoClient = require('mongodb').MongoClient;
let parseWiki = require('../02-parse-wiki');
let plaintext = require('../02-plaintext');
let queue = require('./queue');
let concurrency = 1;
// run job queue dashboard to see statistics
// node node_modules/kue/bin/kue-dashboard -p 3050

if (cluster.isMaster) {
  for (let i = 0; i < clusterWorkerSize; i++) {
    cluster.fork();
  }
} else {
  // url should be improved by configuration or cli arguments
  let queueUrl = 'mongodb://localhost:27017/wikipedia_queue';
  MongoClient.connect(queueUrl, function(err, db) {
    let collection = db.collection('wikipedia');
    queue.process('article', concurrency, function(job, done) {
      let data = job.data;
      data.collection = collection;
      try {
        //if we're just storing article text
        if (options.plaintext) {
          plaintext(data, options.collection, done);
        } else {
          //if we're storing full json
          parseWiki(data, options.collection, done);
        }
      } catch (err2) {
        console.log(err2);
      }
    });
  });
}
