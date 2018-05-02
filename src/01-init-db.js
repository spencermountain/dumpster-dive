const MongoClient = require('mongodb').MongoClient;
const fs = require("fs")
const chalk = require("chalk")
const config = require("../config")

//setup a connection to mongo, for each worker.
const init = async ( options = {} ) => {

  //guess an appropriate dbName
  if (!options.db) {
    options.db = options.file.match(/\/([a-z-]+)-latest-pages/)[1] || 'wikipedia'
  }
  // console.log(options)

  return new Promise(async (resolve) => {
    //this is required
    if (!fs.existsSync(options.file)) {
      console.log(chalk.red('\n  --can\'t find file:  "' + chalk.blue(options.file) + '" ---'));
      console.log(chalk.grey('     please supply a filename for the wikipedia article dump in xml format'));
      process.exit(1);
    }
    if (/\.bz2$/.test(options.file)) {
      console.log(chalk.red('\n    --- hello, please unzip this file first  ---'));
      console.log(chalk.grey('     ($ bzip2 -d ' + options.file + ' )'))
      process.exit(1);
    }
    // Connect to mongo
    let url = 'mongodb://localhost:27017/' + options.db;
    options.dbName = options.db //over-use of db param;(
    options.client = await MongoClient.connect(url)
    options.db = options.client.db(options.dbName);
    options.collection = options.db.collection(config.collection);

    // options.db.on('close', (e) => {
    //   console.log('=-=-=-DB CONNECTION CLOSED=-=-=')
    // })
    // if (options.auto_skip) {
    //   options.skip_first = await options.collection.count()
    //   console.log('\n\n\n -- auto skipping first ' + options.skip_first + ' articles...')
    // }
    // we can make this smarter in the future..
    // options.errCollection = await options.db.createCollection('errors',{capped:true, max: 1000, size: 5242880 });
    // options.queueCollection = await options.db.createCollection('queue');
    resolve(options)
  })
}
module.exports = init
