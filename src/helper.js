let wtf = require('wtf_wikipedia')

//this method may run in it's own process
exports.processScript = function(options, cb) {
  let data = wtf.parse(options.script)
  data.title = options.title
  options.collection.insert(data, function(e) {
    if (e) {
      console.log(e)
      return cb(e)
    }
    return cb()
  })
}
