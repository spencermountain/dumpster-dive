let kue = require('kue')

let queue = kue.createQueue({
  prefix: 'q',
  jobEvents: false,
  redis: {
    port: 6379,
    host: 'localhost'
    //auth: ''
  }
})

module.exports = queue
