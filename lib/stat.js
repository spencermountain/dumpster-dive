const config = require('../config');
const chalk = require('chalk');
const fns = require('../lib/fns');
const MongoClient = require('mongodb').MongoClient

const open = function(dbName, callback) {
  let url = 'mongodb://localhost:27017/' + dbName
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    callback(db)
  })
}

const lastOne = function(col, count, cb) {
  col.find({}, {
    skip: count - 1,
    limit: 1
  }).toArray(function(err, docs) {
    cb(docs[0])
  })
}

const stat = function(db, cb) {
  cb = cb || function() {}
  let col = db.collection(config.collection)
  col.count().then((count) => {
    if (count > 0) {
      lastOne(col, count, (doc) => {
        count = fns.niceNumber(count)
        if (doc) {
          console.log(chalk.grey('  #') + chalk.green(count) + ' - ' + chalk.blue('"' + doc.title + '"'))
        }
        cb()
      })
    }
  })
}

//birds-eye-view of what pages are in mongo
const cold = function(dbName) {
  open(dbName, function(db) {
    stat(db, () => {
      db.close()
    })
  })
}

//hit 'stat' in an interval
const hound = function(dbName) {
  open(dbName, function(db) {
    setInterval(() => {
      stat(db)
    }, config.logInterval)
  })
}

module.exports = {
  cold: cold,
  hot: stat,
  hound: hound
}
