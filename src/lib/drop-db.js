const openDb = require('./open-db')

//
const dropDb = async function(options) {
  let obj = await openDb(options)
  obj.col.deleteMany({}).then(() => {
    console.log('dropped')
    obj.col.count().then((count) => {
      console.log('  - now ' + count + ' records - ')
    })
  })
  return
}
module.exports = dropDb
