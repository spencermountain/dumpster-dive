// mongo has some opinions about what characters are allowed as keys and ids.
//https://stackoverflow.com/questions/12397118/mongodb-dot-in-key-name/30254815#30254815
const specialChar = /[\\\.$]/;

const isObject = function(x) {
  return (typeof x === 'object') && (x !== null);
};

const encodeStr = function(str) {
  if (typeof str !== 'string') {
    str = '';
  }
  return str
    .replace(/\\/g, '\\\\')
    .replace(/^\$/, '\\u0024')
    .replace(/\./g, '\\u002e');
};

const encodeObj = function( obj = {} ) {
  let keys = Object.keys(obj);
  for(let i = 0; i < keys.length; i += 1) {
    if (specialChar.test(keys[i]) === true) {
      let str = encodeStr(keys[i]);
      if (str !== keys[i]) {
        obj[str] = obj[keys[i]];
        delete obj[keys[i]];
      }
    }
  }
  return obj;
};

//tables & infoboxes & citations could potentially have unsafe keys
const encodeData = function(data) {
  data = data || {};
  //cleanup forbidden object key names in mongo
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach(s => {
      //encode keys in templates
      if (s.templates) {
        s.templates = s.templates.map(tmpl => {
          tmpl = encodeObj(tmpl);
          //try encoding these, too
          if (tmpl.data && isObject(tmpl.data)) {
            tmpl.data = encodeObj(tmpl.data);
          }
          return tmpl;
        });
      }
      //infoboxes have their stuff here
      if (s.infoboxes) {
        s.infoboxes = s.infoboxes.map(info => {
          info = encodeObj(info);
          return info;
        });
      }
      //encode keys in tables
      if (s.tables && s.tables.length > 0) {
        s.tables = s.tables.map(table => {
          return table.map((row) => encodeObj(row));
        });
      }
    });
  }
  return data;
};

module.exports = {
  encodeData: encodeData,
  encodeStr: encodeStr
};
