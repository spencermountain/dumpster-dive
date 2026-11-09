import React, { useEffect, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { useSnapshot } from 'valtio'
import Bar from './Bar.jsx'
import Menu from './Menu.jsx'
import { StatsLeft, StatsRight } from './Stats.jsx'
import { niceBytes } from './_lib.js'
import store from './store.js'

// download progress, when the file size is known
const percentOf = function (f) {
  if (!f.size) {
    return 0
  }
  return (f.bytes / f.size) * 100
}

// short names for pause reasons
const reasons = { writeQueue: 'queue' }

// 'paused: user, queue' for the footer, or ''
const pauseNote = function (workers) {
  const why = new Set()
  workers.forEach((w) => w.pauses.forEach((r) => why.add(reasons[r] || r)))
  if (why.size === 0) {
    return ''
  }
  return `  — paused: ${[...why].join(', ')}`
}

const barColor = function (f) {
  if (f.paused) {
    return 'yellow'
  }
  if (f.status === 'error') {
    return 'red'
  }
  return 'green'
}

const App = function ({ boss }) {
  const { exit } = useApp()
  const snap = useSnapshot(store)
  // a clock tick, so runtimes advance between state changes
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const paused = snap.workers.some((w) => w.pauses.includes('user'))
  const togglePause = () => {
    if (paused) {
      boss.resumeAll('user')
    } else {
      boss.pauseAll('user')
    }
  }

  // listening for input keeps the app alive; esc quits (ctrl-c handled by ink)
  useInput((input, key) => {
    if (key.escape) {
      exit()
    }
    // p is a shortcut for the first menu item
    if (input === 'p') {
      togglePause()
    }
  })

  // the choices at the bottom of the page
  const items = [
    {
      id: 'pause',
      label: paused ? '▶ Resume' : '⏸ Pause',
      description: 'take a break'
    },
    {
      id: 'end',
      label: snap.ending ? 'Ending…' : 'End early',
      description: 'keep what is done, and finish',
      disabled: snap.ending
    },
    { id: 'exit', label: 'Exit', description: 'quit now' }
  ]
  const onPick = (id) => {
    if (id === 'pause') {
      togglePause()
    } else if (id === 'end') {
      boss.endEarly()
    } else if (id === 'exit') {
      exit()
    }
  }

  const { totals, jobs, writeQueue } = snap
  let endNote = ''
  if (snap.finished) {
    endNote = snap.ending ? '  — ended early' : '  — finished'
  }
  return (
    <Box flexDirection="column" width={100}>
      {snap.files.map((f) => (
        <Bar
          key={f.index}
          title={`File #${f.index + 1}`}
          subtitle={niceBytes(f.size)}
          percent={percentOf(f)}
          color={barColor(f)}
          dim={f.status === 'pending'}
          left={<StatsLeft f={f} />}
          right={<StatsRight f={f} now={now} />}
        />
      ))}
      <Box flexDirection="column" marginX={2} paddingTop={2}>
        <Text>
          <Text color="green">{totals.complete.toLocaleString()}</Text> pages
          <Text dimColor>
            {'  '}
            {totals.skipped.toLocaleString()} skipped {'  '}
            {totals.errors} errors
          </Text>
        </Text>
        <Text>
          <Text dimColor>write queue: </Text>
          <Text color="blue">{writeQueue.queueLength}</Text>
        </Text>
      </Box>
      <Box flexDirection="column" marginX={2} marginTop={1}>
        <Menu items={items} onPick={onPick} />
        <Text dimColor>↑↓ to choose, enter to pick · p pauses, esc or ctrl-c quits</Text>
      </Box>
    </Box>
  )
}

export default App
