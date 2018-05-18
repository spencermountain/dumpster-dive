const chalk = require('chalk');
const openDb = require('../src/lib/open-db')
const niceNumber = require('../src/lib/fns').niceNumber;
const dbName = process.argv[2] || 'enwiki'

const showPage = async function(col) {
  // int = parseInt(int, 10)
  let docs = await col.aggregate(
    {
      $sample: {
        size: 1
      }
    }
  )
  console.log(docs)
  // let docs = await col.find({}, {
  //   skip: int,
  //   limit: 1
  // })
  // console.log(docs.toArray())
  // let doc = docs[0]
  // console.log(chalk.blue('\npage #' + niceNumber(int) + `:  -- ${chalk.green(chalk.underline(doc.title))} --`))
  // let sections = doc.sections || []
  // let str = '    ' + chalk.red(`${(doc.sections || []).length} sections`)
  // str += ' - ' + chalk.red(`${(doc.infoboxes || []).length} infoboxes`)
  // str += ' - ' + chalk.red(`${(doc.categories || []).length} categories`)
  // str += ' - ' + chalk.red(`${(doc.citations || []).length} citations`)
  // console.log(str, '\n')
  // sections.forEach((sec) => {
  //   let heading = '='.repeat(sec.depth + 2)
  //   console.log(chalk.grey('     ' + heading + ' ' + (sec.title || '(intro)') + ' ' + heading))
  //   //print first sentence
  //   if (sec.sentences && sec.sentences[0]) {
  //     let sen = sec.sentences[0].text || ''
  //     console.log(chalk.yellow(`         "${sen.slice(0, 170)}..."`))
  //   }
  // })
  console.log('\n\n\n')

}


//cool moves,
const main = async function() {
  let obj = await openDb({
    db: dbName
  })
  let count = await obj.col.count()
  console.log(chalk.blue('\n\n   ----------- ' + niceNumber(count) + ' pages total -----------\n'))
  await showPage(obj.col)
  // await showPage(obj.col, count / 5)
  await obj.client.close()
}
main()
