import React from 'react'
import { Text } from 'ink'
import { niceTime, niceRate, percentOf } from './_lib.js'

// a blank keeps the column aligned while running
const icons = { running: ' ', paused: '⏸', finished: '✓', stopped: '⏹', error: '✗' }

const iconFor = function (f) {
  if (f.paused) {
    return icons.paused
  }
  return icons[f.status] || ' '
}

// runtime since the file started, frozen once it settles
const runtimeOf = function (f, now) {
  if (!f.startedAt) {
    return ''
  }
  return niceTime((f.finishedAt || now) - f.startedAt)
}

// left side of the status row: state, pages seen, and the share kept
const StatsLeft = function ({ f }) {
  if (f.status === 'pending') {
    return <Text dimColor>  waiting</Text>
  }
  return (
    <>
      <Text color={f.status === 'error' ? 'red' : undefined}>{iconFor(f)} </Text>
      <Text>{f.pages.toLocaleString()} pages</Text>
      <Text color="green">
        {' '}
        {f.complete.toLocaleString()} kept ({percentOf(f.complete, f.pages)}%)
      </Text>
    </>
  )
}

// right side: download rate while running, then runtime
const StatsRight = function ({ f, now }) {
  if (f.status === 'pending') {
    return null
  }
  const running = f.status === 'running'
  return (
    <>
      <Text dimColor>{running ? niceRate(f.rate) + '  ' : ''}</Text>
      <Text color={running ? 'blue' : 'green'}>{runtimeOf(f, now)} </Text>
    </>
  )
}

export { StatsLeft, StatsRight }
