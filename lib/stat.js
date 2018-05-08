const config = require('../config');
const chalk = require('chalk');
const fns = require('../lib/fns');
const open = require('./open-close').open
const MongoClient = require('mongodb').MongoClient

const lastOne = function(col, count, cb) {
  col.find({}, {
    skip: count - 1,
    limit: 1
  }).toArray(function(err, docs) {
    if (!docs || !docs[0]) {
      cb(null)
    } else {
      cb(docs[0])
    }
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
          console.log(chalk.grey(' last page: ') + chalk.green('#' + count) + chalk.blue('  - "' + doc.title + '"     '))
        }
        cb()
      })
    }
  })
}

//birds-eye-view of what pages are in mongo
const cold = function(dbName) {
  open(dbName, function(db, client) {
    stat(db, () => {
      client.close()
    })
  })
}

//hit 'stat' in an interval
const hound = function(db) {
  // open(dbName, function(db) {
  setInterval(() => {
    stat(db)
  }, config.logInterval)
// })
}

module.exports = {
  cold: cold,
  hot: stat,
  hound: hound
}
