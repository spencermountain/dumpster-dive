const chalk = require('chalk')
const fns = require('../../lib/fns')
const LineByLineReader = require('line-by-line')
const init = require('../01-init-db');
const parseLine = require('./01-parseLine')
const parseWiki = require('./02-parseWiki');
const writeDb = require('./03-write-db');

const doSection = async (options, chunkSize, workerNum) => {
  let startByte = 0
  if (workerNum !== 0) {
    startByte = (workerNum * chunkSize) //- 1000000 // start a megabyte earlier
  }
  let endByte = startByte + chunkSize //+ 3000000 // end 2 megabytes later so we don't lose pages cut by chunks

  await init(options)
  // console.log('worker #' + workerNum + ' : ' + startByte + '→' + endByte)

  let lr = new LineByLineReader(options.file, {
    start: startByte,
    end: endByte
  });

  let state = {};
  let pageCount = 0;
  let pages = [];
  let workerBegin = Date.now()

  const insertToDb = async function(isLast) {
    lr.pause();
    console.log('writing ' + pages.length + ' pages')
    await writeDb(pages)
    // process.send({
    //   type: "insertToDb",
    //   pages: pages,
    //   length: pages.length,
    //   pid: process.pid
    // })
    pages = [];
    console.log('--wrote pages')

    //log some nice kinda output
    let seconds = ((Date.now() - workerBegin) / 1000).toFixed(1)
    let str = chalk.yellow(`worker #${workerNum}  - `)
    str += chalk.grey(` +${fns.niceNumber(options.batch_size)} pages  - (${seconds}s)  - `)
    str += chalk.magenta(` at ${fns.niceNumber(pageCount)}`)
    console.log(str);

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
