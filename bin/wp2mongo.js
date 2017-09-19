#! /usr/bin/env node
let program = require('commander')
let main = require('../src/index')

let parseArgs = function() {
  program
    .usage('node index.js afwiki-latest-pages-articles.xml.bz2 [options]')
    .option('-w, --worker [worker]', 'Use worker (redis required)')
    .option('-plain, --plaintext [plaintext]', 'if true, store plaintext wikipedia articles')
    .parse(process.argv)

  //grab the wiki file
  let file = process.argv[2]
  if (!file) {
    console.log('please supply a filename to the wikipedia article dump')
    process.exit(1)
  }
  //try to make-up the language name for the db
  let lang = 'wikipedia'
  if (file.match(/-latest-pages-articles/)) {
    lang = file.match(/([a-z]+)-latest/) || []
    lang = lang[1] || 'wikipedia'
  }
  console.log(program)
  return {
    file: file,
    lang: lang,
    worker: program.worker
  }
}

let obj = parseArgs()
main(obj)
