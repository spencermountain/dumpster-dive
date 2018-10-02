const chalk = require('chalk');
const sundayDriver = require('sunday-driver');
// const sundayDriver = require('/Users/spencer/mountain/sunday-driver/src/index.js')
const parsePage = require('./01-parsePage');
const parseWiki = require('./02-parseWiki');
const writeDb = require('./03-write-db');
const jsonfn = require('jsonfn').JSONfn;

const doSection = async (optionStr, workerCount, workerNum) => {
  let options = jsonfn.parse(optionStr);
  let pages = [];
  let percent = 100 / workerCount;
  let start = percent * workerNum;
  let end = start + percent;
  this.counts = {
    pages: 0,
    redirects: 0,
    ns: 0,
    disambig: 0,
  }
  this.logger = setInterval(() => {
    console.log(`${chalk.yellow('#' + workerNum)}: pages:${chalk.yellow(this.counts.pages)}, redir:${chalk.magenta(this.counts.redirects)} disamb:${chalk.magenta(this.counts.disambig)} ns:${chalk.magenta(this.counts.ns)}`)
  }, 2000)
  // console.log(`#${workerNum} -   ${start}% → ${end}%`)
  let driver = {
    file: options.file,
    start: `${start}%`,
    end: `${end}%`,
    splitter: '</page>',
    each: (xml, resume) => {
      //pull-out sections from this xml
      let page = parsePage(xml, this);
      if (page !== null) {
        if (options.verbose === true) {
          console.log('   #' + workerNum + '  - ' + page.title);
        }
        //parse the page into json
        page = parseWiki(page, options, this);
        if (page !== null) {
          pages.push(page);
        }
      }
      if (pages.length >= options.batch_size) {
        writeDb(options, pages, workerNum).then(() => {
          this.counts.pages += pages.length
          pages = [];
          resume();
        });
      } else {
        resume();
      }
    }
  // atPoint: {
  //   50: () => {
  //     console.log('');
  //     console.log(chalk.grey(`   (worker #${workerNum} is 50% done)`));
  //     console.log('');
  //   }
  // }
  };
  let p = sundayDriver(driver);
  p.catch((err) => {
    console.log(chalk.red('\n\n========== Worker error!  ====='));
    console.log('🚨       worker #' + workerNum + '           🚨');
    console.log(err);
    console.log('\n\n');
  });
  p.then(async () => { //on done
    clearInterval(this.logger)
    // insert the remaining pages
    if (pages.length > 0) {
      await writeDb(options, pages, workerNum);
    }
    console.log('\n');
    console.log(`    💪  worker #${workerNum} has finished 💪 `);
    process.send({
      type: 'workerDone',
      pid: process.pid
    });
  });
  return process.pid;
};

module.exports = {
  doSection: doSection
};
