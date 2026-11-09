import React from 'react'
import { Box, Text } from 'ink'

// characters for the filled and empty parts of the bar
const FULL = '█'
// dim-grey track colour - hex so the same shade works as foreground and background
const TRACK = '#666666'
// partial cell, in eighths - index 0 is an empty cell, 8 is a full one
const EIGHTHS = ['', '▏', '▎', '▍', '▌', '▋', '▊', '▉', FULL]
// half-block end caps, to round off the bar
const LEFT_CAP = '▐'
const RIGHT_CAP = '▌'

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

// cells for the status/label column, so long names truncate instead of wrapping
const LABEL_WIDTH = 18
// text cells inside that column, after its border, padding, and a cell of slack
const LABEL_TEXT = LABEL_WIDTH - 5

// cut a string to fit, marking the cut
const clip = function (str, n) {
  if (str.length <= n) {
    return str
  }
  return str.slice(0, n - 1) + '…'
}

// horizontal bar chart for a percentage integer
// left and right are nodes for the row under the bar; the percent sits at the far right
const Bar = function ({
  percent = 0,
  width = 75,
  label = '',
  status = '',
  color = 'green',
  left = null,
  right = null
}) {
  let pct = toPercent(percent)
  // the caps take one cell each; the scale runs across the cells between them
  let inner = Math.max(0, width - 2)
  let { full, partial, empty } = fill(pct, inner)
  // caps take the fill colour once the bar reaches them
  let leftColor = pct > 0 ? color : TRACK
  let rightColor = pct >= 100 ? color : TRACK
  return (
    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
      <Box
        flexDirection="column"
        alignItems="center"
        justifyContent="space-between"
        paddingX={1}
        marginX={1}
        width={LABEL_WIDTH}
        flexShrink={0}
        height="100%"
        borderStyle="round"
        borderColor="grey"
      >
        <Text>{clip(status || '', LABEL_TEXT)}</Text>
        <Text>{clip(label || '', LABEL_TEXT)}</Text>
      </Box>
      <Box
        flexDirection="column"
        alignItems="flex-end"
        paddingX={1}
        borderStyle="round"
        borderColor="dim"
      >
        {/* the actual bar chart*/}
        <Box width={width}>
          <Text color={leftColor}>{LEFT_CAP}</Text>
          <Text color={color}>{FULL.repeat(full)}</Text>
          <Text color={color} backgroundColor={TRACK}>
            {partial}
          </Text>
          <Text color={TRACK}>{FULL.repeat(empty)}</Text>
          <Text color={rightColor}>{RIGHT_CAP}</Text>
        </Box>
        {/* a rule, then the status row: details left, rate, runtime and percent right */}
        <Text color={TRACK}>{'─'.repeat(width)}</Text>
        <Box width={width} flexDirection="row">
          {left}
          <Box flexGrow={1} />
          {right}
          <Text>{String(pct)}%</Text>
        </Box>
      </Box>
    </Box>
  )
}

export default Bar
