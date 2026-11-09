import React from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { useSnapshot } from 'valtio'
import Bar from './Bar.jsx'
import VBar from './VBar.jsx'
import store from './store.js'

const App = function () {
  const { exit } = useApp()
  const snap = useSnapshot(store)

  // listening for input keeps the app alive; esc quits (ctrl-c handled by ink)
  useInput((input, key) => {
    if (key.escape) {
      exit()
    }
  })

  // pad labels so the bars line up

  return (
    <Box flexDirection="row">
      <Box flexDirection="column" width={100}>
        {snap.workers.map((w, i) => (
          <Bar key={i} label={w.label} status={w.status} percent={w.percent} />
        ))}
        <Text dimColor>press esc or ctrl-c to quit</Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        <VBar value={snap.backlog} max={snap.max} />
      </Box>
    </Box>
  )
}

export default App
