const log4js = require('log4js');
log4js.configure({
  appenders: {
    cheese: {
      type: 'file',
      filename: '/tmp/worker.logs'
    }
  },
  categories: {
    default: {
      appenders: ['cheese'],
      level: 'info'
    }
  }
});

module.exports = log4js.getLogger('cheese');
