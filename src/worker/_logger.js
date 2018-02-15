const log4js = require('log4js');

module.exports = function() {
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
  return log4js.getLogger('cheese');
}
