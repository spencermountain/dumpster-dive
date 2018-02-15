const wtf = require('wtf_wikipedia');
const encode = require('./_encode');

//get readable text from the wiki markup
const plaintext = function(page) {
  return {
    title: page.title,
    _id: encode.encodeStr(page.title || ''),
    plaintext: wtf.plaintext(page.script)
  };
}

//get parsed json from the wiki markup
const parseData = function(page, options) {
  let data = wtf.parse(page.script);
  //dont insert this if it's a redirect
  if (options.skip_redirects === true && data.type === 'redirect') {
    return null
  }
  if (options.skip_disambig === true && data.type === 'disambiguation') {
    return null
  }
  data = encode.encodeData(data);
  data.title = data.title || page.title || '';
  data._id = encode.encodeStr(data.title);
  return data
};

//
const transform = function(page, options) {
  //if we're just storing article text
  if (options.plaintext) {
    return plaintext(page, options);
  }
  //if we're storing full json
  return parseData(page, options);
}
module.exports = transform
