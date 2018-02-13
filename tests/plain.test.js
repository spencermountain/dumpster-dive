let test = require('tape')
let db = require('./db')
let wp2mongo = require('../')

test('plaintext', function(t) {
  let obj = {
    file: './tests/tinywiki-latest-pages-articles.xml.bz2',
    db: 'plainwiki',
    plaintext: true
  }
  db.drop(obj.db, 'wikipedia', () => {
    wp2mongo(obj, () => {
      db.firstTen(obj.db, docs => {
        t.equal(docs.length, 7, '7 records')
        t.equal(docs[0].plaintext, 'hello this is wikitext\n\n', 'got plaintext')
        t.end()
      })
    })
  })
})
