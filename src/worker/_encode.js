// mongo has some opinions about what characters are allowed as keys and ids.
//https://stackoverflow.com/questions/12397118/mongodb-dot-in-key-name/30254815#30254815

const encodeStr = function(str) {
  if (typeof str !== 'string') {
    str = ''
  }
  return str
    .replace(/\\/g, '\\\\')
    .replace(/^\$/, '\\u0024')
    .replace(/\./g, '\\u002e');
};

//tables & infoboxes & citations could potentially have unsafe keys
const encodeData = function(data) {
  data = data || {};
  //encode keys in infoboxes
  if (data.infoboxes && data.infoboxes.length > 0) {
    data.infoboxes.forEach(info => {
      let keys = Object.keys(info);
      keys.forEach(k => {
        if (k !== encodeStr(k)) {
          info[encodeStr(k)] = info[k];
          delete info[k];
        }
      });
    });
  }
  //encode keys in citations
  if (data.citations && data.citations.length > 0) {
    data.citations.forEach(obj => {
      let keys = Object.keys(obj);
      keys.forEach(k => {
        if (k !== encodeStr(k)) {
          obj[encodeStr(k)] = obj[k];
          delete obj[k];
        }
      });
    });
  }
  //cleanup table-keys
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach(o => {
      if (o.tables && o.tables.length > 0) {
        o.tables.forEach(table => {
          table.forEach(row => {
            let keys = Object.keys(row);
            keys.forEach(k => {
              if (k !== encodeStr(k)) {
                row[encodeStr(k)] = row[k];
                delete row[k];
              }
            });
          });
        });
      }
    });
  }
  return data;
};

module.exports = {
  encodeData: encodeData,
  encodeStr: encodeStr
}
