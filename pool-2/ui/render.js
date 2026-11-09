import { createElement } from 'react'
import { render } from 'ink'
import Home from './Home.jsx'
import Summary from './Summary.jsx'
import store, { sync } from './store.js'

// mount the ui around a running boss; returns a handle to close it
const start = function (boss) {
  const app = render(createElement(Home, { boss }), {
    alternateScreen: false,
    exitOnCtrlC: true
  })
  let closed = false
  // clear wipes the live page from the terminal instead of leaving its last frame
  const close = ({ clear = false } = {}) => {
    if (closed) {
      return
    }
    closed = true
    if (clear) {
      app.clear()
    }
    app.unmount()
    app.cleanup()
  }
  // resolves when the user quits, or close() is called
  const done = app.waitUntilExit()
  return { close, done }
}

// print the final report once and give the terminal back
const showSummary = async function (state, opts, extra) {
  const app = render(createElement(Summary, { state, opts, extra }), {
    alternateScreen: false,
    exitOnCtrlC: false,
    patchConsole: false
  })
  // let the frame reach the terminal before unmounting
  await new Promise((resolve) => setImmediate(resolve))
  app.unmount()
  app.cleanup()
}

export { store, sync, showSummary }
export default start
