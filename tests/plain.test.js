let test = require('tape');
let db = require('./db');
let dumpster = require('../');

test('plaintext', function(t) {
  let dbName = 'plainwiki';
  let obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    plaintext: true,
    workers: 1,
    html: true,
    markdown: true,
  };
  db.drop(dbName, 'pages', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 7, '7 records');
        let doc = docs.find(d => d._id === 'Hello');
        t.ok(doc.plaintext.indexOf('hello this is wikitext') !== -1, 'got plaintext');
        t.notEqual(doc.markdown.indexOf('\n## The header\n'), -1, 'got markdown');
        t.notEqual(doc.html.indexOf('<span class="sentence">hello this is wikitext</span>'), -1, 'got html');


        let redirect = docs.find(d => d.title === 'Redirect page');
        t.notEqual(undefined, redirect, 'no redirect-page');
        t.equal(redirect.redirectTo.page, 'The Beatles', 'has redirect link');

        let disambig = docs.find(d => d.title === 'Disambiguation page');
        t.notEqual(undefined, disambig, 'no disambig-page');
        t.ok(disambig.sections.length > 1, 'rendering sections');


        t.end();
      });
    });
  });
});
