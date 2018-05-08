const chalk = require('chalk')
const openDB = require('../lib/open-db')
const mongoConfig = {
  ordered: false
}

const writeDb = (options, pages) => {
  return new Promise(async (resolve) => {
    let obj = await openDB(options)
    obj.col.insertMany(pages, mongoConfig, (err) => {
      if (err) {
        console.log('   ' + chalk.red(err.message))
        if (err.writeErrors) {
          console.log('   ' + chalk.red(err.writeErrors[0].errmsg))
        }
      }
      obj.client.close()
      //keep going .. 🙉
      resolve()
    })
  })
}

module.exports = writeDb
