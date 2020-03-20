const fs = require('fs');
let lines = fs
  .readFileSync('/Users/spencer/mountain/dumpster/parentheses.tsv')
  .toString()
  .split('\n');

const topk = function(arr) {
  let obj = {};
  arr.forEach(a => {
    obj[a] = obj[a] || 0;
    obj[a] += 1;
  });
  let res = Object.keys(obj).map(k => [k, obj[k]]);
  return res.sort((a, b) => (a[1] > b[1] ? -1 : 0));
};

let arr = topk(lines);
arr.forEach(a => {
  console.log(a[0] + '\t' + a[1]);
});
// console.log(JSON.stringify(arr, null, 2));
