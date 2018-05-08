//stream a big wikipedia xml.bz2 file into mongodb
//  because why not.
const chalk = require('chalk')
const WorkerPool = require("./Worker-pool")
const fns = require('../lib/fns')
const stat = require('../lib/stat')
const prelim = require('./01-prelim')
const oneSec = fns.oneSec
const start = Date.now()

//open up a mongo db, and start xml-streaming..
const main = (options, done) => {
  options = Object.assign({}, options);
  done = done || function() {}

  //make sure the file exists, and things
  options = prelim(options)

  let workers = new WorkerPool()
  workers.startFile(options)

  //start the logger:
  stat.hound(options.db)

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
