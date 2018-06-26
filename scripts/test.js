const exec = require('shelljs').exec
const chalk = require('chalk')
const report = '\"node_modules/.bin/tap-dancer\" --color'
const tape = '\"node_modules/.bin/tape\"'

let tests = [
  'cli',
  'custom',
  'plain',
  'redirects',
]
tests.forEach((str) => {
  console.log(chalk.green(`running ${str} tests:`))
  let cmd = `${tape} "./tests/${str}.test.js" | ${report}`
  exec(cmd)
})
