//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const fs = require('fs');
const XmlStream = require('xml-stream');
const MongoClient = require('mongodb').MongoClient;
const bz2 = require('unbzip2-stream');
const doPage = require('./page');

const main = function(options, callback) {
  options.skip_first = options.skip_first || 0
  options.verbose = options.verbose || false
  options.threshold = options.threshold || 5000000
  options.start_delay = options.start_delay || 1000
  callback = callback || function() {};

  if (options.skip_first > 0) {
    console.log('\n\n\n -- skipping first ' + options.skip_first + ' articles...')
  }
  if (!options.file) {
    console.log('please supply a filename for the wikipedia article dump in bz2 format');
    process.exit(1);
  }

  // make redis and queue requirement optional
  let queue = null;
  if (options.worker) {
    queue = require('./queue');
  }

  // Connect to mongo
  let url = 'mongodb://localhost:27017/' + options.db;
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    options.collection = db.collection('wikipedia');
    // Create a file stream and pass it to XmlStream
    let stream = fs.createReadStream(options.file).pipe(bz2());
    let xml = new XmlStream(stream);
    xml._preserveAll = true; //keep newlines

    let i = 1;
    let last = 0;
	let pauseThreshold = options.threshold
	let startDelay = options.start_delay

    //this is our logger
    console.log('\n\n --- starting xml parsing --\n')
    let logger = setInterval(function() {
      let diff = (i - last).toLocaleString()
      console.log('\n\n+' + diff + ' pages  - -  (at #' + i.toLocaleString() + ')')
      last = i
    }, 5000);

    //this lets us a clear the queue
    let holdUp = setInterval(function() {
	  if (i > pauseThreshold) {
        console.log('\n\n-- taking a quick break..--')
		let duration = Math.round((i / pauseThreshold) * startDelay);
        xml.pause();
        setTimeout(function() {
          xml.resume();
          console.log('.. ok back. \n')
        }, duration)
	  }
    }, 30000);

    xml.on('endElement: page', function(page) {
      i += 1
      if (i > options.skip_first) {
        doPage(page, options, queue, function() {})
      }
    });

    xml.on('error', function(message) {
      console.log('Parsing failed: ' + message);
      db.close();
    });

    const done = function() {
      console.log('=================done!=================');
      options.collection.count().then(count => {
        console.log(count + "  pages stored in db '" + options.db + "'");
        db.close();
        clearInterval(logger)
        clearInterval(holdUp)
        callback();
      });
    };

    xml.on('end', function() {
      if (!queue) {
        done();
      } else {
        //let any remaining async writes complete
        console.log('--- just letting the queue finish-up...');
        setTimeout(function() {
          done();
        }, 20000); //20 seconds
      }
    });
  });
};

module.exports = main;
