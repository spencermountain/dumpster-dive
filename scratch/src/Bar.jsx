import React from 'react'
import { Box, Text } from 'ink'

// characters for the filled and empty parts of the bar
const FULL = '█'
// dim-grey track colour - hex so the same shade works as foreground and background
const TRACK = '#666666'
// partial cell, in eighths - index 0 is an empty cell, 8 is a full one
const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉', FULL]

// clamp any input into an integer 0-100
const toPercent = function (n) {
  let num = Math.round(Number(n) || 0)
  return Math.min(100, Math.max(0, num))
}

// split the bar into full cells, one partial cell, and empty cells, at 1/8-cell resolution
const fill = function (pct, width) {
  let eighths = Math.round((pct / 100) * width * 8)
  let full = Math.floor(eighths / 8)
  let partial = EIGHTHS[eighths % 8]
  let empty = width - full - partial.length
  return { full, partial, empty }
}

// horizontal bar chart for a percentage integer
const Bar = function ({ percent = 0, width = 75, label = '', status = '', color = 'green' }) {
  let pct = toPercent(percent)
  let { full, partial, empty } = fill(pct, width)
  return (
    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        paddingX={1}
        marginX={1}
        height="100%"
        borderStyle="round"
        borderColor="grey"
      >
        <Text>{status || ''} </Text>
        <Text>{label || ''} </Text>
      </Box>
      <Box
        flexDirection="column"
        alignItems="flex-end"
        paddingX={1}
        borderStyle="round"
        borderColor="dim"
      >
        {/* the actual bar chart*/}
        <Box width={width} marginBottom={1}>
          <Text color={color}>{FULL.repeat(full)}</Text>
          <Text color={color} backgroundColor={TRACK}>
            {partial}
          </Text>
          <Text color={TRACK}>{FULL.repeat(empty)}</Text>
        </Box>
        <Text>{String(pct)}%</Text>
      </Box>
    </Box>
  )
}

export default Bar
