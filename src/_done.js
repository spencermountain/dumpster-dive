
//function to pretty-print when finished..
const done = function(options, db) {
  console.log('=================done!=================');
  options.collection.count().then(count => {
    console.log(count + "  pages stored in db '" + options.db + "'");
    db.close();
  });
};
module.exports = done
