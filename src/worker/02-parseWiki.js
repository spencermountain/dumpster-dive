// const wtf = require('/Users/spencer/mountain/wtf_wikipedia/src');
const wtf = require('wtf_wikipedia');
const chalk = require('chalk');
const encode = require('./_encode');

//doesn't support fancy things like &copy; to ©, etc
const escapeXML = function(str) {
  return str.replace(/&apos;/g, '\'')
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
};

//get parsed json from the wiki markup
const parseWiki = function(page, options) {
  try {
    page.wiki = escapeXML(page.wiki || '');
    let doc = wtf(page.wiki);
    //dont insert this if it's a redirect
    if (options.skip_redirects === true && doc.isRedirect()) {
      return null;
    }
    if (options.skip_disambig === true && doc.isDisambiguation()) {
      return null;
    }
    //turn the wtf_wikipedia document into storable json
    let data = {};
    if (!options.custom) { //default format
      data = doc.json(options);
    } else { //DIY format
      data = options.custom(doc);
    }
    data.title = page.title || data.title;
    data = encode.encodeData(data);
    //use the title/pageID from the xml
    data.title = page.title || data.title || '';
    data.pageID = page.pageID || data.pageID || '';
    data._id = encode.encodeStr(data.title);
    return data;
  } catch (e) {
    console.log(chalk.red('\n---Error on "' + page.title + '"'));
    console.log(e);
    return null;
  }
};

module.exports = parseWiki;
