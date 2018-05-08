const chalk = require('chalk')
const openDB = require('../lib/open-db')
const fns = require("../fns")
const config = require("../config")

//logger for current status of import
class Logger {
  constructor(options) {
    this.options = options
    this.wait = config.logInterval
    this.interval = null
  }
  start() {
    this.interval = setInterval(this.stat, this.wait)
  }
  stop() {
    clearInterval(this.interval)
  }
  open(cb) {
    openDB(this.options, cb)
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
  stat() {
    this.open((obj) => {
      this.count(obj, (count) => {
        if (count > 0) {
          this.lastPage(obj.col, count, (doc) => {
            count = fns.niceNumber(count)
            if (doc) {
              console.log(chalk.grey(' last page: ') + chalk.green('#' + count) + chalk.blue('  - "' + doc.title + '"     '))
            }
            obj.client.close()
          })
        }
      })
    })
  }
}

const hound = function(options) {
  return new Logger(options)
}
module.exports = hound
