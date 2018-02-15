const drop = require('./tests/db').drop
const config = require('./config')
const dbName = 'tmpwiki'

//delete all pages
drop(dbName, config.collection, () => {
  console.log('dropped existing pages from ' + dbName + ' - ' + config.collection)
})
