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
const batchSize = 10

//open up a mongo db, and start xml-streaming..
const main = function(options, callback) {
  callback = callback || function() {}
  // Connect to mongo
  init(options, function(params) {
    let i = 1; //the # article we're on
    let queue = [] //the articles to write

    // Create a file stream and pass it to XmlStream
    let stream = fs.createReadStream(params.file).pipe(bz2());
    let xml = new XmlStream(stream);
    xml._preserveAll = true; //keep newlines

    // this is the xml element we're looking for.
    xml.on('endElement: page', function(page) {
      i += 1 //increment counter
      if (i > options.skip_first) {
        let data = doArticle(page, params, queue)
        //add these to a queue of pages
        if (data !== null) {
          queue.push(data)
          //should we write to the db now?
          if (queue.length >= batchSize) {
            xml.pause() //hold-up for now
            writeDb(queue, options.collection, () => {
              queue = []
              xml.resume() //ok, go again
            })
          }
        }
      }
    });

    xml.on('error', function(message) {
      console.log('Parsing failed: ' + message);
      options.database.close();
      callback()
    });

    xml.on('end', function() {
      if (queue.length > 0) {
        writeDb(queue, options.collection, () => {
          done(options, callback)
        })
      } else {
        done(options, callback)
      }
    });

  });
};

module.exports = main;
