const chalk = require('chalk')
const openDB = require('./lib/open-db')
const fns = require("./lib/fns")
const config = require("../config")

//logger for current status of import
class Logger {
  constructor(options) {
    this.options = options
    this.wait = config.logInterval
    this.please_stop = false
  }
  open(cb) {
    openDB(this.options.db, cb)
  }
  triggerNext() {
    setTimeout(() => {
      this.stat()
    }, this.wait)
  }
  start() {
    this.triggerNext()
  }
  stop() {
    this.please_stop = true
  }
  //# of records entered in db
  count(obj) {
    return obj.col.count()
  }
  //get the most recent article written
  lastPage(obj) {
    return obj.col.find({}).sort({
      $natural: -1
    }).limit(1).toArray()
  }
  //log some output
  async stat() {
    console.time('stat')
    let obj = await openDB(this.options)
    let count = await this.count(obj)
    let page = await this.lastPage(obj)
    if (page && page[0]) {
      page = page[0]
      count = fns.niceNumber(count)
      console.log(chalk.grey(' last page: ') + chalk.green('#' + count) + chalk.blue('  - "' + page.title + '"     '))
    }
    await obj.client.close()
    console.timeEnd('stat')
    //fire the next one!
    if (!this.please_stop) {
      this.triggerNext()
    }
  }
}

const hound = function(options) {
  return new Logger(options)
}
module.exports = hound
