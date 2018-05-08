const config = require("../config")
const chalk = require('chalk')
const openDB = require('../lib/open-db')
const mongoConfig = {
  ordered: false
}

const writeDb = (arr, options) => {
  return new Promise(async (resolve) => {
    let obj = await openDB(options)
    obj.db.collection(config.collection).insertMany(arr, mongoConfig, (err) => {
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
