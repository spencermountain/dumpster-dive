let wtf = require('wtf_wikipedia')
//these methods may run in their own processes

//https://stackoverflow.com/questions/12397118/mongodb-dot-in-key-name/30254815#30254815
const encodeKey = function(key) {
  return key
    .replace('\\', '\\\\')
    .replace(/^$/, '\\u0024')
    .replace(/\./, '\\u002e')
}

//get parsed json from the wiki markup
const parse = function(options, cb) {
  let data = wtf.parse(options.script)
  let title = encodeKey(options.title || '')
  console.log(title)
  data.title = title
  data._id = title
  options.collection.insert(data, function(e) {
    if (e) {
      console.log(e)
      return cb(e)
    }
    return cb()
  })
}

//get readable text from the wiki markup
const plaintext = function(options, cb) {
  let plaintext = wtf.plaintext(options.script)
  let data = {
    title: options.title,
    _id: options.title,
    plaintext: plaintext
  }
  options.collection.insert(data, function(e) {
    if (e) {
      console.log(e)
      return cb(e)
    }
    return cb()
  })
}

module.exports = {
  parse: parse,
  plaintext: plaintext
}
