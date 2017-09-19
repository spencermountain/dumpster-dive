const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

const open = function(lang, cb) {
  let url = 'mongodb://localhost:27017/' + lang
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    cb(db)
  })
}

//count all pages
const count = function(lang, cb) {
  open(lang, function(db) {
    let col = db.collection('wikipedia')
    col.count().then(count => {
      db.close()
      console.log(count)
      cb(count)
    })
  })
}

//grab a couple
const first = function(n, lang, cb) {
  open(lang, function(db) {
    let col = db.collection('wikipedia')
    col.find({}).toArray(function(err, docs) {
      docs = docs.slice(0, n)
      db.close()
      cb(docs)
    })
  })
}

//delete all pages
const drop = function(lang, cb) {
  open(lang, function(db) {
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
