const config = require('../config');
const chalk = require('chalk');

//birds-eye-view of what pages are in mongo
const stat = function(db) {
  db.collection(config.collection).count((err, count) => {
    console.log(` - - pages: ${count}`)
  })
}
module.exports = stat
