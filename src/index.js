//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const init = require('./01-init-db');
const chalk = require('chalk')
const mt = require("./02-multithreader")
const writeDb = require('./03-write-db');
const oneSec = require('../lib/fns').oneSec
const fns = require('../lib/fns')
const start = Date.now()

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
      oneSec(() => {
        console.log('\n\n      👍  closing down.\n')
        options.collection.count().then((count) => {
          let duration = fns.timeSince(start)
          console.log('     -- final count is ' + chalk.magenta(fns.niceNumber(count)) + ' pages --')
          console.log('       ' + chalk.yellow(`took ${duration}`))
          console.log('              🎉')
          console.log('\n\n')
          process.exit()
        })
      })
    })
  })
}

module.exports = main;
