//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const init = require('./01-init-db');
const mt = require("./02-multithreader")
const writeDb = require('./03-write-db');
const oneSec = require('../lib/fns').oneSec
const stat = require('../lib/stat').hot

process.on('unhandledRejection', console.log)

//open up a mongo db, and start xml-streaming..
const main = async (options, done) => {
  params = Object.assign({}, options);
  done = done || function() {}

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
    oneSec(() => {
      done()
      stat(options.db, () => {
        oneSec(() => {
          console.log('\n\n      👍  closing down.')
          process.exit()
        })
      })
    })
  })
}

module.exports = main;
