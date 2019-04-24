const test = require('tape');
const db = require('./db');
const dumpster = require('../');

test('custom-made-tinywiki', function(t) {
  const dbName = 'tempwiki';
  const obj = {
    file: './tests/tinywiki-latest-pages-articles.xml',
    db: dbName,
    workers: 2,
    images: true
  };
  db.drop(dbName, 'pages', () => {
    dumpster(obj, () => {
      db.firstTen(dbName, docs => {
        t.equal(docs.length, 7, 'seven records');

        const hello = docs.find(d => d.title === 'Hello');
        t.equal(hello.categories.length, 0, 'no categories');
        t.equal(hello.images.length, 0, 'no image');
        t.equal(hello.title, 'Hello', 'has title');
        t.equal(hello.sections.length, 3, 'two sections');

        const toronto = docs.find(d => d.title === 'Toronto');
        t.equal(toronto.sections.length, 3, 'has 3 sections');
        t.equal(toronto.sections[0].paragraphs[0].sentences.length, 3, 'has sentences');
        t.equal(toronto.categories.length, 3, 'three categories');
        t.equal(toronto.images.length, 1, 'one image');
        // t.equal(toronto.infoboxes.length, 1, 'one infobox')

        const duplicate = docs.find(d => d.title === 'Duplicate title');
        t.equal(
          'this duplicate should be removed',
          duplicate.sections[0].paragraphs[0].sentences[0].text,
          'has first duplicate'
        );
        t.end();
      });
    });
  });
});
