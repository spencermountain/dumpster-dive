get a crazy ass 10Gb wikipedia xml dump straight into mongo, without thinking, without loading it into memory, and without any intermediate files, grepping, or nonsense.


this library uses [xml-stream](https://github.com/assistunion/xml-stream) to navigate the large xml file, and [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia) to parse the wikimedia markup into pretty JSON.

Using these tools, you can get a queryable wikipedia on a laptop in an afternoon.

dependency node-expat requires node <= v0.10.33


## Flow for Afrikaans wikipedia (only 33 556 artikels)
The Afrikaans wikipedia only takes a few minutes to download, and 10 mins to load into mongo on a macbook.

````bash
wget https://dumps.wikimedia.org/afwiki/latest/afwiki-latest-pages-articles.xml.bz2
````
(38mb, couple minutes)

````bash
bunzip2 ./afwiki-latest-pages-articles.xml.bz2
````
(180mb, couple seconds)

````bash
node index.js afwiki-latest-pages-articles.xml
````
(couple minutes)

yahoo!

to view your data now,
````bash
mongo
use af_wikipedia

//shows a random page
db.wikipedia.find().skip(200).limit(2)

//count the redirects (~4,000 in afrikaans)
db.wikipedia.count({type:"redirect"})

//find a specific page
db.wikipedia.findOne({title:"Toronto"}).categories
````

the english wikipedia will work under the same process, just a little slower.