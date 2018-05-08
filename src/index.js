//stream a big wikipedia xml.bz2 file into mongodb
//  because why not.
const chalk = require('chalk')
const prelim = require('./01-prelim-stuff')
const WorkerPool = require("./02-Worker-pool")
const logger = require("./03-logger")
const fns = require('../lib/fns')
const oneSec = fns.oneSec
const start = Date.now()
const noop = function() {}

//open up a mongo db, and start xml-streaming..
const main = (options, done) => {
  done = done || noop

  //make sure the file exists, and things
  options = prelim(options)

  //init workers
  let workers = new WorkerPool()
  workers.start(options)

  //start the logger:
  logger.hound(options, workers)

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

  //handle ctrl-c gracefully
  process.on('SIGINT', async function() {
    workers.terminate();
    oneSec(() => {
      process.exit();
    })
  });

}

module.exports = main;
