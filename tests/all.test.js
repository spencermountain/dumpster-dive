let test = require('tape')
var exec = require('shelljs').exec
const MongoClient = require('mongodb').MongoClient
let db = require('./db')
let wp2mongo = require('../')

// this test actually writes to mongodb! ( in the tlg-wikipedia table)
test('test-real-smallwiki', function(t) {
  console.time('test')
  db.drop('smallwiki', () => {
    exec('./bin/wp2mongo.js ./tests/smallwiki-latest-pages-articles.xml.bz2')
    db.count('smallwiki', count => {
      t.equal(count, 1050, 'count-is-correct')
      db.drop('smallwiki', () => {
        console.timeEnd('test')
        t.end()
      })
    })
  })
})

/*
//to update the bz2,
rm ./tests/tinywiki-latest-pages-articles.xml.bz2 && bzip2 -z ./tests/tinywiki-latest-pages-articles.xml
*/
test('custom-made-tinywiki', function(t) {
  let obj = { file: './tests/tinywiki-latest-pages-articles.xml.bz2', db: 'tempwiki' }
  db.drop(obj.db, () => {
    wp2mongo(obj, () => {
      db.firstTwo(obj.db, docs => {
        t.equal(docs.length, 2, 'two records')

        let hello = docs.find(d => d.title === 'Hello')
        t.equal(hello.categories.length, 0, 'no categories')
        t.equal(hello.images.length, 0, 'no image')
        t.equal(hello.infoboxes.length, 0, 'no infobox')
        t.equal(hello.sections.length, 2, 'two sections')

        let toronto = docs.find(d => d.title === 'Toronto')
        t.equal(toronto.sections.length, 3, 'three infobox')
        t.equal(toronto.categories.length, 3, 'three categories')
        t.equal(toronto.images.length, 1, 'one image')
        t.equal(toronto.infoboxes.length, 1, 'one infobox')
        t.end()
      })
    })
  })
})
