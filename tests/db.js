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

//count all pages
const count = function(dbName, cb) {
  open(dbName, function(db) {
    let col = db.collection('wikipedia')
    col.count().then(len => {
      db.close()
      cb(len)
    })
  })
}

//grab a couple
const firstTen = function(dbName, cb) {
  open(dbName, function(db) {
    let col = db.collection('wikipedia')
    col.find({}).toArray(function(err, docs) {
      if (err) {
        console.log(err)
      }
      docs = docs.slice(0, 10)
      db.close()
      cb(docs)
    })
  })
}

//delete all pages
const drop = function(dbName, colName, cb) {
  open(dbName, function(db) {
    let col = db.collection(colName)
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
  firstTen: firstTen
}
// firstTwo('tempwiki', console.log)
// open('tempwiki', console.log)
// drop('smallwiki', 'wikipedia',console.log)
