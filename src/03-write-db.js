const config = require("../config")

const writeDb = async (arr, options) => {
  return new Promise(async (resolve) => {
    options.db.collection(config.collection).insertMany(arr, {
      ordered: false
    }, async () => {
      // if (err) {
      // collect insert errors...
      // tbd. skip duplicate key errors
      // do not insert if err.writeErrors[x].code = 11000
      // options.errCollection.insertMany(err.writeErrors,{ordered:false},()=>{})
      // }
      let count = await options.collection.count()
      // checkWriteSuccess(preCount,postCount,arr)
      resolve(`${arr.length} docs inserted. total:${count}`)
    })
  })
}

module.exports = writeDb
