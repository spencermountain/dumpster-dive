<div align="center">
	<h3>dumpster-dive</h3>
  <a href="https://www.codacy.com/app/spencerkelly86/dumpster-dive">
    <img src="https://api.codacy.com/project/badge/grade/6fad3c588d3d4c97ab8a9abf9f2a5a01" />
  </a>
  <a href="https://npmjs.org/package/dumpster-dive">
    <img src="https://img.shields.io/npm/v/dumpster-dive.svg?style=flat-square" />
  </a>
  <div>wikipedia dump parser</div>
  <sub>
    by
    <a href="http://spencermounta.in/">Spencer Kelly</a>, <a href="https://github.com/devrim">Devrim Yasar</a>,
		 and
    <a href="https://github.com/spencermountain/wtf_wikipedia/graphs/contributors">
      others
    </a>
  </sub>
</div>
<p></p>

<div align="center">
  gets a wikipedia <a href="https://dumps.wikimedia.org">xml dump</a> into mongo,
  <div>so you can mess-around with it</div>

  <h2 align="center">💂 Yup</h2>
  <div><sup>do it on your laptop</sup></div>
</div>

![image](https://user-images.githubusercontent.com/399657/39391259-b57ca9e0-4a6e-11e8-8b33-2064e5fc187e.png)
dumpster-dive is a quick **nodejs** one-liner that puts a **highly-queryable** wikipedia on your laptop in a nice afternoon.

It uses [worker-nodes](https://github.com/allegro/node-worker-nodes) to parse many pages in parallel, and [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia) to turn ***wikiscript*** into whatever json format you'd like.

```bash
npm install -g dumpster-dive
```
### 😎 API
```js
var dumpster = require('dumpster-dive')
dumpster({ file:'./enwiki-latest-pages-articles.xml', db:'enwiki'}, callback)
```

### Command-Line:
```bash
dumpster /path/to/my-wikipedia-article-dump.xml --citations=false --html=true
```

then check out the articles in mongo:
````bash
$ mongo        #enter the mongo shell
use enwiki     #grab the database

db.wikipedia.find({title:"Toronto"})[0].categories
#[ "Former colonial capitals in Canada",
#  "Populated places established in 1793" ...]
db.wikipedia.count()
# 124,999...
````

# Steps:

### 1️⃣ 💪 you can do this.
you can do this.
just a few Gb. you can do this.

### 2️⃣ get ready
Install [nodejs](https://nodejs.org/en/), [mongodb](https://docs.mongodb.com/manual/installation/)

```bash
# start mongo
mongod --config /mypath/to/mongod.conf
# install this script
npm install -g dumpster-dive
# (that gives you the global command `dumpster`)
```

### 3️⃣ download a wikipedia
The Afrikaans wikipedia (around 47,000 artikels) only takes a few minutes to download, and 5 mins to load into mongo on a macbook:
```bash
# dowload an xml dump (38mb, couple minutes)
wget https://dumps.wikimedia.org/afwiki/latest/afwiki-latest-pages-articles.xml.bz2
```
the english/german ones are bigger. Use whichever xml dump you'd like. The [download page](https://dumps.wikimedia.org) is weird, but you'll want the most-common dump format, without historical diffs, or images, which is `${LANG}wiki-latest-pages-articles.xml.bz2 `

### 4️⃣ unzip it
i know, this sucks. but it makes the parser so much faster. On a macbook, unzipping en-wikipedia takes an hour or so. Eat some lunch.

### 5️⃣ OK, start it off
```bash
#load it into mongo (10-15 minutes)
dumpster ./afwiki-latest-pages-articles.xml
```
### 6️⃣ take a bath
just put some [epsom salts](https://www.youtube.com/watch?v=QSlIHCu2Smw) in there, it feels great.

The en-wiki dump should take a few hours. Maybe 8. Should be done before dinner.

The console will update you every couple seconds to let you know where it's at.

### 7️⃣ done.
go check-out the data! to view your data in the mongo console:
````javascript
$ mongo
use afwiki //your db name

//show a random page
db.wikipedia.find().skip(200).limit(2)

//find a specific page
db.wikipedia.findOne({title:"Toronto"}).categories
````

### Same for the English wikipedia:
the english wikipedia will work under the same process, but
the download will take an afternoon, and the loading/parsing a couple hours. The en wikipedia dump is a 13 GB (for [enwiki-20170901-pages-articles.xml.bz2](https://dumps.wikimedia.org/enwiki/20170901/enwiki-20170901-pages-articles.xml.bz2)), and becomes a pretty legit mongo collection uncompressed. It's something like 51GB, but mongo can do it 💪.

### Options:
dumpster follows all the conventions of [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia), and you can pass-in any fields for it to include in it's json.
* **human-readable plaintext** ***--plaintext***
```js
dumpster({file:'./myfile.xml.bz2', db: 'enwiki', plaintext:true, categories:false})
/*
[{
  _id:'Toronto',
  title:'Toronto',
  plaintext:'Toronto is the most populous city in Canada and the provincial capital...'
}]
*/
```

* **disambiguation pages /  redirects** ***--skip_disambig***, ***--skip_redirects***
by default, dumpster skips entries in the dump that aren't full-on articles, you can
```js
let obj = {
	file: './path/enwiki-latest-pages-articles.xml.bz2',
	db: 'enwiki',
	skip_redirects: false,
	skip_disambig: false
}
dumpster(obj, () => console.log('done!') )
```

* **reducing file-size:**
you can tell wtf_wikipedia what you want it to parse, and which data you don't need:
```bash
dumpster ./my-wiki-dump.xml --infoboxes=false --citations=false --categories=false --links=false
```

## how it works:
this library uses:
* [line-by-line](https://www.npmjs.com/package/line-by-line) to stream the gnarly xml file
* [wtf_wikipedia](https://github.com/spencermountain/wtf_wikipedia) to brute-parse the article wikiscript contents into JSON.

## Addendum:
### \_ids
since wikimedia makes all pages have globally unique titles, we also use them for the mongo `_id` fields.
The benefit is that if it crashes half-way through, or if you want to run it again, running this script repeatedly will not multiply your data. We do a 'upsert' on the record.

### encoding special characters
mongo has some opinions on special-characters in some of its data. It is weird, but we're using this [standard(ish)](https://stackoverflow.com/a/30254815/168877) form of encoding them:
```
\  -->  \\
$  -->  \u0024
.  -->  \u002e
```
### Non-wikipedias
This library should also work on other wikis with standard xml dumps from [MediaWiki](https://www.mediawiki.org/wiki/MediaWiki). I haven't tested them, but the wtf_wikipedia supports all sorts of non-standard wiktionary/wikivoyage templates, and if you can get a bz-compressed xml dump from your wiki, this should work fine. Open an issue if you find something weird.

### PRs welcome!
This is an important project, come [help us out](./contributing.md).

MIT
