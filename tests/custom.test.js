let test = require('tape')
let db = require('./db')
let dumpster = require('../')

test('custom-made-tinywiki', function(t) {
  let dbName = 'tempwiki'
  let obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    images: true
  }
  db.drop(dbName, 'pages', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 7, 'seven records')

        let hello = docs.find(d => d.title === 'Hello')
        t.equal(hello.categories.length, 0, 'no categories')
        t.equal(hello.images.length, 0, 'no image')
        t.equal(hello.title, 'Hello', 'has title')
        t.equal(hello.sections.length, 3, 'two sections')

        let toronto = docs.find(d => d.title === 'Toronto')
        t.equal(toronto.sections.length, 3, 'has 3 sections')
        t.equal(toronto.sections[0].sentences.length, 3, 'has sentences')
        t.equal(toronto.categories.length, 3, 'three categories')
        t.equal(toronto.images.length, 1, 'one image')
        t.equal(toronto.infoboxes.length, 1, 'one infobox')

        let duplicate = docs.find(d => d.title === 'Duplicate title')
        t.equal("this duplicate should be removed", duplicate.sections[0].sentences[0].text, 'has first duplicate')
        t.end()
      })
    })
  })
})
