const MongoClient = require('mongodb').MongoClient;
const defaults = {
  skip_first: 0,
  verbose: true
}

//start it up running
const init = function(options, callback) {
  options = options || {}
  options = Object.assign(options, defaults)
  //this is required
  if (!options.file) {
    console.log('please supply a filename for the wikipedia article dump in bz2 format');
    process.exit(1);
  }
  //log a handy msg about skipping..
  if (options.skip_first > 0) {
    console.log('\n\n\n -- skipping first ' + options.skip_first + ' articles...')
  }
  // Connect to mongo
  let url = 'mongodb://localhost:27017/' + options.db;
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    options.database = db
    options.collection = db.collection('wikipedia');
    callback(options)
  })
}
module.exports = init
