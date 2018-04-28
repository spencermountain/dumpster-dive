const wtf = require('wtf_wikipedia');
const chalk = require('chalk');
const encode = require('./_encode');

//get parsed json from the wiki markup
const parseData = function(page, options) {
  try {
    let doc = wtf(page.script);
    //dont insert this if it's a redirect
    if (options.skip_redirects === true && doc.isRedirect()) {
      return null
    }
    if (options.skip_disambig === true && doc.isDisambiguation()) {
      return null
    }
    //turn the wtf_wikipedia document into storable json
    let data = doc.json(options)
    data.title = page.title || data.title
    data = encode.encodeData(data);
    //use the title/pageID from the xml
    data.title = page.title || data.title || '';
    data.pageID = page.pageID || data.pageID || '';
    data._id = encode.encodeStr(data.title);
    return data
  } catch (e) {
    console.log(chalk.red('\n---Error on "' + page.title + '"'))
    console.log(e)
    return null
  }
};

module.exports = parseData
