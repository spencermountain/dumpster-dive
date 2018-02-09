//logic for parsing an object's xml
const transform = require('./02-transform-wiki');

// we send job to job queue (redis)
// run job queue dashboard to see statistics
// node node_modules/kue/bin/kue-dashboard -p 3050
const addToQueue = function(queue, data) {
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
const doArticle = function(page, options) {
  //ignore 'talk pages', etc.
  if (page.ns === '0') {
    console.log(page.title);
    let script = page.revision.text['$text'] || '';
    let data = {
      title: page.title,
      script: script
    };
    //if we're using redis,
    if (options.queue) {
      addToQueue(options.queue, data)
    } else {
      try {
        return transform(data, options)
      } catch (err) {
        console.log(err);
        return null
      }
    }
  }
  return null
}
module.exports = doArticle
