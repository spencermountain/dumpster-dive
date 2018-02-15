const config = require("../config")
//
checkWriteSuccess = (preCount, postCount, arr) => {
  if (preCount + arr.length === postCount) {
    console.log(`all parsed documents are inserted succesfully. total docs: ${postCount}`)
  } else {
    // feature sugg.:
    // let's check the difference betw arr & result obj.
    // make a note of the ones that couldn't be inserted eg:
    // db.collection("insert_errors").insertMany diff
    // and maybe add an option to cli to only try the ones
    // that have failed.
    console.log("some documents couldn't be inserted.")
  }
  // return results for further goat yoga.
  return
}

const writeDb = async (arr, options) => {
  return new Promise(async (resolve) => {
    //let preCount = await options.collection.count()
    //arrr = [{arr:arr}]
    options.db.collection(config.collection).insertMany(arr, {
      ordered: false
    }, async (err) => {
      if (err) {
        // collect insert errors...
        // tbd. skip duplicate key errors
        //    do not insert if err.writeErrors[x].code = 11000
        // options.errCollection.insertMany(err.writeErrors,{ordered:false},()=>{})
      }

      let count = await options.collection.count()
      // checkWriteSuccess(preCount,postCount,arr)

      resolve(`${arr.length} docs inserted. total:${count}`)
    })
  })
}

module.exports = writeDb
