//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const fs = require('fs');
const XmlStream = require('xml-stream');
const MongoClient = require('mongodb').MongoClient;
const bz2 = require('unbzip2-stream');
const doArticle = require('./01-article-logic');
const done = require('./_done');
const defaults = {
  skip_first: 0,
  verbose: true
}

//open up a mongo db, and start xml-streaming..
const main = function(options, callback) {
  options = Object.assign(options, defaults)
  callback = callback || function() {};
  //this is required
  if (!options.file) {
    console.log('please supply a filename for the wikipedia article dump in bz2 format');
    process.exit(1);
  }
  // make redis and queue requirement optional
  let queue = null;
  if (options.worker) {
    queue = require('./redis/queue');
  }
  //log a handy msg about skipping..
  if (options.skip_first > 0) {
    console.log('\n\n\n -- skipping first ' + options.skip_first + ' articles...')
  }
  // Connect to mongo
  let url = 'mongodb://localhost:27017/' + options.db;
  MongoClient.connect(url, function(err, db) {
    let i = 1; //the # article we're on
    if (err) {
      console.log(err);
      process.exit(1);
    }
    options.collection = db.collection('wikipedia');
    // Create a file stream and pass it to XmlStream
    let stream = fs.createReadStream(options.file).pipe(bz2());
    let xml = new XmlStream(stream);
    xml._preserveAll = true; //keep newlines

    // this is the xml element we're looking for.
    xml.on('endElement: page', function(page) {
      i += 1 //increment counter
      if (i > options.skip_first) {
        doArticle(page, options, queue, function() {
          console.log('  - ')
        })
      }
    });

    xml.on('error', function(message) {
      console.log('Parsing failed: ' + message);
      db.close();
      callback()
    });

    xml.on('end', function() {
      //let any remaining async writes complete
      console.log('--- just letting the queue finish-up...');
      setTimeout(function() {
        done(options, db);
        db.close();
        callback();
      }, 5000); //5 seconds
    });
  });
};

module.exports = main;
