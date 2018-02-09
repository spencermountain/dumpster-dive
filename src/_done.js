
//function to pretty-print when finished..
const done = function(options, callback) {
  console.log('\n=================done!=================\n');
  options.collection.count().then(count => {
    console.log(count + "  pages stored in db '" + options.db + "'");
    options.database.close();
    callback()
  });
};
module.exports = done
