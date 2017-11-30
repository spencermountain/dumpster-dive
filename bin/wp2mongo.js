#! /usr/bin/env node
let program = require('commander')
let main = require('../src/index')

let parseArgs = function() {
  program
    .usage('node index.js enwiki-latest-pages-articles.xml.bz2 [options]')
    .option('-w, --worker [worker]', 'Use worker (redis required)')
    .option('-plain, --plaintext [plaintext]', 'if true, store plaintext wikipedia articles')
    .option('-skip_redirects [skip_redirects]', 'if true, skips-over pages that are redirects')
    .option('-skip_disambig [skip_disambig]', 'if true, skips-over disambiguation pages')
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
  return {
    file: file,
    db: db,
    worker: program.worker,
    plaintext: program.plaintext,
    skip_disambig: program.skip_disambig,
    skip_redirects: program.skip_redirects,
  }
}

let obj = parseArgs()
main(obj)
