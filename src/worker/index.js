const chalk = require('chalk')
const fns = require('../../lib/fns')
const LineByLineReader = require('line-by-line')
const init = require('../01-init-db');
const parseLine = require('./01-parseLine')
const parseWiki = require('./02-parseWiki');

const doSection = async (options, chunkSize, workerNum) => {
  let startByte = 0
  let lineCount = 0
  if (workerNum !== 0) {
    // start a megabyte earlier
    startByte = (workerNum * chunkSize) //- 1000000
  }
  // end 2 megabytes later so we don't lose pages cut by chunks
  let endByte = startByte + chunkSize //+ 3000000
  // logger.info(`worker pid:${process.pid} is now alive. startByte: ${startByte} endByte: ${endByte}`)
  await init(options)

  console.log('worker #' + workerNum + ' : ' + startByte + '→' + endByte)

  let lr = new LineByLineReader(options.file, {
    start: startByte,
    end: endByte
  });

  let state = {};
  let pageCount = 0;
  let pages = [];
  let workerBegin = Date.now()
  let doArticleTimeCounter = 0

  const insertToDb = function(isLast) {
    lr.pause();
    console.log('   --- on line ' + lineCount)
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
    doArticleTimeCounter = 0
    let seconds = ((Date.now() - workerBegin) / 1000).toFixed(1)
    console.log(chalk.grey(`    - wrote ${fns.niceNumber(pageCount)} pages  - ${seconds}s   `) + chalk.yellow(`worker #${workerNum}`));
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
      console.log(chalk.green('   -skipping page: "' + pageObj.title + '"'))
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
    lineCount += 1
  });

  lr.on('end', function() {
    // All lines are read, file is closed now.
    // insert remaining pages.
    insertToDb(true);
  });
  return (process.pid)
};

module.exports = {
  doSection: doSection
}
