// mongo has some opinions about what characters are allowed as keys and ids.
//https://stackoverflow.com/questions/12397118/mongodb-dot-in-key-name/30254815#30254815
const encodeStr = function(str) {
  if (typeof str !== 'string') {
    str = '';
  }
  return str
    .replace(/\\/g, '\\\\')
    .replace(/^\$/, '\\u0024')
    .replace(/\./g, '\\u002e');
};

module.exports = {
  encodeStr: encodeStr
};
