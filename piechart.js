const dumpster = require('./src');

const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml';
// const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml';

const options = {
  file: path,
  workers: 1,
  log: function(worker, fs) {
    // log percent
    const percentOf = function(some, all) {
      let num = (some / all) * 100;
      num = Math.round(num * 100) / 100;
      return num;
    };
    let nulls = worker.results[null];
    let total = worker.counts.pages;
    console.log(worker.results);
    console.log(worker.counts);
    //     console.log(`\n--
    // Pages: ${total.toLocaleString()}
    //     null: ${percentOf(nulls, total)}%
    //     People: ${percentOf(worker.results.Person, total)}%
    //     Place: ${percentOf(worker.results.Place, total)}%
    //     Organization: ${percentOf(worker.results.Organization, total)}%
    //     CreativeWork: ${percentOf(worker.results.CreativeWork, total)}%
    //     Event: ${percentOf(worker.results.Event, total)}%
    //     Thing: ${percentOf(worker.results.Thing, total)}%
    // --\n`);
  },
  custom: function(doc, worker) {
    if (doc.isDisambiguation() || doc.isRedirect()) {
      return;
    }
    let result = doc.classify();
    result = result || {};
    let category = result.root || null;
    worker.results[category] = worker.results[category] || 0;
    worker.results[category] += 1;
  }
};

dumpster(options);
