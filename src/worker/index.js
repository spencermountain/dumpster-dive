const sundayDriver = require('sunday-driver')
const parsePage = require('./01-parsePage')
const parseWiki = require('./02-parseWiki');
const writeDb = require('./03-write-db');

const doSection = async (options, chunkSize, workerNum) => {
  let pages = []
  let startByte = 0;
  if (workerNum !== 0) {
    startByte = (workerNum * chunkSize) //- 1000000 // start a megabyte earlier
  }
  let endByte = startByte + chunkSize //+ 3000000 // end 2 megabytes later so we don't lose pages cut by chunks

  let driver = {
    file: options.file,
    start: startByte,
    end: endByte,
    splitter: "</page>",
    each: async (xml, resume) => {
      let page = parsePage(xml)
      if (page !== null) {
        page = parseWiki(page, options)
        pages.push(page)
      }
      if (pages.length >= options.batch_size) {
        await writeDb(options, pages, workerNum)
        pages = []
      }
      resume()
    },
    atPercent: {
      5: () => {
        console.log(workerNum + ' 5%!')
      },
      25: () => {
        console.log(workerNum + ' 25%!')
      },
      50: () => {
        console.log(workerNum + ' 50%!')
      },
      75: () => {
        console.log(workerNum + ' 75%!')
      },
    }
  }
  let p = sundayDriver(driver)
  p.catch(console.log)
  p.then(async () => { //on done
    // insert the remaining pages
    if (pages.length > 0) {
      await writeDb(options, pages, workerNum)
    }
    process.send({
      type: "workerDone",
      pid: process.pid
    })
  })

  return process.pid
};

module.exports = {
  doSection: doSection
}
