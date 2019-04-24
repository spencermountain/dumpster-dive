const test = require('tape');
const db = require('./db');
const dumpster = require('../');

test('no-redirects', function(t) {
  const dbName = 'tempwikiskip';
  const obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    workers: 1,
    skip_redirects: true,
    skip_disambig: true
  };
  db.drop(dbName, 'pages', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 5, 'five records');

        const redirect = docs.find(d => d.title === 'Redirect page');
        t.equal(undefined, redirect, 'no redirect-page');

        const disambig = docs.find(d => d.title === 'Disambiguation page');
        t.equal(undefined, disambig, 'no disambig-page');

        const toronto = docs.find(d => d.title === 'Toronto');
        t.equal('Toronto', toronto._id, 'has _id');
        t.equal('Toronto', toronto.title, 'has title');
        t.end();
      });
    });
  });
});
