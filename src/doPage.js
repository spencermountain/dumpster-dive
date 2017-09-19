let wtf = require('wtf_wikipedia')
//these methods may run in their own processes

//https://stackoverflow.com/questions/12397118/mongodb-dot-in-key-name/30254815#30254815
const encodeStr = function(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/^\$/, '\\u0024')
    .replace(/\./g, '\\u002e')
}

//tables & infoboxes both could potentially have unsafe keys
const encodeData = function(data) {
  data = data || {}
  //encode keys in infoboxes
  if (data.infoboxes && data.infoboxes.length > 0) {
    data.infoboxes.forEach(info => {
      let keys = Object.keys(info.data)
      keys.forEach(k => {
        if (k !== encodeStr(k)) {
          info.data[encodeStr(k)] = info.data[k]
          delete info.data[k]
        }
      })
    })
  }
  //cleanup table-keys
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach(o => {
      if (o.tables && o.tables.length > 0) {
        o.tables.forEach(table => {
          table.forEach(row => {
            let keys = Object.keys(row)
            keys.forEach(k => {
              if (k !== encodeStr(k)) {
                row[encodeStr(k)] = row[k]
                delete row[k]
              }
            })
          })
        })
      }
    })
  }
  return data
}

//get parsed json from the wiki markup
const parse = function(options, cb) {
  let data = wtf.parse(options.script)
  data = encodeData(data)
  data.title = options.title
  // data._id = encodeStr(options.title)
  // console.log(data)
  options.collection.insert(data, function(e) {
    if (e) {
      console.warn(e)
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
