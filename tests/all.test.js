let test = require('tape')
var exec = require('shelljs').exec
const MongoClient = require('mongodb').MongoClient
let db = require('./db')
let wp2mongo = require('../')

// this test actually writes to mongodb! ( in the tlg-wikipedia table)
// test('test-small-wiki', function(t) {
//   db.drop('smallwiki', () => {
//     exec('./bin/wp2mongo.js ./tests/smallwiki-latest-pages-articles.xml.bz2')
//     db.count('smallwiki', count => {
//       t.equal(count, 1047, 'count-is-correct')
//       db.drop('smallwiki', () => {
//         t.end()
//       })
//     })
//   })
// })

/*
rm ./tests/tinywiki-latest-pages-articles.xml.bz2
bzip2 -z ./tests/tinywiki-latest-pages-articles.xml
*/
test('manually-made-tinywiki', function(t) {
  let obj = { file: './tests/tinywiki-latest-pages-articles.xml.bz2', lang: 'tempwiki' }
  db.drop(obj.lang, () => {
    wp2mongo(obj, () => {
      db.count(obj.lang, count => {
        t.ok(true, 'done')
        t.equal(count, 2, 'two records')
        t.end()
      })
    })
  })
})
