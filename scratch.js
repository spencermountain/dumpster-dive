const w2m = require('./src')
// const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml.bz2'
const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
const dbName = 'tmpwiki'

w2m({
  file: path,
  db: dbName,
  batch_size: 30,
  plaintext: true
})
