let test = require('tape')
var exec = require('shelljs').exec
let db = require('./db')

// this test actually writes to mongodb! ( in the tlg-wikipedia table)
test('test-real-smallwiki', function(t) {
  db.drop('smallwiki', 'wikipedia', () => {
    exec('./bin/wp2mongo.js ./tests/smallwiki-latest-pages-articles.xml.bz2')
    db.count('smallwiki', count => {
      t.equal(count, 1050, 'count-is-correct')
      db.drop('smallwiki', () => {
        t.end()
      })
    })
  })
})
