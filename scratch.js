const dumpster = require('./src');
const drop = require('./src/lib/drop-db');

//144mb → 2.5 minutes = 57mb per worker per minute
// const path = '/home/spencer/mountain/dumpster-dive/tests/tinywiki-latest-pages-articles.xml';
const path = '/media/spencer/07d11766-2ce6-4f8a-8ec0-a3d144a3d4cd/big_data/wikipedia/eswiki-latest-pages-articles.xml';
// const path = './tests/smallwiki-latest-pages-articles.xml'; //3s
// const path = './tests/tinywiki-latest-pages-articles.xml'; //2s
const dbName = path.match(/\/([a-z-]+)-latest-pages/)[1];
let options = {
  file: path,
  db: dbName,
  // markdown: true,
  // html: true,
  // latex: true,
  // templates: false,
  // verbose: true,
  // verbose_skip: true,
  // batch_size: 1
  skip_redirects: true,
  skip_disambig: true,
// workers: 1
// custom: function(doc) {
//   return {
//     // _id: doc.title(),
//     foo: 'bar',
//   // categories: doc.categories(),
//   };
// }
};


// #1  - Pous Adrianus I
// #2  - Beenvis
// #2  - Makriel
// #1  - SK Koeban Krasnodar
// #3  - Vleitjagra
// #4  - Indiese gelowe


//delete all pages
drop(options).then(() => {
  dumpster(options);
});

// const fs = require('fs');
// let str = fs.readFileSync(path).toString()
// let str = `
// <text xml:space="preserve">
// this duplicate should stay
// from here too
// </text>`
// console.log(str.match(/<text xml:space="preserve">([\s\S]*?)<\/text>/))


//      half-               6021472
// Euston Road            - 5888070
//Turquoise-browed motmot - 9030127
//Holyoke, Massachusetts  - 9030314
//Jacobabad District     -  2765854
//Tubize                 -  2833911
//Ribes, Ardèche         -  2911022
//Saint-Germain-l'Aiguill - 3490581
//Adolphe-Marie Hardy     - 5958564
//White Hart Lane railway - 4146036
//List of cities in Somal-  7925458
//Computer data storage  -  8852258
// end           -         12042945

// 604084071
// worker #0 : 0→154021017
// worker #1 : 150021017→304042034
// worker #2 : 301042034→455063051
// worker #3 : 452063051→606084068
