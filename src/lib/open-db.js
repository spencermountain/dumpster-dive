const MongoClient = require('mongodb').MongoClient;
const config = require('../../config');

//create a database connection to mongo
const openDb = async function (options) {
  if (!options.db) {
    console.warn('\n--missing db name--');
  }
  const url = (options.db_url) ? options.db_url : config.db_url;

  return new Promise((resolve, reject) => {
    MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true }, function (
      err,
      client
    ) {
      if (err) {
        console.log(err);
        reject(err);
      }
      const db = client.db(options.db);
      const collection = db.collection((options.collection) ? options.collection : config.collection);
      //we use all of these.
      const obj = {
        db: db,
        col: collection,
        client: client
      };
      resolve(obj, client);
    });
  });
};

module.exports = openDb;
