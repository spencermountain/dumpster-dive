//logic for parsing an object's xml
const parseWiki = require('./02-parse-wiki');
const plaintext = require('./_plaintext');

// we send job to job queue (redis)
// run job queue dashboard to see statistics
// node node_modules/kue/bin/kue-dashboard -p 3050
const doQueue = function(queue, data) {
  queue
    .create('article', data)
    .removeOnComplete(true)
    .attempts(3)
    .backoff({
      delay: 10 * 1000,
      type: 'exponential'
    })
    .save();
}

// get wikiscript from the xml, parse it, and send it to mongo
const doPage = function(page, options, queue, cb) {
  //ignore 'talk pages', etc.
  if (page.ns === '0') {
    if (options.verbose === true) {
      console.log(page.title);
    }
    let script = page.revision.text['$text'] || '';
    let data = {
      title: page.title,
      script: script,
      skip_redirects: options.skip_redirects,
      skip_disambig: options.skip_disambig,
    };
    //if we're using redis,
    if (queue !== null) {
      doQueue(queue, data)
    } else {
      try {
        //if we're just storing article text
        if (options.plaintext) {
          plaintext(data, options.collection, cb);
        } else {
          //if we're storing full json
          parseWiki(data, options.collection, cb);
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}
module.exports = doPage
