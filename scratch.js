const dumpster = require('./src')
const drop = require('./tests/db').drop
const config = require('./config')
const stat = require('./lib/stat')

const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
// const path = '/Users/spencer/data/wikipedia/eswiki-latest-pages-articles.xml'
// const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml'
// const path = './tests/smallwiki-latest-pages-articles.xml'
// const path = './tests/tinywiki-latest-pages-articles.xml'
const dbName = path.match(/\/([a-z-]+)-latest-pages/)[1]

//delete all pages
drop(dbName, config.collection, () => {
  dumpster({
    file: path,
    db: dbName,
    batch_size: 1000,
    plaintext: true
  })
})
