const config = require("../config")
const chalk = require('chalk')

const writeDb = async (arr, options) => {
  return new Promise(async (resolve) => {
    options.db.collection(config.collection).insertMany(arr, {
      ordered: false
    }, async (err) => {
      if (err) {
        console.log('   ' + chalk.red(err.message))
        if (err.writeErrors) {
          console.log('   ' + chalk.red(err.writeErrors[0].errmsg))
        }
      // collect insert errors...
      // tbd. skip duplicate key errors
      // do not insert if err.writeErrors[x].code = 11000
      // options.errCollection.insertMany(err.writeErrors,{ordered:false},()=>{})
      }
      resolve()
    // let count = await options.collection.count()
    // checkWriteSuccess(preCount,postCount,arr)
    // resolve(`${arr.length} docs inserted. total:${count}`)
    })
  })
}

module.exports = writeDb
