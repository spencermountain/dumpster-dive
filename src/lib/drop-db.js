const openDb = require('./open-db')

//
const dropDb = async function(options) {
  let obj = await openDb(options)
  await obj.col.deleteMany({})
  // await obj.col.drop()
  console.log('dropped')
  let count = await obj.col.countDocuments()
  console.log('  - now ' + count + ' records - ')
}
module.exports = dropDb
