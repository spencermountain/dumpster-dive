//logic for parsing an object's xml
const transform = require('./02-transform-wiki');
const XmlStream = require('xml-stream');
var str = require('string-to-stream')

// get wikiscript from the xml, parse it, and send it to mongo
const doArticle = function(pageStr, options, callback) {

  let xml = new XmlStream(str(pageStr));

  //xml.on("end",(page)=>{
  xml.on('endElement: page', async (page) => {
    // ignore 'talk pages', etc.
    if (page.ns === '0') {
      if (options.verbose === true) {
        console.log(page.title);
      }
      let script = page.revision.text['$text'] || '';
      let data = {
        title: page.title,
        script: script
      };
      try {
        return callback(transform(data, options))
      } catch (err) {
        console.log(err);
        return null
      }
    }
    return null
  });

}
module.exports = doArticle
