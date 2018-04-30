const chalk = require('chalk')
const fns = require('../../lib/fns')
const LineByLineReader = require('line-by-line')
const init = require('../01-init-db');
const parseLine = require('./01-parseLine')
const parseWiki = require('./02-parseWiki');

const getPages = async (options, chunkSize, workerNr) => {
  var startByte,
    insertToDb,
    state,
    lr,
    pageCount,
    pages;

  if (workerNr === 0) {
    startByte = 0
  } else {
    // start a megabyte earlier
    startByte = (workerNr * chunkSize) - 1000000
  }
  // end 2 megabytes later so we don't lose pages cut by chunks
  endByte = startByte + chunkSize + 3000000
  // logger.info(`worker pid:${process.pid} is now alive. startByte: ${startByte} endByte: ${endByte}`)
  await init(options)

  lr = new LineByLineReader(options.file, {
    start: startByte,
    end: endByte
  });

  state = {};
  pageCount = 0;
  pages = [];
  workerBegin = Date.now()
  jobBegin = Date.now()
  doArticleTimeCounter = 0

  insertToDb = function(isLast) {
    lr.pause();
    process.send({
      type: "insertToDb",
      pages: pages,
      length: pages.length,
      pid: process.pid,
      timeSpent: {
        total: Date.now() - workerBegin,
        doArticle: doArticleTimeCounter
      }
    })
    pages = [];
    jobBegin = Date.now()
    doArticleTimeCounter = 0
    page = {}
    let seconds = ((Date.now() - workerBegin) / 1000).toFixed(1)
    console.log(chalk.grey(`    - wrote ${fns.niceNumber(pageCount)} pages  - ${seconds}s   `) + chalk.yellow(`(worker #${process.pid})`));
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
    }
    // doArticleTimeCounter += Date.now() - doArticleTime
    if (pageCount % options.batch_size === 0) {
      insertToDb();
    }
  }

  lr.on('error', (e) => {
    // 'err' contains error object
    console.error(chalk.red("linereader error"));
    console.log(e)
  });

  lr.on('line', (line) => {
    state = parseLine(line, state, donePage)
  });

  lr.on('end', function() {
    // All lines are read, file is closed now.
    // insert remaining pages.
    insertToDb(true);
  });
  return (process.pid)
};

module.exports = {
  getPages
}
