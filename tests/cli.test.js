let test = require('tape')
var exec = require('shelljs').exec
let db = require('./db')

// this test actually writes to mongodb! ( in the tlg-wikipedia table)
test('test-real-smallwiki', function(t) {
  db.drop('smallwiki', 'wikipedia', () => {
    exec('./bin/dumpster.js ./tests/smallwiki-latest-pages-articles.xml')
    db.count('smallwiki', count => {
      //1050 pages in ns=0, 195 redirects
      t.equal(count, 855, 'count-is-correct')
      db.drop('smallwiki', 'wikipedia', () => {
        t.end()
      })
    })
  })
})
