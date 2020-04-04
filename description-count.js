const dumpster = require('./src')

const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml'

const options = {
  file: path,
  workers: 1,
  log: function (worker) {
    console.log(worker.results)
  },
  custom: function (doc, worker) {
    if (doc.isDisambiguation() || doc.isRedirect()) {
      return
    }
    let res = doc.template('short description')
    let found = false
    if (res) {
      found = true
      console.log(res)
    }
    worker.results[found] = worker.results[found] || 0
    worker.results[found] += 1
  },
}

dumpster(options)
