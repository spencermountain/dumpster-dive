//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const init = require('./01-init-db');
const mt = require("./02-multithreader")
const writeDb = require('./03-write-db');
const config = require('../config');

process.on('unhandledRejection', up => {
  console.log(up)
})

//open up a mongo db, and start xml-streaming..
const main = async (options) => {

  params = Object.assign({}, options);
  await init(options)
  mt.worker.parseXML(params)

  writing = 0
  mt.worker.on("msg", async (msg) => {
    if (msg.type === "insertToDb") {
      writing++
      res = await writeDb(msg.pages, options)
      writing--
    }
  })

  mt.worker.on("allWorkersFinished", () => {
    setInterval(() => {
      if (writing === 0) {
        console.log("all done, exiting...")
        process.exit()
      }
    }, 500)
  })

  // await init(options)
  setInterval(async () => {
    count = await options.db.collection(config.collection).count()
    console.log(` - - pages: ${count}`)
  }, 10000)

}

module.exports = main;
