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
    let res = doc.classify()
    if (res.score > 0 && res.score <= 0.6) {
      console.log(doc.title())
      let reasons = []
      Object.keys(res.detail).forEach((k) => {
        res.detail[k].forEach((o) => {
          if (o.cat !== res.cat) {
            reasons.push([o.cat, o.reason])
          }
        })
      })
      console.log(reasons)
      console.log('\n')
    }
  },
}

dumpster(options)
