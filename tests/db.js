const MongoClient = require('mongodb').MongoClient

const open = function(dbName, callback) {
  let url = 'mongodb://localhost:27017/' + dbName
  MongoClient.connect(url, function(err, client) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    const db = client.db(dbName);
    callback(db, client)
  })
}

//count all pages
const count = function(dbName, cb) {
  open(dbName, function(db, client) {
    let col = db.collection('pages')
    col.count().then(len => {
      client.close()
      cb(len)
    })
  })
}

//grab a couple
const firstTen = function(dbName, cb) {
  open(dbName, function(db, client) {
    let col = db.collection('pages')
    col.find({}).toArray(function(err, docs) {
      if (err) {
        console.log(err)
      }
      docs = docs.slice(0, 10)
      client.close()
      cb(docs)
    })
  })
}

//delete all pages
const drop = function(dbName, colName, cb) {
  open(dbName, function(db, client) {
    db.collection('pages')
    let col = db.collection(colName)
    // console.log('dropping ' + colName)
    col.deleteMany({})
    setTimeout(function() {
      client.close()
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
// drop('smallwiki', 'pages',console.log)
