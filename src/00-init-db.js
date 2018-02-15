const MongoClient = require('mongodb').MongoClient;
const fs = require("fs")

//start it up running
const init = async ( options = {
    skip_first: 0,
    verbose: true
  } ) => {

  return new Promise(async (resolve) => {
    //this is required
    if (!fs.existsSync(options.file)) {
      console.log('please supply a filename for the wikipedia article dump in xml format');
      process.exit(1);
    }
    //log a handy msg about skipping..
    if (options.skip_first > 0) {
      console.log('\n\n\n -- skipping first ' + options.skip_first + ' articles...')
    }
    // Connect to mongo
    let url = 'mongodb://localhost:27017/' + options.db;
    options.db = await MongoClient.connect(url)
    options.collection = options.db.collection('wikipedia');

    // if (options.auto_skip) {
    //   options.skip_first = await options.collection.count()
    //   console.log('\n\n\n -- auto skipping first ' + options.skip_first + ' articles...')
    // }
    // we can make this smarter in the future
    // by giving batch an ID and collecting errors of
    // that batch to that ID'd collection
    // for now each run is one batch.
    // options.errCollection = await options.db.createCollection('errors',{capped:true, max: 1000, size: 5242880 });
    // options.queueCollection = await options.db.createCollection('queue');

    // await options.errCollection.drop()
    // await options.queueCollection.drop()
    resolve(options)
  })
}
module.exports = init
