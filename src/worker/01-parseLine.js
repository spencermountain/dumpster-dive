require('./_polyfill');
// const chalk = require('chalk')

const startPage = function() {
  return {
    script: '',
    title: null,
    inside: false,
    skip: false
  }
}

//brittle-but-fast interpreting of the xml file
const parseLine = function(line, state, donePage) {
  //we're currently grabbing wikitext..
  if (state.inside === true) {
    //finish it!
    if (line.includes("</text>")) {
      state.script += line.replace(/<\/text>.*/, '')
      donePage(state)
      return startPage()
    }
    //keep going!
    state.script += '\n' + line
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
    // console.log(chalk.green(' skipping redirect: ' + state.title))
    return state
  }
  //grab this title, sorta it's handy
  if (line.includes('<title>')) {
    let m = line.match(/<title>(.*)<\/title>/)
    if (m && m[1]) {
      state.title = m[1]
    }
    return state
  }
  //not skipping, and waiting for <text> to start..
  if (line.includes('<text xml:space="preserve">')) {
    state.inside = true
    state.script = line.replace(/.*<text xml:space="preserve">/, '')
    return state
  }
  return state
}
module.exports = parseLine
