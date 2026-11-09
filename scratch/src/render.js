import { createElement } from 'react'
import { render } from 'ink'
import Home from './Home.jsx'
import store from './store.js'

// mount the ui; returns a handle the host app uses to close it
const start = function () {
  const app = render(createElement(Home), {
    alternateScreen: false,
    exitOnCtrlC: true
  })
  const close = () => {
    app.unmount()
    app.cleanup()
  }
  // resolves when the user quits, or close() is called
  const done = app.waitUntilExit()
  return { close, done }
}

export { store }
export default start
