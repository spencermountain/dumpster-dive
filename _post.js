let data = {
  CreativeWork: require('./results/categories/CreativeWork'),
  Event: require('./results/categories/Event'),
  Organism: require('./results/categories/Organism'),
  Organization: require('./results/categories/Organization'),
  Person: require('./results/categories/Person'),
  Place: require('./results/categories/Place'),
  Thing: require('./results/categories/Thing')
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
  data[cat] = data[cat].filter(str => {
    if (already[str] > 1) {
      return false;
    }
    return true;
  });
  data[cat].forEach(str => {
    obj[str] = cat;
  });
  data[cat] = obj;
});

console.log(JSON.stringify(data.Thing, null, 2));
