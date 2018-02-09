const w2m = require('./src')

// w2m({
//   // file: './tests/tinywiki-latest-pages-articles.xml.bz2',
//   file: './tests/smallwiki-latest-pages-articles.xml.bz2',
//   db: 'enwiki3'
// })

w2m({
  file: './tests/tinywiki-latest-pages-articles.xml.bz2',
  db: 'tempwiki',
})
