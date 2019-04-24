const openDb = require('./open-db');

// helper to delete all records in a database
const dropDb = async function(options) {
  const obj = await openDb(options);
  await obj.col.deleteMany({});
  console.log('dropped');
  const count = await obj.col.countDocuments();
  console.log('  - now ' + count + ' records - ');
};
module.exports = dropDb;
