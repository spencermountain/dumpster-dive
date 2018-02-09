console.log("foo");

//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const fs = require('fs');
const XmlStream = require('xml-stream');
const bz2 = require('unbzip2-stream');
const init = require('./00-init-db');
const doArticle = require('./01-article-logic');
const writeDb = require('./03-write-db');
const done = require('./_done');
const noop = () => {}

process.on('unhandledRejection', up => { throw up })

//open up a mongo db, and start xml-streaming..
const main = async (options, callback=noop) => {
  // Connect to mongo
  await init(options)
  let i = 1; //the # article we're on
  let queue = [] //the articles to write

  // Create a file stream and pass it to XmlStream
  let stream = fs.createReadStream(options.file).pipe(bz2());
  let xml = new XmlStream(stream);
  xml._preserveAll = true; //keep newlines

  // this is the xml element we're looking for.
  xml.on('endElement: page', async (page) => {
    i += 1 //increment counter
    if (i > options.skip_first) {

      let data = doArticle(page, options, queue)
      //add these to a queue of pages
      if (data !== null) {
        queue.push(data)
        //should we write to the db now?
        if (queue.length >= options.batch_size) {
          xml.pause() //hold-up for now
          writeDb(queue, options, () => {
            queue = []
            xml.resume() //ok, go again
          })
        }
      }
    }
    else{
      //provide logs for large skip numbers.
      if (i === 1){
        console.log(`job started, will skip ${options.skip_first} pages. please wait...`)
      }
      if (i%1000 === 0){
        console.log(`skipped ${i}/${options.skip_first}th page...`)
      }
      if (options.skip_first === i){
        console.log("skip_first complete.")
      }
    }
  });

  xml.on('error', async (message) => {
    console.log('Parsing failed: ' + message);
    db.close();
    callback()
  });

  xml.on('end', async () => {
    if (queue.length > 0) {
      writeDb(queue, options, async () => {
        await done(collection)
      })
    } else {
      await done(collection)
      db.close()
    }
  });


};

module.exports = main;
