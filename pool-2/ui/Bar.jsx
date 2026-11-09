import React from 'react'
import { Box, Text } from 'ink'

// characters for the filled and empty parts of the bar
const FULL = '█'
const SHADE = '░' // light-shade track behind the fill
// dim-grey track colour
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

// cells for the title/subtitle column on the left
const LABEL_WIDTH = 12

// horizontal bar chart for a percentage integer
// title and subtitle label the bar on the left; left and right are nodes for the
// row under the bar, with the percent at the far right. dim greys out a pending bar
const Bar = function ({
  percent = 0,
  width = 75,
  title = '',
  subtitle = '',
  color = 'green',
  dim = false,
  left = null,
  right = null
}) {
  let pct = toPercent(percent)
  if (dim) {
    color = TRACK
  }
  let { full, partial, empty } = fill(pct, width)
  return (
    <Box
      flexDirection="row"
      justifyContent="flex-start"
      alignItems="stretch"
      paddingTop={2}
      paddingLeft={1}
    >
      {/* title level with the bar, subtitle level with the status row */}
      <Box
        flexDirection="column"
        justifyContent="space-between"
        paddingX={1}
        width={LABEL_WIDTH}
        flexShrink={0}
      >
        <Text bold={!dim} dimColor={dim}>
          {title}
        </Text>
        <Text dimColor>{subtitle}</Text>
      </Box>
      <Box flexDirection="column" alignItems="flex-start" paddingX={1}>
        {/* the actual bar chart*/}
        <Box width={width}>
          <Text color={color}>{FULL.repeat(full) + partial}</Text>
          <Text color={TRACK}>{SHADE.repeat(empty)}</Text>
        </Box>
        {/* a rule, then the status row: details left, rate, runtime and percent right */}
        {/* <Text color={TRACK}>{'─'.repeat(width)}</Text>*/}
        <Box width={width} flexDirection="row">
          {left}
          <Box flexGrow={1} />
          {right}
          <Text dimColor={dim}>{String(pct)}%</Text>
        </Box>
      </Box>
    </Box>
  )
}

export default Bar
