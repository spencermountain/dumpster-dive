const w2m = require('./src')

// const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml.bz2'
const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
// const path = './tests/tinywiki-latest-pages-articles.xml.bz2'
w2m({
  file: path,
  db: 'enpwiki',
})
