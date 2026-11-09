import React from 'react'
import { Box, Text } from 'ink'
import { niceTime, niceRate, niceBytes, percentOf } from './_lib.js'

const icons = { finished: '✓', stopped: '⏹', error: '✗', pending: '·', running: '·' }
const colors = { finished: 'green', stopped: 'yellow', error: 'red' }

// a label in grey, then its value
const Row = function ({ label, children }) {
  return (
    <Box>
      <Box width={10}>
        <Text dimColor>{label}</Text>
      </Box>
      <Text>{children}</Text>
    </Box>
  )
}

// one line per dump file
const FileLine = function ({ f }) {
  const color = colors[f.status] || 'grey'
  return (
    <Box>
      <Text color={color}>{icons[f.status] || ' '} </Text>
      <Box width={9}>
        <Text>File #{f.index + 1}</Text>
      </Box>
      <Box width={7}>
        <Text dimColor>{niceBytes(f.size)}</Text>
      </Box>
      <Text>{f.pages.toLocaleString()} pages </Text>
      <Text color="green">{f.complete.toLocaleString()} kept </Text>
      <Text dimColor>
        {f.startedAt ? niceTime((f.finishedAt || Date.now()) - f.startedAt) : 'not started'}
      </Text>
    </Box>
  )
}

// the static report shown once the pool is done
// extra: [[label, value]] lines from a writer plugin, if it has any
const Summary = function ({ state, opts = {}, extra = [] }) {
  const { totals, files, jobs, writeQueue, ending, elapsed } = state
  const seconds = elapsed / 1000
  const title = ending ? 'Ended early' : 'Finished'
  const where = [
    opts.lang && `${opts.lang}${opts.project === 'wikipedia' ? 'wiki' : opts.project}`,
    opts.date
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <Box flexDirection="column" marginY={1} marginX={2} paddingTop={3}>
      <Text>
        <Text bold color={ending ? 'yellow' : 'green'}>
          {ending ? '⏹' : '✓'} {title}
        </Text>
        <Text dimColor>{where ? `  ${where}` : ''}</Text>
      </Text>
      <Text dimColor>{'─'.repeat(60)}</Text>
      <Row label="files">
        {jobs.done} / {jobs.total} complete
      </Row>
      <Box flexDirection="column" marginLeft={10} marginBottom={1}>
        {files.map((f) => (
          <FileLine key={f.index} f={f} />
        ))}
      </Box>
      <Row label="pages">{totals.pages.toLocaleString()} seen</Row>
      <Row label="kept">
        <Text color="green">{totals.complete.toLocaleString()}</Text> (
        {percentOf(totals.complete, totals.pages)}%)
      </Row>
      <Row label="skipped">{totals.skipped.toLocaleString()}</Row>
      <Row label="errors">
        <Text color={totals.errors ? 'red' : undefined}>{totals.errors}</Text>
      </Row>
      <Box marginTop={1} flexDirection="column">
        <Row label="written">
          <Text color="cyan">{totals.written.toLocaleString()}</Text> articles in{' '}
          {writeQueue.completed} batches
          {writeQueue.errors ? <Text color="red"> ({writeQueue.errors} failed)</Text> : ''}
        </Row>
        {extra.map(([label, value]) => (
          <Row key={label} label={label}>
            {String(value)}
          </Row>
        ))}
      </Box>
      <Box marginTop={1}>
        <Row label="time">
          <Text color="blue">{niceTime(elapsed)}</Text>
          <Text dimColor>
            {'  '}
            {niceBytes(totals.bytes)} at {niceRate(seconds ? totals.bytes / 1e6 / seconds : 0)}
            {'  '}
            {Math.round(totals.pages / (seconds || 1)).toLocaleString()} pages/s
          </Text>
        </Row>
      </Box>
    </Box>
  )
}

export default Summary
