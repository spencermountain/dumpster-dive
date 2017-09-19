let test = require('tape')
var exec = require('shelljs').exec
const MongoClient = require('mongodb').MongoClient
let db = require('./db')
let wp2mongo = require('../')

// this test actually writes to mongodb! ( in the tlg-wikipedia table)
// test('test-real-smallwiki', function(t) {
//   db.drop('smallwiki', () => {
//     exec('./bin/wp2mongo.js ./tests/smallwiki-latest-pages-articles.xml.bz2')
//     db.count('smallwiki', count => {
//       t.equal(count, 1047, 'count-is-correct')
//       // db.drop('smallwiki', () => {
//       t.end()
//       // })
//     })
//   })
// })

/*
//to update the bz2,
rm ./tests/tinywiki-latest-pages-articles.xml.bz2 && bzip2 -z ./tests/tinywiki-latest-pages-articles.xml
*/
test('custom-made-tinywiki', function(t) {
  let obj = { file: './tests/tinywiki-latest-pages-articles.xml.bz2', db: 'tempwiki' }
  // db.drop(obj.lang, () => {
  wp2mongo(obj, () => {
    db.first(2, obj.lang, docs => {
      console.log(docs)
      t.equal(docs.length, 2, 'two records')

      let hello = docs.find(d => d._id === 'Hello')
      t.equal(hello.categories.length, 0, 'no categories')
      t.equal(hello.images.length, 0, 'no image')
      t.equal(hello.infoboxes.length, 0, 'no infobox')
      t.equal(hello.sections.length, 1, 'one infobox')

      let toronto = docs.find(d => d._id === 'Toronto')
      t.equal(toronto.sections.length, 3, 'three infobox')
      t.equal(toronto.categories.length, 3, 'three categories')
      t.equal(toronto.images.length, 1, 'one image')
      t.equal(toronto.infoboxes.length, 1, 'one infobox')
      t.end()
    })
  })
  // })
})
