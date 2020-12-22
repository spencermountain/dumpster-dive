const namespace = 0

const shouldSkip = function (page) {
  //is it a different namespace?
  const wantNamespace = new RegExp('<ns>' + namespace + '</ns>')
  if (wantNamespace.test(page) === false) {
    return true
  }
  return false
}

//wikipedia xml → json
const parsePage = function (txt, worker) {
  //skip redirects, etc
  if (shouldSkip(txt) === true) {
    worker.ns += 1
    return null
  }
  const page = {
    title: null,
    pageID: null,
    wiki: '',
  }
  //get page title
  let m = txt.match(/<title>([\s\S]+?)<\/title>/)
  if (m !== null) {
    page.title = m[1]
  } else {
    console.log('--no title found--')
  }
  //get page id
  m = txt.match(/<id>([0-9]*?)<\/id>/)
  if (m !== null) {
    page.pageID = m[1]
  } else {
    console.log('--no page id--')
  }
  //get wiki text
  m = txt.match(/<text[^>]+xml:space="preserve"([\s\S]*?)<\/text>/)
  if (m !== null) {
    m[1] = m[1].replace(/^.*?>/, '')
    page.wiki = m[1]
  }
  return page
}
module.exports = parsePage
