let test = require('tape')
let db = require('./db')
let dumpster = require('../')

test('plaintext', function(t) {
  let dbName = 'plainwiki'
  let obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    plaintext: true,
    html: true,
    markdown: true,
  }
  db.drop(dbName, 'wikipedia', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 7, '7 records')
        t.equal(docs[0].plaintext, 'hello this is wikitext\n\nand some arbitrary text\n\n', 'got plaintext')
        t.notEqual(docs[0].markdown.indexOf('\n## The header\n'), -1, 'got markdown')
        t.notEqual(docs[0].html.indexOf('<span class="sentence">hello this is wikitext</span>'), -1, 'got html')
        t.end()
      })
    })
  })
})
