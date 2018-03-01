#! /usr/bin/env node
let program = require('commander')
let main = require('../src/index')

let parseArgs = function() {
  program
    .usage('node index.js enwiki-latest-pages-articles.xml.bz2 [options]')
    .option('--batch_size <n>', 'Number of pages inserted to Mongo at once. (default=1000)', parseInt)
    .option('--skip_first <n>', 'ignore the first n pages, and do not pause while handling those pages', parseInt)
    .option('-plain, --plaintext', 'if true, store plaintext wikipedia articles instead of raw json data')
    .option('--skip_redirects', 'if true, skips-over pages that are redirects')
    .option('--skip_disambig', 'if true, skips-over disambiguation pages')
    .option('--verbose', 'print each article title to the console')
    .parse(process.argv)

  //grab the wiki file
  let file = process.argv[2]
  if (!file) {
    console.log('please supply a filename to the wikipedia article dump')
    process.exit(1)
  }
  //try to make-up the language name for the db
  let db = 'wikipedia'
  if (file.match(/-latest-pages-articles/)) {
    db = file.match(/([a-z]+)-latest/) || []
    db = db[1] || 'wikipedia'
  }

  //assign defaults
  program = Object.assign({
    batch_size: 1000,
    plaintext: false,
    skip_disambig: true,
    skip_redirects: true,
    skip_first: 0,
    verbose: false,
  }, program)

  return {
    file: file,
    db: db,
    batch_size: program.batch_size,
    plaintext: program.plaintext,
    skip_disambig: program.skip_disambig,
    skip_redirects: program.skip_redirects,
    skip_first: program.skip_first,
    verbose: program.verbose,
  }
}
let obj = parseArgs()
main(obj)
