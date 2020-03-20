//stream a big wikipedia xml.bz2 file into mongodb
//  because why not.
// const chalk = require('chalk');
const prelim = require('./01-prepwork');
const WorkerPool = require('./02-Worker-pool');
const hound = require('./03-logger');
// const openDB = require('./lib/open-db');
const fns = require('./lib/fns');
const oneSec = fns.oneSec;
// const start = Date.now();
const noop = function() {};

const finish = async function(options) {
  // const obj = await openDB(options);
  // console.log('\n\n      👍  closing down.\n');
  // const count = await obj.col.countDocuments();
  // const duration = fns.timeSince(start);
  // console.log('     -- final count is ' + chalk.magenta(fns.niceNumber(count)) + ' pages --');
  // console.log('       ' + chalk.yellow(`took ${duration}`));
  // console.log('              🎉');
  // console.log('\n\n');
  // await obj.client.close();
  process.exit();
};

//open up a mongo db, and start xml-streaming..
const main = (options, done) => {
  done = done || noop;

  //make sure the file exists, and things
  options = prelim(options);

  //init workers
  const workers = new WorkerPool(options);
  workers.start();

  //start the logger:
  const logger = hound(options, workers);
  logger.start();

  workers.on('allWorkersFinished', () => {
    logger.stop();
    oneSec(async () => {
      await done();
      oneSec(() => {
        finish(options);
      });
    });
  });

  //handle ctrl-c gracefully
  process.on('SIGINT', async function() {
    logger.stop();
    workers.cleanup();
    oneSec(() => {
      process.exit();
    });
  });
};

module.exports = main;
