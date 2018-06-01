const chalk = require('chalk');
const sundayDriver = require('sunday-driver');
// const sundayDriver = require('/Users/spencer/mountain/sunday-driver/src/index.js')
const parsePage = require('./01-parsePage');
const parseWiki = require('./02-parseWiki');
const writeDb = require('./03-write-db');
const jsonfn = require('jsonfn').JSONfn

const doSection = async (optionStr, workerCount, workerNum) => {
  let options = jsonfn.parse(optionStr)
  let pages = [];
  let percent = 100 / workerCount;
  let start = percent * workerNum;
  let end = start + percent;
  // console.log(`#${workerNum} -   ${start}% → ${end}%`)
  let driver = {
    file: options.file,
    start: `${start}%`,
    end: `${end}%`,
    splitter: '</page>',
    each: (xml, resume) => {
      //pull-out sections from this xml
      let page = parsePage(xml);
      if (page !== null) {
        //parse the page into json
        page = parseWiki(page, options);
        if (page !== null) {
          pages.push(page);
        }
      }
      if (pages.length >= options.batch_size) {
        writeDb(options, pages, workerNum).then(() => {
          pages = [];
          resume();
        });
      } else {
        resume();
      }
    },
    atPoint: {
      50: () => {
        console.log('');
        console.log(chalk.grey(`   (worker #${workerNum} is 50% done)`));
        console.log('');
      }
    }
  };
  let p = sundayDriver(driver);
  p.catch(console.log);
  p.then(async () => { //on done
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
