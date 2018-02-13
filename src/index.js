//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const init = require('./00-init-db');
const config = require('../config')
const multithreader = require("./multithreader")
const noop = () => {
}
const defaults = {
  batch_size: config.batch_size
}

process.on('unhandledRejection', up => {
  console.log(up)
})

//open up a mongo db, and start xml-streaming..
const main = async (options, callback = noop ) => {
  params = Object.assign({}, options, defaults);
  multithreader.start(params)

  await init(options)
  setInterval(async () => {
    count = await options.db.collection(config.queue).count()
    console.log(`queue size: ${count}`)
  }, 10000)

}

module.exports = main;
