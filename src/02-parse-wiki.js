const encode = require('./_encode');
const wtf = require('wtf_wikipedia');

//get parsed json from the wiki markup
const parse = function(options, collection, cb) {
  let data = wtf.parse(options.script);
  //dont insert this if it's a redirect
  if (options.skip_redirects === true && data.type === 'redirect') {
    cb()
    return
  }
  if (options.skip_disambig === true && data.type === 'disambiguation') {
    cb()
    return
  }
  data = encode.encodeData(data);
  data.title = data.title || options.title;
  data._id = encode.encodeStr(data.title);
  // options.collection.update({ _id: data._id }, data, { upsert: true }, function(e) {
  collection.insert(data, function(e) {
    if (e) {
      console.warn(e);
      cb(e);
      return
    }
    cb();
  });
};


module.exports = parse
