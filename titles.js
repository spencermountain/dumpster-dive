const dumpster = require('./src');
// const drop = require('./src/lib/drop-db');

//144mb → 2.5 minutes = 57mb per worker per minute
// const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml';
const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml';
const dbName = path.match(/\/([a-z-]+)-latest-pages/)[1];

const options = {
  file: path,
  db: dbName,
  workers: 1,
  log: function(worker, fs) {
    // sort by freq
    const topk = function(arr) {
      let obj = {};
      arr.forEach(a => {
        obj[a] = obj[a] || 0;
        obj[a] += 1;
      });
      let res = Object.keys(obj).map(k => [k, obj[k]]);
      return res.sort((a, b) => {
        if (a[1] > b[1]) {
          return -1;
        }
        if (a[1] < b[1]) {
          return 1;
        }
        return 0;
      });
    };

    Object.keys(worker.titles).forEach(k => {
      let arr = topk(worker.titles[k] || []);
      fs.writeFileSync(`./results/${k}.json`, JSON.stringify(arr.slice(0, 70), null, 2));
    });
    console.log('\n----\n');
  },
  custom: function(doc, worker) {
    let result = doc.classify();
    result = result || {};
    let category = result.category;
    worker.results[category] = worker.results[category] || 0;
    worker.results[category] += 1;

    // get page titles per root
    if (result.root) {
      let m = doc.title().match(/\(.*\)/);
      if (m) {
        let title = m[0].replace(/[\(\)]/g, '');
        worker.titles[result.root] = worker.titles[result.root] || [];
        worker.titles[result.root].push(title);
      }
    }
  }
};

dumpster(options);
