//stream a big wikipedia xml file into mongodb
//node index.js afwiki-latest-pages-articles.xml

var fs        = require('fs')
var path      = require('path')
var XmlStream = require('xml-stream')
var wikipedia= require("wtf_wikipedia")
var MongoClient = require('mongodb').MongoClient

// Create a file stream and pass it to XmlStream
var file= process.argv[2] || 'afwiki-latest-pages-articles.xml';
var stream = fs.createReadStream(path.join(__dirname, file));
var lang=file.match(/^../)||'--'

// Connect to mongo
var url = 'mongodb://localhost:27017/'+lang+'_wikipedia';
MongoClient.connect(url, function(err, db) {
  if(err){console.log(err)}
  var collection = db.collection('wikipedia');

  var xml = new XmlStream(stream);
  xml._preserveAll=true //keep newlines
  // xml.preserve('text');

  xml.on('endElement: page', function(page) {
    if(page.ns=="0"){
      var script=page.revision.text["$text"] || ''
      var data=wikipedia.parse(script)
      data.title=page.title
      console.log(data.title)
      collection.insert(data, function(err, r){
        if(err){console.log(err)}
      })
    }
  });

  xml.on('error', function(message) {
    console.log('Parsing as ' + (encoding || 'auto') + ' failed: ' + message);
    db.close();
  });

  xml.on('end', function(message) {
    console.log('=================done========')
    setTimeout(function(){ //let the remaining async writes finish up
      db.close();
    },3000)
  });

});