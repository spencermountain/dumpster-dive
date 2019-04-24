const exec = require('shelljs').exec;
const chalk = require('chalk');
const report = '"node_modules/.bin/tap-spec" --color';
const tape = '"node_modules/.bin/tape"';

const tests = ['cli', 'custom', 'plain', 'redirects'];
tests.forEach(str => {
  console.log(chalk.green(`running ${str} tests:`));
  const cmd = `${tape} "./tests/${str}.test.js" | ${report}`;
  exec(cmd);
});
