
//
checkWriteSuccess = (preCount,postCount,arr) => {
  if (preCount+arr.length === postCount){
    console.log(`all parsed documents are inserted succesfully. total docs: ${postCount}`)
  }
  else {
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

const writeDb = async (arr, options, callback) => {
  return new Promise( async (resolve,reject)=>{
    // let preCount = await options.collection.count()
    options.collection.insertMany( arr, { ordered: true }, async (err, result) => {
        if (err) {
            // collect insert errors...
            // tbd. skip duplicate key errors
            //    do not insert if err.writeErrors[x].code = 11000
            // options.errCollection.insertMany(err.writeErrors,{ordered:false},()=>{})
          }

        // let postCount = await options.collection.count()
        // checkWriteSuccess(preCount,postCount,arr)
        resolve()
      })
    })
  }

module.exports = writeDb
