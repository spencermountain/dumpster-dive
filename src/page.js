const parse = require('./parse');

const doQueue = function(queue, data) {
  // we send job to job queue (redis)
  // run job queue dashboard to see statistics
  // node node_modules/kue/bin/kue-dashboard -p 3050
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

//
const doPage = function(page, options, queue, cb) {

  if (page.ns === '0') {
    let script = page.revision.text['$text'] || '';

    if (options.verbose === true) {
      console.log(page.title);
    }
    let data = {
      title: page.title,
      script: script,
      skip_redirects: options.skip_redirects,
      skip_disambig: options.skip_disambig,
    };

    if (queue !== null) {
      doQueue(queue, data)
    } else {
      try {
        if (options.plaintext) {
          parse.plaintext(data, options.collection, cb);
        } else {
          parse.parse(data, options.collection, cb);
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  return
}
module.exports = doPage
