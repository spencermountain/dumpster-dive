const chalk = require('chalk')
const fs = require("fs")
//
const prepare = function(options) {
  //guess an appropriate dbName
  if (!options.db) {
    options.db = options.file.match(/\/([a-z-]+)-latest-pages/)[1] || 'wikipedia'
  }
  // options.dbName = options.db
  if (!fs.existsSync(options.file)) {
    console.log(chalk.red('\n  --can\'t find file:  "' + chalk.blue(options.file) + '" ---'));
    console.log(chalk.grey('     please supply a filename for the wikipedia article dump in xml format'));
    process.exit(1);
  }
  if (/\.bz2$/.test(options.file)) {
    console.log(chalk.red('\n    --- hello, please unzip this file first  ---'));
    console.log(chalk.grey('     ($ bzip2 -d ' + options.file + ' )'))
    process.exit(1);
  }
  //some top-level logging  
  process.on('unhandledRejection', function(up) {
    console.log(chalk.red('--uncaught process error--'))
    return console.log(up);
  });
  return options
}
module.exports = prepare
