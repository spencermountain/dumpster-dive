const w2m = require('./src')
const drop = require('./tests/db').drop
// const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml.bz2'
const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
const dbName = 'tmpwiki'

//delete all pages

drop(dbName, 'queue', () => {
  console.log('dropped existing pages\n')
  w2m({
    file: path,
    db: dbName,
  })
})
