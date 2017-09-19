const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

const open = function(dbName, cb) {
  let url = 'mongodb://localhost:27017/' + dbName
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    cb(db)
  })
}

//count all pages
const count = function(dbName, cb) {
  open(dbName, function(db) {
    let col = db.collection('wikipedia')
    col.count().then(count => {
      db.close()
      console.log(count)
      cb(count)
    })
  })
}

//grab a couple
const first = function(n, dbName, cb) {
  open(dbName, function(db) {
    let col = db.collection('wikipedia')
    col.find({}).toArray(function(err, docs) {
      console.log(err)
      console.log(docs)
      docs = docs.slice(0, n)
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
  first: first
}
// first(3, 'tempwiki', console.log)
