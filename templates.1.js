const dumpster = require('./src')

// const path = '/Users/spencer/data/wikipedia/enwiktionary-latest-pages-articles.xml'
// const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml';
// const path = '/Users/spencer/data/wikipedia/enwikivoyage-latest-pages-articles.xml'
// const path = '/Users/spencer/data/wikipedia/enwikinews-latest-pages-articles.xml'
const path = '/Users/spencer/data/wikipedia/twinpeaks_pages_current.xml'
// let all = {}

const topk = function (arr) {}

const options = {
  file: path,
  workers: 1,
  log: function (worker, fs) {
    console.log(`\n--${worker.counts.pages}--\n`)
    let obj = worker.templates
    let res = Object.keys(obj).map((k) => [k, obj[k]])
    let arr = res.sort((a, b) => (a[1] > b[1] ? -1 : 0))
    console.log(arr)
    fs.writeFileSync(`./results/missing-templates.json`, JSON.stringify(arr, null, 2))
  },
  custom: function (doc, worker) {
    console.log(doc)
    // worker.templates = combine(doc._missing_templates, worker.templates)
    Object.keys(doc._missing_templates).forEach((k) => {
      worker.templates[k] = worker.templates[k] || 0
      worker.templates[k] += doc._missing_templates[k]
    })
  },
}

dumpster(options, () => {
  console.log('done!')
})
