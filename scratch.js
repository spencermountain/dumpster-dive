const w2m = require('./src')
// const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml.bz2'
// const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
const path = './tests/smallwiki-latest-pages-articles.xml'
const dbName = path.match(/\/([a-z-]+)-latest-pages/)[1]
w2m({
  file: path,
  db: dbName,
  batch_size: 1000,
  plaintext: false
})
