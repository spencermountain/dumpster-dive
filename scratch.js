const dumpster = require('./src');
const drop = require('./src/lib/drop-db');

//144mb → 2.5 minutes = 57mb per worker per minute
const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml';
// const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
// const path = './tests/smallwiki-latest-pages-articles.xml'; //3s
// const path = './tests/tinywiki-latest-pages-articles.xml'; //2s
const dbName = path.match(/\/([a-z-]+)-latest-pages/)[1];

const options = {
  file: path,
  db: dbName
  // skip_redirects: false,
  // skip_disambig: false,
  // missing_templates: true,
  // custom: function(doc) {
  //   console.log('+++' + doc.title() + '+++');
  //   return {
  //     title: doc.title()
  //   };
  // }
  // batch_size: 1
  // workers: 2
};

//delete all pages
drop(options).then(() => {
  dumpster(options);
});
