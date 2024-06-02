const chalk = require('chalk');
const openDB = require('../lib/open-db');
const fns = require('../lib/fns');
const mongoConfig = {
  ordered: false
};

//report how many pages we wrote this time
const writeMsg = function(pages, count, start, workerNum) {
  let msg = chalk.yellow(` #${workerNum}  `);
  count = fns.niceNumber(count);
  msg += chalk.green(`+${count} `) + 'pages';
  msg += chalk.grey('  -  ' + fns.timeSince('  ' + start));
  msg += chalk.blue(` - `);
  msg += chalk.magenta(`"${pages[0].title}"`);
  console.log(msg);
};

const writeDb = async (options, pages, workerNum) => {
  const start = Date.now();
  const obj = await openDB(options);

  // Prepare bulk operations
  const bulkOps = pages.map(page => ({
    updateOne: {
       filter: { _id: page._id }, // Assuming `_id` is the unique key
       update: { $set: page },
       upsert: true,
    },
  }));
    
  const result = await obj.col.bulkWrite(bulkOps, mongoConfig).catch(async err => {
    if (err.code === 11000) {
      let errCount = err.result.getWriteErrorCount();
      errCount = fns.niceNumber(errCount);
      console.log(chalk.red(`-- ${errCount}  duplicate pages --`));
    } else {
      console.log(chalk.red(`   ====DB write error (worker ${workerNum})===`));
      console.log(err);
    }
    //pretty-print this duplicate-pages error
    if (err.result) {
      // err = err.result.toJSON();
      err = err.result;
      const count = err.nInserted;
      writeMsg(pages, count, start, workerNum);
    }
    await obj.client.close();
  });
  //no errors thrown, all good
  if (result) {
    const count = result.upsertedCount;
    writeMsg(pages, count, start, workerNum);
    await obj.client.close();
  }
};

module.exports = writeDb;
