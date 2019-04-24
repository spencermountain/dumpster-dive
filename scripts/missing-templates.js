//first, run dumpster with {} piped to a text file
// npm run watch > ./tmp.txt
const sundayDriver = require('sunday-driver');

let templates = {};

let obj = {
  file: './tmp.txt',
  splitter: '\n',
  each: (line, resume) => {
    if (line[0] === ':') {
      templates[line] = templates[line] || 0;
      templates[line] += 1;
    }
    resume();
  }
};

let p = sundayDriver(obj);
p.then(() => {
  let keys = Object.keys(templates);
  keys = keys.sort((a, b) => {
    if (templates[a] > templates[b]) {
      return -1;
    }
    return 1;
  });
  let show = keys.slice(0, 1000);
  show.forEach(key => {
    let k = key.replace('\n', '');
    k = k.replace('::', '');
    k = k.replace(/^ +/, '');
    k = k.replace(/ /g, '_');
    let link = `* [${k}](https://en.wikipedia.org/wiki/Template:${k})`;
    console.log(link + '\t    -   ' + templates[key]);
  });
});
