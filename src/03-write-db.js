
//
checkWriteSuccess = (preCount,postCount,arr) => {
  if (preCount+arr.length === postCount){
    console.log("all parsed documents are inserted succesfully.")
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
  let preCount = await options.collection.count()
  options.collection.insertMany( arr, { ordered: false }, async (err, result) => {
      if (err) {
          // collect insert errors...
          options.errCollection.insertMany(err.writeErrors,{ordered:false},()=>{})
        }

      let postCount = await options.collection.count()

      checkWriteSuccess(preCount,postCount,arr)

      callback()
    }
  )
  return
}
module.exports = writeDb
