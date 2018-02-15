const LineByLineReader = require('line-by-line')
const init = require('../00-init-db');
const logger = require('./_logger')
const parseLine = require('./parseLine')

const xmlSplit = async (options, chunkSize, workerNr) => {
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
  logger.info(`worker pid:${process.pid} is now alive. startByte: ${startByte} endByte: ${endByte}`)
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
  insertToDb = function(last) {
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
    workerBegin = Date.now()
    logger.info(`batch complete: worker pid:${process.pid} inserted ${pageCount} pages in ${((Date.now() - workerBegin) / 1000)} secs. doArticle took ${doArticleTimeCounter / 1000} secs.`);
    lr.resume();
    if (last) {
      process.send({
        type: "workerDone",
        pid: process.pid
      })
    }
  };
  lr.on('error', () => {
    // 'err' contains error object
    logger.error("linereader error");
  });

  lr.on('line', (line) => {
    state = parseLine(line, state, options, insertToDb)
  });

  lr.on('end', function() {
    // All lines are read, file is closed now.
    // insert remaining pages.
    insertToDb(true);
    logger.info(`worker pid:${process.pid} is done. inserted ${pageCount} pages in ${((Date.now() - workerBegin) / 1000)} secs. doArticle took ${doArticleTimeCounter / 1000} secs.`);
  // process.exit()
  });
  return (process.pid)
};

module.exports = {
  xmlSplit
}
