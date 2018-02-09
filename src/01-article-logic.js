//logic for parsing an object's xml
const transform = require('./02-transform-wiki');

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
    try {
      return transform(data, options)
    } catch (err) {
      console.log(err);
      return null
    }
  }
  return null
}
module.exports = doArticle
