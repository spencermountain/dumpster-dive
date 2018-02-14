const LineByLineReader = require('line-by-line')
const fs   = require("fs")
const init = require('./00-init-db');
const log4js = require('log4js');
const doArticle = require('./01-article-logic');


log4js.configure({
  appenders: { cheese: { type: 'file', filename: '/tmp/worker.logs' } },
  categories: { default: { appenders: ['cheese'], level: 'info' } }
});


const logger = log4js.getLogger('cheese');


const xmlSplit = async (options, chunkSize, workerNr) => {
  var cpuCount, file, insertToDb, lineNumber, lr, page, pageCount, pages, size;
    
  if (workerNr === 0){
    startByte = 0
  }
  else
  {
    // start a megabyte earlier
    startByte = (workerNr*chunkSize)-1000000
  }
  
  // end 2 megabytes later so we don't lose pages cut by chunks
  endByte   = startByte+chunkSize+3000000


  logger.info(`worker pid:${process.pid} is now alive. startByte: ${startByte} endByte: ${endByte}`)
  await init(options)

  file = options.file;
  lr = new LineByLineReader(file, {
    start: startByte,
    end: endByte
  });


  page = null;
  pageCount = 0;
  pages = [];
  workerBegin = Date.now()
  jobBegin = Date.now()
  doArticleTimeCounter = 0
  insertToDb = function(last) {
    lr.pause();
    process.send({type:"insertToDb",pages:pages,length:pages.length,pid: process.pid, timeSpent:{total:Date.now()-workerBegin,doArticle:doArticleTimeCounter}})
    pages = [];
    jobBegin = Date.now()
    doArticleTimeCounter = 0
    workerBegin = Date.now()
    logger.info(`batch complete: worker pid:${process.pid} inserted ${pageCount} pages in ${((Date.now()-workerBegin)/1000)} secs. doArticle took ${doArticleTimeCounter/1000} secs.`);
    lr.resume();
    if(last){
      process.send({type:"workerDone",pid:process.pid})
    }
  };
  lr.on('error', (err) => {
    // 'err' contains error object
    logger.error("linereader error");
  });
  
  lr.on('line', (line) => {

    if (line.indexOf("<page>") !== -1) {
      page = {body:line, skip: false, title: null}
      pageCount++;
    }    
    
    if (page) {
      page.body += line;

      if (!page.title && line.indexOf("<title>") !== -1) {
        page.title = line.substring(line.lastIndexOf("<title>") + 7, line.lastIndexOf("</title>"));
      }
      
      if (line.indexOf("<ns>") > -1){ 
        if(line.indexOf("<ns>0</ns>") === -1) {
          logger.info("skipping",page.title)
          page.skip = true;
        }
      }

      if (line.indexOf("</page>") !== -1) {
        if (!page.skip) {
          doArticleTime = Date.now()
          doArticle(page.body,options,(pageObj)=>{
            doArticleTimeCounter += Date.now()-doArticleTime
            if (pageObj){
              pages.push(pageObj);          
            }
            if (pageCount % options.batch_size === 0) {
              insertToDb();
            }
          })
        }
        page = null;
      }

      // let's catch these before parsing for extra speed.

      // if (options.skip_redirects === true && data.type === 'redirect') {
      //   return null
      // }
      // if (options.skip_disambig === true && data.type === 'disambiguation') {
      //   return null
      // }

    }
  });
  
  lr.on('end', function() {
    // All lines are read, file is closed now.
    // insert remaining pages.
    insertToDb(true);
    logger.info(`worker pid:${process.pid} is done. inserted ${pageCount} pages in ${((Date.now()-workerBegin)/1000)} secs. doArticle took ${doArticleTimeCounter/1000} secs.`);
    // process.exit()
    
    
  });
  return(process.pid)
};

module.exports = {xmlSplit}
