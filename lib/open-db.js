const MongoClient = require('mongodb').MongoClient

const openDb = async function(dbName) {
  return new Promise((resolve, reject) => {
    let url = 'mongodb://localhost:27017/' + dbName
    MongoClient.connect(url, function(err, client) {
      if (err) {
        console.log(err)
        reject(err)
      }
      const db = client.db(dbName);
      let obj = {
        db: db,
        client: client
      }
      resolve(obj, client)
    })
  })
}


module.exports = openDb
