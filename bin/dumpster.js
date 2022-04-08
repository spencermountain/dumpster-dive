#! /usr/bin/env node
let dumpster = require('../src');
let yargs = require('yargs');
let argv = yargs
  .usage('dumpster <xml filepath> [options]')
  .example('dumpster ./my/wikipedia-dump.xml --plaintext true --categories false')
  .describe('batch_size', 'how many articles to write to mongo at once [1000]')
  .describe('skip_disambig', 'avoid storing disambiguation pages [true]')
  .describe('skip_redirects', 'avoid storing redirect pages [true]')
  .describe('categories', 'include category data? [true]')
  .describe('citations', 'include references/citations? [true]')
  .describe('coordinates', 'include coordinate data? [true]')
  .describe('infoboxes', 'include infobox data? [true]')
  .describe('images', 'include image data? [true]')
  .describe('plaintext', 'include page plaintext? [false]')
  .describe('verbose', 'run in verbose mode [false]')
  .describe('verbose_skip', 'log skipped disambigs & redirects [false]')
  .describe('workers', 'run in verbose mode [CPUCount]')
  .describe('db_url', 'the location of the mongo database [false]')
  .describe('db', 'name of the database to store data [false]')
  .describe('collection', 'name of collection to store data [false]').argv;

const defaults = {
  batch_size: 500,
  skip_disambig: true,
  skip_redirects: true,
  categories: true,
  citations: true,
  coordinates: true,
  infoboxes: true,
  images: true,
  plaintext: false,
  verbose: false,
  verbose_skip: false
};
const toBool = {
  true: true,
  false: false
};

let file = argv['_'][0];
//set defaults to given arguments
let options = Object.assign({}, defaults);
Object.keys(options).forEach((k) => {
  if (argv.hasOwnProperty(k) && argv[k] !== undefined) {
    //coerce strings to booleans
    if (toBool.hasOwnProperty(argv[k])) {
      argv[k] = toBool[argv[k]];
    }
    options[k] = argv[k];
  }
});

//grab the wiki file
if (!file) {
  console.log('❌ please supply a filename to the wikipedia article dump');
  process.exit(1);
}
//try to make-up the language name for the db
if (!argv.db) {
  let db = 'wikipedia';
  if (file.match(/-(latest|\d{8})-pages-articles/)) {
    db = file.match(/([a-z]+)-(latest|\d{8})-pages-articles/) || [];
    db = db[1] || 'wikipedia';
  }
  options.db = db;
} else {
  options.db = argv.db;
}

options.db_url = argv.db_url;
options.collection = argv.collection;
options.file = file;

dumpster(options);
