const dumpster = require('./src');

const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml';
// const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml';

const options = {
  file: path,
  workers: 1,
  log: function (worker, fs) {
    // log percent
    // const percentOf = function (some, all) {
    //   let num = (some / all) * 100;
    //   num = Math.round(num * 100) / 100;
    //   return num;
    // };
    // let nulls = worker.results[null];
    // let total = worker.counts.pages;
    console.log(worker.results);
    // console.log(worker.counts);
  },
  custom: function (doc, worker) {
    if (doc.isDisambiguation() || doc.isRedirect()) {
      return;
    }
    let res = doc.nsfw();
    if (res.safe_for_work === false) {
      console.log(doc.title());
      // console.log(res.detail);
      console.log('');
    }
    worker.results[res.safe_for_work] = worker.results[res.safe_for_work] || 0;
    worker.results[res.safe_for_work] += 1;
  }
};

dumpster(options);
