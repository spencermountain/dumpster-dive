import { createElement } from 'react'
import { render } from 'ink'
import Home from './Home.jsx'
import store, { sync } from './store.js'

// mount the ui around a running boss; returns a handle to close it
const start = function (boss) {
  const app = render(createElement(Home, { boss }), {
    alternateScreen: false,
    exitOnCtrlC: true
  })
  let closed = false
  const close = () => {
    if (closed) {
      return
    }
    closed = true
    app.unmount()
    app.cleanup()
  }
  // resolves when the user quits, or close() is called
  const done = app.waitUntilExit()
  return { close, done }
}

export { store, sync }
export default start
