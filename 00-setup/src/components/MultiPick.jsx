import React, { useState } from 'react'
import { Text, Box, useInput } from 'ink'
import { ScrollList } from 'ink-scroll-list'

// build the initial { id: bool } map from isDefault flags
const initialChecked = (list) => {
  const obj = {}
  list.forEach((o) => {
    obj[String(o.id)] = o.isDefault === true
  })
  return obj
}

// a non-checkable row: 'show more' or 'Done'
const ActionRow = ({ label, isSelected, dim }) => {
  return (
    <Box gap={1} height={1}>
      <Text bold color="blue">
        {isSelected ? '❯' : ' '}
      </Text>
      <Text bold color={isSelected ? 'blue' : 'white'} dimColor={dim && !isSelected}>
        {label}
      </Text>
    </Box>
  )
}

// checkbox-group sibling of SinglePick - space/enter toggles, 'Done' row submits
// long lists start folded at `collapseAt` rows, with a 'show more' row to unfold
const MultiPick = ({ list, title, description, onDone, collapseAt = 5 }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [checked, setChecked] = useState(() => initialChecked(list))
  const [expanded, setExpanded] = useState(list.length <= collapseAt)

  const visible = expanded ? list : list.slice(0, collapseAt)
  const hiddenCount = list.length - visible.length
  const moreIndex = expanded ? -1 : visible.length // the 'show more' row, if folded
  const doneIndex = expanded ? visible.length : visible.length + 1 // trailing 'Done' row

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, doneIndex))
    }
    if (key.rightArrow) {
      onDone({ ...checked }) // accept the current state from any row
      return
    }
    if (key.return || input === ' ') {
      if (selectedIndex === doneIndex) {
        onDone({ ...checked })
        return
      }
      if (selectedIndex === moreIndex) {
        setExpanded(true) // cursor lands on the first revealed row
        return
      }
      const id = String(visible[selectedIndex].id)
      setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
    }
  })
  const isLongList = visible.length > 20
  const rowMargin = isLongList ? 0 : 1
  return (
    <Box flexDirection="column" padding={2}>
      <Text bold underline color="cyan">
        {title || ''}
      </Text>
      <Box paddingLeft={2} height={1}>
        <Text dim>{description || ''}:</Text>
      </Box>
      <Box
        borderStyle="single"
        borderColor="grey"
        borderTop={false}
        borderLeft={true}
        borderBottom={false}
        borderRight={false}
        maxHeight={20}
        maxWidth={60}
        paddingLeft={2}
        paddingTop={1}
        paddingBottom={1}
        marginBottom={1}
        marginLeft={4}
      >
        <ScrollList
          selectedIndex={selectedIndex}
          paddingLeft={1}
          gap={1}
          borderStyle="singleDouble"
          borderColor="grey"
          borderTop={false}
          borderLeft={false}
          borderBottom={isLongList}
          borderRight={false}
        >
          {visible.map((obj, i) => {
            const isOn = checked[String(obj.id)] === true
            const isSelected = i === selectedIndex
            // green when checked, white while hovered (half-chosen), grey otherwise
            let color = 'grey'
            if (isOn) {
              color = 'green'
            } else if (isSelected) {
              color = 'white'
            }
            return (
              <Box key={i} gap={1} paddingBottom={0} height={1} marginBottom={rowMargin}>
                {/* cursor*/}
                <Text bold color="blue">
                  {isSelected ? '❯' : ' '}
                </Text>
                {/* checked state*/}
                <Text bold color={color}>
                  {isOn ? '◉' : '○'}
                </Text>
                {/* title*/}
                <Text bold={isSelected} color={color}>
                  {obj.label}
                </Text>
                <Text color="grey">- {obj.description || ''}</Text>
              </Box>
            )
          })}
          {/* fold row*/}
          {expanded ? null : (
            <Box key="more" marginBottom={rowMargin}>
              <ActionRow
                label={`▸ show ${hiddenCount} more`}
                isSelected={selectedIndex === moreIndex}
                dim={true}
              />
            </Box>
          )}
          {/* submit row*/}
          <Box key="done">
            <ActionRow label="Done" isSelected={selectedIndex === doneIndex} />
          </Box>
        </ScrollList>
      </Box>
    </Box>
  )
}

export default MultiPick
