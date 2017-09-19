//stream a big wikipedia xml.bz2 file into mongodb
// usage:
//   node index.js afwiki-latest-pages-articles.xml.bz2
const fs = require('fs')
const XmlStream = require('xml-stream')
const MongoClient = require('mongodb').MongoClient
const bz2 = require('unbzip2-stream')
const doPage = require('./doPage')

const leftPad = function(str) {
  var pad = '                              '
  return str + pad.substring(0, pad.length - str.length)
}

const main = function(obj, callback) {
  const file = obj.file
  callback = callback || function() {}

  if (!file) {
    console.log('please supply a filename for the wikipedia article dump in bz2 format')
    process.exit(1)
  }

  // make redis and queue requirement optional
  let queue = null
  if (obj.worker) {
    queue = require('./queue')
  }

  // Connect to mongo
  let url = 'mongodb://localhost:27017/' + obj.db
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    let col = db.collection('wikipedia')
    // Create a file stream and pass it to XmlStream
    let stream = fs.createReadStream(file).pipe(bz2())
    let xml = new XmlStream(stream)
    xml._preserveAll = true //keep newlines

    let i = 1
    xml.on('endElement: page', function(page) {
      if (page.ns === '0') {
        let script = page.revision.text['$text'] || ''

        console.log(leftPad(page.title) + ' ' + i)
        ++i

        let data = {
          title: page.title,
          script: script
        }

        if (obj.worker) {
          // we send job to job queue (redis)
          // run job queue dashboard to see statistics
          // node node_modules/kue/bin/kue-dashboard -p 3050
          queue
            .create('article', data)
            .removeOnComplete(true)
            .attempts(3)
            .backoff({
              delay: 10 * 1000,
              type: 'exponential'
            })
            .save()
        } else {
          data.collection = col
          doPage.parse(data, function(err, res) {})
        }
      }
    })

    xml.on('error', function(message) {
      console.log('Parsing as ' + (encoding || 'auto') + ' failed: ' + message)
      db.close()
    })

    const done = function() {
      console.log('=================done!=================')
      col.count().then(count => {
        console.log(count + "  pages stores in db '" + obj.db + "'")
        db.close()
        callback()
      })
    }

    xml.on('end', function() {
      if (!queue) {
        done()
      } else {
        //let any remaining async writes complete
        console.log('--- just letting the queue finish-up...')
        setTimeout(function() {
          done()
        }, 20000) //20 seconds
      }
    })
  })
}

module.exports = main
