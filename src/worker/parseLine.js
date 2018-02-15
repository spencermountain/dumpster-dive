const parseWiki = require('./parseWiki');
require('./_polyfill');

//reached the end
const donePage = function(state, options, insertToDb) {
  parseWiki(state.body, options, (pageObj) => {
    doArticleTimeCounter += Date.now() - doArticleTime
    if (pageObj) {
      pages.push(pageObj);
    }
    if (pageCount % options.batch_size === 0) {
      insertToDb();
    }
  })
}

const startPage = function() {
  return {
    body: '',
    title: null,
    inside: false,
    skip: false
  }
}

//
const parseLine = function(line, state, options, insertToDb) {
  //we're currently grabbing wikitext..
  if (state.inside === true) {
    //finish it!
    if (line.includes("</text>")) {
      state.body = line.replace(/<\/text>.*/, '')
      donePage(state, insertToDb)
      state = startPage()
      return state
    }
    //keep going!
    state.body += line
    return state
  }
  //we're waiting for the page to end..
  if (state.skip === true) {
    if (line.includes("</page>")) {
      state = startPage()
      return state
    }
    //keep ignoring..
    return state
  }
  //maybe we can skip it?
  if (line.includes("<ns>")) {
    if (line.includes("<ns>0</ns>") === false) {
      state.skip = true;
    }
    return state
  }
  //skip redirects too..
  if (line.includes('<redirect title="')) {
    state.skip = true;
    return state
  }
  //not skipping, and waiting for <text> to start..
  if (line.includes('<text xml:space="preserve">')) {
    state.inside = true
    return state.body = line.replace(/.*<text xml:space="preserve">/, '')
  }
  return state
}
module.exports = parseLine
