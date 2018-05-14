const chalk = require('chalk')
const openDB = require('../lib/open-db')
const mongoConfig = {
  ordered: false
}

const writeDb = (options, pages) => {
  return new Promise(async (resolve) => {

    let obj = await openDB(options)

    return obj.col.insertMany(pages, mongoConfig, (err) => {
      if (err) {
        console.log('   ' + chalk.red(err.message))
        if (err.writeErrors && err.writeErrors[0]) {
          let e = err.writeErrors[0]
          //suppress duplicate key errors
          if (e && e.code === 11000) {
            console.log(chalk.red(`    - already have "${err.writeErrors[0]._id}"`))
          } else {
            console.log('   ' + chalk.red(e.errmsg))
          }
        }
      }
      obj.client.close()
      //keep going .. 🙉
      resolve()
    })
  })
}

module.exports = writeDb
