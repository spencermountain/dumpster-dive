//stream a big wikipedia xml.bz2 file into mongodb
//node index.js afwiki-latest-pages-articles.xml.bz2
var fs = require('fs')
var XmlStream = require('xml-stream')
var wikipedia = require('wtf_wikipedia')
var MongoClient = require('mongodb').MongoClient
var bz2 = require('unbzip2-stream');

var file = process.argv[2]
if (!file) {
  console.log('please supply a filename to the wikipedia article dump')
  process.exit(1)
}
var lang = file.match(/([a-z][a-z])wiki-/) || []
lang = lang[1] || '-'

// Connect to mongo
var url = 'mongodb://localhost:27017/' + lang + '_wikipedia';
MongoClient.connect(url, function(err, db) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  var collection = db.collection('wikipedia');
  // Create a file stream and pass it to XmlStream
  var stream = fs.createReadStream(file).pipe(bz2());
  var xml = new XmlStream(stream);
  xml._preserveAll = true //keep newlines

  xml.on('endElement: page', function(page) {
    if (page.ns === '0') {
      var script = page.revision.text['$text'] || ''
      var data = wikipedia.parse(script)
      data.title = page.title
      console.log(data.title)
      collection.insert(data, function(e) {
        if (e) {
          console.log(e)
        }
      })
    }
  });

  xml.on('error', function(message) {
    console.log('Parsing as ' + (encoding || 'auto') + ' failed: ' + message);
    db.close();
  });

  xml.on('end', function() {
    console.log('=================done!========')
    setTimeout(function() { //let the remaining async writes finish up
      db.close();
    }, 20000)
  });

});
