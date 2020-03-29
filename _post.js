let data = {
  CreativeWork: require('./results/sections/CreativeWork'),
  Event: require('./results/sections/Event'),
  Organization: require('./results/sections/Organization'),
  Person: require('./results/sections/Person'),
  Place: require('./results/sections/Place'),
  Thing: require('./results/sections/Thing')
};

let already = {};
Object.keys(data).forEach(cat => {
  data[cat] = data[cat].map(a => a[0].toLowerCase());
  data[cat].forEach(str => {
    already[str] = already[str] || 0;
    already[str] += 1;
  });
});

Object.keys(data).forEach(cat => {
  let obj = {};
  console.log(data[cat].length);
  data[cat] = data[cat].filter(str => {
    if (already[str] > 1) {
      // console.log(str, already[str]);
      return false;
    }
    return true;
  });
  // console.log(cat, data[cat].length);
  data[cat].forEach(str => {
    obj[str] = cat;
  });
  data[cat] = obj;
});

console.log(JSON.stringify(data.Thing, null, 2));
// console.log(already);
