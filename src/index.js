//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const initDB = require('./01-init-db');
const chalk = require('chalk')
const workers = require("./02-make-workers")
const writeDb = require('./03-write-db');
// const stat = require('../lib/stat')
const fns = require('../lib/fns')
const stat = require('../lib/stat')
const oneSec = fns.oneSec
const start = Date.now()

process.on('unhandledRejection', console.log)

//open up a mongo db, and start xml-streaming..
const main = async (options, done) => {
  let params = Object.assign({}, options);
  done = done || function() {}

  await initDB(options)
  workers.startFile(params)

  //start the logger:
  stat.hound(options.db)

  // let writing = 0
  workers.on("msg", async (msg) => {
    if (msg.type === "insertToDb") {
      // writing += 1
      await writeDb(msg.pages, options)
    // writing -= 1
    }
  })

  workers.on("allWorkersFinished", () => {
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
          options.client.close()
          process.exit()
        })
      })
    })
  })
}

module.exports = main;
