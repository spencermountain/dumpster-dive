
//function to pretty-print when finished..
const done = async function(collection) {
  console.log('\n=================done!=================\n');
  console.log(await collection.count() + "  pages stored in db '" + options.db + "'");
  return
};
module.exports = done
