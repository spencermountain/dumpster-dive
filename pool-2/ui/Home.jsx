import React, { useEffect, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { useSnapshot } from 'valtio'
import Bar from './Bar.jsx'
import { StatsLeft, StatsRight } from './Stats.jsx'
import store from './store.js'

// 'frwiki-2026-10-01-p13159990p17639014.xml.bz2' → 'p13159990p17639014'
const shortName = function (file) {
  return file.match(/-(p\d+p\d+)\./)?.[1] || file
}

// download progress, when the file size is known
const percentOf = function (w) {
  if (!w.size) {
    return 0
  }
  return (w.bytes / w.size) * 100
}

// short names for pause reasons
const reasons = { writeQueue: 'queue' }

const statusOf = function (w) {
  if (w.paused) {
    const why = w.pauses.map((r) => reasons[r] || r).join(',')
    return `paused: ${why}`
  }
  return w.status
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

  // listening for input keeps the app alive; esc quits (ctrl-c handled by ink)
  useInput((input, key) => {
    if (key.escape) {
      exit()
    }
    // p toggles a user pause on every worker
    if (input === 'p') {
      const paused = boss.workers.some((w) => w.pauses.includes('user'))
      if (paused) {
        boss.resumeAll('user')
      } else {
        boss.pauseAll('user')
      }
    }
  })

  const { totals, jobs, writeQueue } = snap
  return (
    <Box flexDirection="column" width={100}>
      {snap.workers.map((w) => (
        <Bar
          key={w.index}
          label={w.job ? shortName(w.job.file) : '—'}
          status={statusOf(w)}
          percent={percentOf(w)}
          color={w.paused ? 'yellow' : 'green'}
          left={<StatsLeft w={w} />}
          right={<StatsRight w={w} now={now} />}
        />
      ))}
      <Box flexDirection="column" marginX={2}>
        <Text>
          <Text color="green">{totals.complete.toLocaleString()}</Text> pages
          <Text dimColor>
            {'  '}
            {totals.skipped.toLocaleString()} skipped {'  '}
            {totals.errors} errors
          </Text>
        </Text>
        <Text dimColor>
          files: {jobs.done} / {jobs.total}
          {snap.finished ? '  — finished' : ''}
        </Text>
        <Text>
          <Text dimColor>write queue: </Text>
          <Text color="blue">{writeQueue.queueLength}</Text>
        </Text>
        <Text dimColor>p to pause/resume, esc or ctrl-c to quit</Text>
      </Box>
    </Box>
  )
}

export default App
