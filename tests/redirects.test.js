var test = require('tape');
var db = require('./db');
var dumpster = require('../');

test('no-redirects', function(t) {
  var dbName = 'tempwikiskip';
  var obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    workers: 1,
    skip_redirects: true,
    skip_disambig: true,
  };
  db.drop(dbName, 'pages', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 5, 'five records');

        let redirect = docs.find(d => d.title === 'Redirect page');
        t.equal(undefined, redirect, 'no redirect-page');

        let disambig = docs.find(d => d.title === 'Disambiguation page');
        t.equal(undefined, disambig, 'no disambig-page');

        let toronto = docs.find(d => d.title === 'Toronto');
        t.equal('Toronto', toronto._id, 'has _id');
        t.equal('Toronto', toronto.title, 'has title');
        t.end();
      });
    });
  });
});
