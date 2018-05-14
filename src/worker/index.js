const chalk = require('chalk')
const fns = require('../lib/fns')
const LineByLineReader = require('line-by-line')
const parseLine = require('./01-parseLine')
const parseWiki = require('./02-parseWiki');
const writeDb = require('./03-write-db');

const doSection = async (options, chunkSize, workerNum) => {
  let startByte = 0
  if (workerNum !== 0) {
    startByte = (workerNum * chunkSize) //- 1000000 // start a megabyte earlier
  }
  let endByte = startByte + chunkSize //+ 3000000 // end 2 megabytes later so we don't lose pages cut by chunks

  // console.log('starting worker #' + workerNum + ' :      ' + startByte + ' → ' + endByte)
  let lr = new LineByLineReader(options.file, {
    start: startByte,
    end: endByte
  });

  let state = {};
  let pageCount = 0;
  let pages = [];
  // let workerBegin = Date.now()

  const insertToDb = async function(isLast) {
    lr.pause();
    if (pages.length > 0) {
      await writeDb(options, pages, workerNum)
    }
    pages = [];

    //log some nice kinda output
    // let seconds = ((Date.now() - workerBegin) / 1000).toFixed(1)
    // let output = chalk.yellow(`worker #${workerNum}  - `)
    // output += chalk.grey(` +${fns.niceNumber(options.batch_size)} pages  - (${seconds}s)  - `)
    // output += chalk.magenta(` at ${fns.niceNumber(pageCount)}`)
    // console.log('    ' + output);

    workerBegin = Date.now()
    lr.resume();
    if (isLast === true) {
      process.send({
        type: "workerDone",
        pid: process.pid
      })
    }
  };

  //reached the end of a page
  const donePage = function(pageObj) {
    pageCount += 1
    pageObj = parseWiki(pageObj, options)
    if (pageObj !== null) {
      pages.push(pageObj);
    } else {
      console.log(chalk.green('   -skipping page: ""'))
    }
    // doArticleTimeCounter += Date.now() - doArticleTime
    if (pageCount % options.batch_size === 0) {
      insertToDb();
    }
  }

  lr.on('error', (e) => {
    console.error(chalk.red("linereader error"));
    console.log(e)
  });

  lr.on('line', (line) => {
    state = parseLine(line, state, donePage)
  });

  // All lines are read, file is closed now.
  lr.on('end', function() {
    insertToDb(true); // (insert the remaining pages)
  });
  return process.pid
};

module.exports = {
  doSection: doSection
}
