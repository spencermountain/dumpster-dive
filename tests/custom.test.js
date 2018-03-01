let test = require('tape')
let db = require('./db')
let dumpster = require('../')
/*
//to update the bz2,
rm ./tests/tinywiki-latest-pages-articles.xml.bz2 && bzip2 -z ./tests/tinywiki-latest-pages-articles.xml
*/
test('custom-made-tinywiki', function(t) {
  let obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: 'tempwiki',
  }
  db.drop(obj.db, 'wikipedia', () => {
    dumpster(obj, () => {
      db.firstTen(obj.db, docs => {
        t.equal(docs.length, 7, 'seven records')

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

        let duplicate = docs.find(d => d.title === 'Duplicate title')
        t.equal("this duplicate should be removed", duplicate.sections[0].sentences[0].text, 'has first duplicate')
        t.end()
      })
    })
  })
})

// test('no-redirects', function(t) {
//   let obj = {
//     file: './tests/tinywiki-latest-pages-articles.xml',
//     db: 'tempwikiskip',
//     skip_redirects: true,
//     skip_disambig: true,
//   }
//   db.drop(obj.db, () => {
//     dumpster(obj, () => {
//       db.firstTen(obj.db, docs => {
//         t.equal(docs.length, 5, 'five records')
//
//         let redirect = docs.find(d => d.title === 'Redirect page')
//         t.equal(undefined, redirect, 'no redirect-page')
//
//         let disambig = docs.find(d => d.title === 'Disambiguation page')
//         t.equal(undefined, disambig, 'no disambig-page')
//
//         let toronto = docs.find(d => d.title === 'Toronto')
//         t.equal("Toronto", toronto._id, 'has _id')
//         t.equal("Toronto", toronto.title, 'has title')
//         t.end()
//       })
//     })
//   })
// })
