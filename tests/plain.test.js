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
  db.drop(dbName, 'pages', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 7, '7 records')
        let doc = docs.find(d => d._id === "Hello")
        t.equal(doc.plaintext, 'hello this is wikitext\n\nand some arbitrary text\n\n', 'got plaintext')
        t.notEqual(doc.markdown.indexOf('\n## The header\n'), -1, 'got markdown')
        t.notEqual(doc.html.indexOf('<span class="sentence">hello this is wikitext</span>'), -1, 'got html')
        t.end()
      })
    })
  })
})
