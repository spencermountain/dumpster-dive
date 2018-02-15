const w2m = require('./src')
const drop = require('./tests/db').drop
const config = require('./config')

// const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml.bz2'
const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
// const path = './tests/smallwiki-latest-pages-articles.xml'
const dbName = path.match(/\/([a-z-]+)-latest-pages/)[1]

//delete all pages
drop(dbName, config.collection, () => {
  console.log('dropped existing pages from ' + dbName + ' - ' + config.collection + '\n\n')
  w2m({
    file: path,
    db: dbName,
    batch_size: 1000,
    plaintext: false
  })
})
