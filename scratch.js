const dumpster = require('./src');
const drop = require('./src/lib/drop-db');

//144mb → 2.5 minutes = 57mb per worker per minute
const path = '/Users/spencer/data/wikipedia/enwiki-latest-pages-articles.xml'
// const path = '/Users/spencer/data/wikipedia/simplewiki-latest-pages-articles.xml'
// const path = './tests/smallwiki-latest-pages-articles.xml'; //3s
// const path = './tests/tinywiki-latest-pages-articles.xml'; //2s
const dbName = path.match(/\/([a-z-]+)-latest-pages/)[1];

//db.pages.find({title:'Doppelgängers'})

let options = {
  file: path,
  db: dbName,
  skip_redirects: false,
  skip_disambig: false,
  missing_templates: true,
  custom: function(doc) {
    let words = doc.plaintext().split(/[ \n]/g).length
    let sections = doc.sections().map((s) => s.title)
    let templates = doc.templates().map((s) => s.template)
    let references = doc.references()
    let coordinates = doc.coordinates(0)
    let images = doc.images()
    let infobox = doc.infoboxes()
    let tables = doc.tables()
    let categories = doc.categories()
    return {
      title: doc.title(),
      is_redirect: doc.isRedirect(),
      is_disambig: doc.isDisambiguation(),
      words: words,
      section_count: sections.length,
      template_count: templates.length,
      category_count: categories.length,
      reference_count: references.length,
      infobox_count: infobox.length,
      image_count: images.length,
      tables_count: tables.length,
      coordinates: coordinates,
      sections: sections,
      templates: templates,
      categories: categories,
    };
  },
// batch_size: 1
// workers: 2
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
