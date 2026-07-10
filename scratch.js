import dumpster from './src/index.js';

const path = '/Users/spencer/data/wikipedias/afwiki-latest-pages-articles.xml';

const options = {
  file: path,
};

//delete all pages
drop(options).then(() => {
  dumpster(options);
});
