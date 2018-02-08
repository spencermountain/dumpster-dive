const wtf = require('wtf_wikipedia');
const encode = require('./_encode');

//get readable text from the wiki markup
const plaintext = function(options, collection, cb) {
  let data = {
    title: options.title,
    _id: encode.encodeStr(options.title),
    plaintext: wtf.plaintext(options.script)
  };
  collection.insert(data, function(e) {
    if (e) {
      console.log(e);
      return cb(e);
    }
    return cb();
  });
};

module.exports = plaintext
