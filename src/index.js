//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const fs = require('fs');
const XmlStream = require('xml-stream');
const bz2 = require('unbzip2-stream');
const init = require('./00-init-db');
const writeDb = require('./03-write-db');
const done = require('./_done');
const moment = require("moment")
const mt = require("./multithreader")
const noop = () => {}

var jobBegin = 0
process.on('unhandledRejection', up => { console.log(up) })

//open up a mongo db, and start xml-streaming..
const main = async (options, callback=noop) => {
  
  params = Object.assign({}, options);

  await init(options)

  mt.worker.parseXML(params)

  writing = 0
  mt.worker.on("msg", async (msg) => {
    if (msg.type === "insertToDb"){
      // console.log("-->",msg.length,msg.pages.length)
      writing++
      res = await writeDb(msg.pages,options,"wikipedia")
      writing--
      console.log("worker "+msg.pid+":"+res+` batch took ${Math.round((msg.timeSpent.total)/1000)} secs. --doArticle()-- took ${Math.round(msg.timeSpent.doArticle/1000)} secs.`)
    }
  })

  mt.worker.on("allWorkersFinished", ()=>{

    setInterval(()=>{
      if (writing === 0){
        console.log("all done, exiting...")
        process.exit()
      }
    },500)

  })

  // await init(options)
  // setInterval( async () => {
  //   count = await options.db.collection("queue").count()
  //   console.log(`final doc count: ${count} in last 60 seconds.`)
  // },60000)

}

module.exports = main;
