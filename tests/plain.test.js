let test = require('tape')
let db = require('./db')
let dumpster = require('../')

test('plaintext', function(t) {
  let dbName = 'plainwiki'
  let obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    plaintext: true
  }
  db.drop(dbName, 'wikipedia', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 7, '7 records')
        t.equal(docs[0].plaintext, 'hello this is wikitext\n\n', 'got plaintext')
        t.end()
      })
    })
  })
})
