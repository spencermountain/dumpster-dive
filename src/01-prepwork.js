const chalk = require('chalk');
const fs = require('fs');
const config = require('../config');
const cpuCount = require('os').cpus().length;

const guardIO = function(options) {
  if (!options.file || !fs.existsSync(options.file)) {
    console.log(chalk.red('\n  --can\'t find file:  "' + chalk.blue(options.file) + '" ---'));
    console.log(
      chalk.grey('     please supply a filename for the wikipedia article dump in xml format')
    );
    process.exit(1);
  }
  if (/\.bz2$/.test(options.file)) {
    console.log(chalk.red('\n    --- hello, please unzip this file first  ---'));
    console.log(chalk.grey('     ($ bzip2 -d ' + options.file + ' )'));
    process.exit(1);
  }
};

//a little housework first, for our config object
const prepWork = function(options) {
  options = options || {};
  options = Object.assign({}, options);

  //guess an appropriate dbName
  if (!options.db) {
    options.db = options.file.match(/\/([a-z-]+)-latest-pages/)[1] || 'wikipedia';
  }
  //make sure the file looks good..
  guardIO(options);

  //set a few defaults
  options.dbName = options.db;
  options.workers = options.workers || cpuCount;
  options.batch_size = options.batch_size || config.batch_size;
  if (options.encode === undefined) {
    options.encode = true;
  }
  //some top-level logging
  process.on('unhandledRejection', function(up) {
    console.log(chalk.red('--uncaught top-process error--'));
    return console.log(up);
  });
  return options;
};
module.exports = prepWork;
