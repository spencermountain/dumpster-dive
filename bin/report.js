const config = require('../config');
const chalk = require('chalk');
const niceNumber = require('../lib/fns').niceNumber;
const MongoClient = require('mongodb').MongoClient
const dbName = process.argv[2] || 'enwiki'

const open = function(_dbName, callback) {
  let url = 'mongodb://localhost:27017/' + _dbName
  MongoClient.connect(url, function(err, db) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    callback(db)
  })
}

const showPage = function(col, int) {
  col.find({}, {
    skip: int,
    limit: 1
  }).toArray(function(err, docs) {
    let doc = docs[0]
    console.log(chalk.blue('\npage #' + niceNumber(int) + `:  -- ${chalk.green(chalk.underline(doc.title))} --`))
    let sections = doc.sections || []
    let str = '    ' + chalk.red(`${(doc.sections || []).length} sections`)
    str += ' - ' + chalk.red(`${(doc.infoboxes || []).length} infoboxes`)
    str += ' - ' + chalk.red(`${(doc.categories || []).length} categories`)
    str += ' - ' + chalk.red(`${(doc.citations || []).length} citations`)
    console.log(str, '\n')
    sections.forEach((sec) => {
      let heading = '='.repeat(sec.depth + 2)
      console.log(chalk.grey('     ' + heading + ' ' + (sec.title || '(intro)') + ' ' + heading))
      //print first sentence
      if (sec.sentences && sec.sentences[0]) {
        let sen = sec.sentences[0].text || ''
        console.log(chalk.yellow(`         "${sen.slice(0, 170)}..."`))
      }
    })
    console.log('\n\n\n')
  })
}


open(dbName, (db) => {
  let col = db.collection(config.collection)
  col.count().then((count) => {
    console.log(chalk.blue('\n\n   ----------- ' + niceNumber(count) + ' pages total -----------\n'))
    let showPages = [1]
    showPages.push(Math.floor(count / 6))
    showPages.push(Math.floor(count / 5))
    showPages.push(Math.floor(count / 4))
    showPages.push(Math.floor(count / 3))
    showPages.push(Math.floor(count / 2))
    showPages.push(Math.floor(count / 1.5))
    let i = 0
    let repeat = setInterval(function() {
      if (!showPages[i]) {
        clearInterval(repeat)
        db.close()
        return
      }
      showPage(col, showPages[i])
      i += 1
    }, 2000)

  })
})
