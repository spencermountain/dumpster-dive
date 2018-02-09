
//
const writeDb = function(arr, collection, callback) {
  collection.insertMany(
    arr,
    {
      ordered: false
    }, function(err, result) {
      if (err) {
        console.log(err)
      } else {
        console.log(" - -  +" + result.result.n);
      }
      callback()
    }
  )
  return
}
module.exports = writeDb
