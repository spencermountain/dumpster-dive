const test = require('tape');
const db = require('./db');
const dumpster = require('../');

test('plaintext', function (t) {
  const dbName = 'plainwiki';
  const obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    plaintext: true,
    workers: 1
  };
  db.drop(dbName, 'pages', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, (docs) => {
        t.equal(docs.length, 7, '7 records');
        const doc = docs.find((d) => d._id === 'Hello');
        t.ok(doc.plaintext.indexOf('hello this is wikitext') !== -1, 'got plaintext');

        const redirect = docs.find((d) => d.title === 'Redirect page');
        t.notEqual(undefined, redirect, 'no redirect-page');
        t.equal(redirect.redirectTo.page, 'The Beatles', 'has redirect link');

        const disambig = docs.find((d) => d.title === 'Disambiguation page');
        t.notEqual(undefined, disambig, 'no disambig-page');
        t.ok(disambig.sections.length > 1, 'rendering sections');

        t.end();
      });
    });
  });
});
