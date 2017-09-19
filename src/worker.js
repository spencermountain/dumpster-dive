// run job queue dashboard to see statistics
// node node_modules/kue/bin/kue-dashboard -p 3050
let util = require('util')
let cluster = require('cluster')
let clusterWorkerSize = require('os').cpus().length
let concurrency = 1
let helper = require('./helper')
var kue = require('kue')
let MongoClient = require('mongodb').MongoClient

var queue = kue.createQueue({
  prefix: 'q',
  jobEvents: false,
  redis: {
    port: 6379,
    host: 'localhost'
    //auth: ''
  }
})

if (cluster.isMaster) {
  for (let i = 0; i < clusterWorkerSize; i++) {
    cluster.fork()
  }
} else {
  // url should be improved by configuration or cli arguments
  let url = 'mongodb://localhost:27017/wikipedia_queue'

  MongoClient.connect(url, function(err, db) {
    let collection = db.collection('wikipedia')
    queue.process('article', concurrency, function(job, done) {
      let url = job.data.url
      let data = job.data
      data.collection = collection
      helper.processScript(data, function(err, res) {
        //console.log('processed');
        done(err, res)
      })
    })
  })
}
