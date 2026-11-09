import React from 'react'
import { Box, Text } from 'ink'

// the bar scale runs this far past max, so overflow is visible
const OVERFLOW = 1.2
// turn yellow once within this fraction of max
const WARN = 0.8
// partial row, in eighths from the bottom - index 0 is empty, 8 is full
const EIGHTHS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
const FULL = '█'
// dim-grey track colour - hex so the same shade works as foreground and background
const TRACK = '#666666'

// red over max, yellow when close, blue otherwise
const pickColor = function (value, max) {
  if (value > max) {
    return 'red'
  }
  if (value >= max * WARN) {
    return 'yellow'
  }
  return 'blue'
}

// how many eighths of this row are filled, 0-8
const rowFill = function (eighths, row) {
  let below = row * 8
  return Math.min(8, Math.max(0, eighths - below))
}

// one row of the bar: full track, full fill, or a partial glyph over the track colour
const Row = function ({ n, width, color }) {
  if (n === 0) {
    return <Text color={TRACK}>{FULL.repeat(width)}</Text>
  }
  if (n === 8) {
    return <Text color={color}>{FULL.repeat(width)}</Text>
  }
  return (
    <Text color={color} backgroundColor={TRACK}>
      {EIGHTHS[n].repeat(width)}
    </Text>
  )
}

// vertical bar chart for a count against a max, with headroom above max
const VBar = function ({ value = 0, max = 1200, height = 18, width = 4, label = 'backlog' }) {
  let top = max * OVERFLOW
  let ratio = Math.min(1, Math.max(0, value / top))
  let eighths = Math.round(ratio * height * 8)
  let color = pickColor(value, max)
  // the row whose top edge sits at max
  let maxRow = Math.round(height / OVERFLOW) - 1
  // rows are drawn top-down
  let rows = []
  for (let row = height - 1; row >= 0; row -= 1) {
    rows.push(row)
  }
  return (
    <Box
      flexDirection="column"
      alignSelf="flex-start"
      paddingX={1}
      borderStyle="round"
      borderColor="dim"
    >
      {rows.map((row) => (
        <Box key={row}>
          <Box width={width} flexShrink={0}>
            <Row n={rowFill(eighths, row)} width={width} color={color} />
          </Box>
          <Text dimColor>{row === maxRow ? ' ◂ max' : ''}</Text>
        </Box>
      ))}
      <Text>{label}</Text>
      <Text color={color}>
        {value} / {max}
      </Text>
    </Box>
  )
}

export default VBar
