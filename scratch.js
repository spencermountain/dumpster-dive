import dumpster from './src/index.js'

// tiny wiki, ~600kb download - good for kicking the tires
let stats = await dumpster({
  lang: 'srn',
  dir: '/Users/spencer/data/wikipedias',
  plugin: (batch) => {
    batch.forEach((article) => console.log(article.title))
  },
})
console.error(stats)
