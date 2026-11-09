import React from 'react'
import { Text } from 'ink'
import { niceTime, niceRate, percentOf } from './_lib.js'

// a blank keeps the column aligned while running
const icons = { idle: ' ', running: ' ', paused: '⏸', finished: '✓' }

const iconFor = function (w) {
  if (w.paused && w.status !== 'finished') {
    return icons.paused
  }
  return icons[w.status] || icons.idle
}

// runtime since the first job, frozen once the worker finishes
const runtimeOf = function (w, now) {
  if (!w.startedAt) {
    return ''
  }
  return niceTime((w.finishedAt || now) - w.startedAt)
}

// left side of the status row: state, pages seen, and the share kept
const StatsLeft = function ({ w }) {
  return (
    <>
      <Text>{iconFor(w)} </Text>
      <Text>{w.pages.toLocaleString()} pages</Text>
      <Text color="green">
        {' '}
        {w.complete.toLocaleString()} kept ({percentOf(w.complete, w.pages)}%)
      </Text>
    </>
  )
}

// right side: download rate (blank once finished), then runtime
const StatsRight = function ({ w, now }) {
  const done = w.status === 'finished'
  return (
    <>
      <Text dimColor>{done ? '' : niceRate(w.rate) + '  '}</Text>
      <Text color={done ? 'green' : 'blue'}>{runtimeOf(w, now)} </Text>
    </>
  )
}

export { StatsLeft, StatsRight }
