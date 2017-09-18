let test = require('tape')
var exec = require('shelljs').exec
let wptomongo = require('../')

// this test actually writes to mongodb! ( in the tlg-wikipedia table)

test('test-small-wiki', function(t) {
  exec('./index.js ./ltgwiki-latest-pages-articles.xml.bz2')
  t.ok(true, 'done')
  t.end()
})
