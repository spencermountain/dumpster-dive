#All the world's knowledge, in yer mongodb
put a crazy-ass 10Gb wikipedia dump quickly into mongo, without thinking, without loading it into memory, and without any intermediate files, grepping, or nonsense.


this library uses [xml-stream](https://github.com/assistunion/xml-stream) to navigate the large xml file, and [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia) to parse the article contents into pretty JSON.

Using these tools, you can get a queryable wikipedia on a laptop in an afternoon.

dependency node-expat requires node <= v0.10.33


## Load the Afrikaans wikipedia
The Afrikaans wikipedia (only 33 556 artikels) only takes a few minutes to download, and 10 mins to load into mongo on a macbook.

````bash
wget https://dumps.wikimedia.org/afwiki/latest/afwiki-latest-pages-articles.xml.bz2  #(38mb, couple minutes)

bunzip2 ./afwiki-latest-pages-articles.xml.bz2 #(180mb, couple seconds)

node index.js afwiki-latest-pages-articles.xml #(couple minutes)
````
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

the english wikipedia will work under the same process. The dl will take an afternoon, the unzipping a few minutes, and the loading/parsing a couple hours.