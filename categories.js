const dumpster = require('./src');

const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml';
// const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml';

const options = {
  file: path,
  workers: 1,
  log: function(worker, fs) {
    let roots = Object.keys(worker.categories);
    roots.forEach(root => {
      let obj = worker.categories[root];
      let keys = Object.keys(obj);
      keys = keys.sort((a, b) => {
        if (obj[a] > obj[b]) {
          return -1;
        } else if (obj[a] < obj[b]) {
          return 1;
        }
        return 0;
      });
      let total = worker.counts.pages || 1;
      let arr = keys.map(k => [k, (obj[k] / total) * 100]);
      fs.writeFileSync(
        `./results/categories/${root}.json`,
        JSON.stringify(arr.slice(0, 200), null, 2)
      );
    });
    console.log(`\n--${worker.counts.pages}--\n`);
  },
  custom: function(doc, worker) {
    let result = doc.classify();
    result = result || {};
    // get page titles per root
    if (result.root) {
      worker.categories[result.root] = worker.categories[result.root] || [];
      let templates = doc.categories().filter(s => s);
      templates.forEach(s => {
        let title = s.toLowerCase();
        worker.categories[result.root][title] = worker.categories[result.root][title] || 0;
        worker.categories[result.root][title] += 1;
      });
    }
  }
};

dumpster(options);
