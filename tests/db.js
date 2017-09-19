const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

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

//count all pages
const count = function(dbName, cb) {
  open(dbName, function(db) {
    let col = db.collection('wikipedia')
    col.count().then(count => {
      db.close()
      cb(count)
    })
  })
}

//grab a couple
const firstTwo = function(dbName, cb) {
  open(dbName, function(db) {
    let col = db.collection('wikipedia')
    col.find({}).toArray(function(err, docs) {
      if (err) {
        console.log(err)
      }
      docs = docs.slice(0, 2)
      db.close()
      cb(docs)
    })
  })
}

//delete all pages
const drop = function(dbName, cb) {
  open(dbName, function(db) {
    let col = db.collection('wikipedia')
    col.deleteMany({})
    setTimeout(function() {
      db.close()
      cb()
    }, 2000)
  })
}

module.exports = {
  count: count,
  drop: drop,
  firstTwo: firstTwo
}
// firstTwo('tempwiki', console.log)
// open('tempwiki', console.log)
// drop('tempwiki', console.log)
