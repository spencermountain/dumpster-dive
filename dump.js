const drop = require('./tests/db').drop
const dbName = 'tmpwiki'

//delete all pages
drop(dbName, 'queue', () => {
  console.log('dropped existing pages\n')
})
