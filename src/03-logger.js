const chalk = require('chalk')
const openDB = require('./lib/open-db')
const fns = require("./lib/fns")
const config = require("../config")

//logger for current status of import
class Logger {
  constructor(options) {
    this.options = options
    this.wait = config.logInterval
    this.interval = null
  }
  start() {
    this.interval = setInterval(() => {
      this.stat()
    }, this.wait)
  }
  stop() {
    clearInterval(this.interval)
  }
  open(cb) {
    openDB(this.options.db, cb)
  }
  //# of records entered in db
  count(obj, cb) {
    obj.col.count().then(cb)
  }
  //get the most recent article written
  lastPage(obj, count, cb) {
    obj.col.find({}, {
      skip: count - 1,
      limit: 1
    }).toArray(function(err, docs) {
      if (!docs || !docs[0]) {
        cb(null)
      } else {
        cb(docs[0])
      }
    })
  }
  //log some output
  async stat() {
    let obj = await openDB(this.options)
    this.count(obj, (count) => {
      if (count === 0) {
        obj.client.close()
        return
      }
      this.lastPage(obj, count, (doc) => {
        count = fns.niceNumber(count)
        if (doc) {
          console.log(chalk.grey(' last page: ') + chalk.green('#' + count) + chalk.blue('  - "' + doc.title + '"     '))
        }
        obj.client.close()
      })
    })
  }
}

const hound = function(options) {
  return new Logger(options)
}
module.exports = hound
