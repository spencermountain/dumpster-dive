var kue = require('kue')
var queue = kue.createQueue({
  prefix: 'q',
  redis: {
    port: 6379,
    host: 'localhost'
    //auth: ''
  }
});

module.exports = queue;
