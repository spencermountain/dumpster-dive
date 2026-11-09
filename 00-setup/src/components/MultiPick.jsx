import React, { useState } from 'react'
import { Text, Box, useInput } from 'ink'
import { ScrollList } from 'ink-scroll-list'
import { ActionRow, useFold } from './lib.jsx'
import Header from './Header.jsx'

// build the initial { id: bool } map from isDefault flags
const initialChecked = (list) => {
  const obj = {}
  list.forEach((o) => {
    obj[String(o.id)] = o.isDefault === true
  })
  return obj
}

// keep only the checked ids - {} when nothing is on
const onlyTrue = (checked) => {
  const obj = {}
  Object.keys(checked).forEach((id) => {
    if (checked[id] === true) {
      obj[id] = true
    }
  })
  return obj
}

// checkbox-group sibling of SinglePick - space toggles, enter/right-arrow or the 'Done' row submits
// long lists start folded at `collapseAt` rows, with a 'show more' row to unfold
const MultiPick = ({ list, title, description, onDone, collapseAt = 5 }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [checked, setChecked] = useState(() => initialChecked(list))
  const fold = useFold(list, collapseAt)
  const { visible, moreIndex } = fold
  const doneIndex = fold.expanded ? visible.length : visible.length + 1 // trailing 'Done' row

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, doneIndex))
    }
    if (key.return || key.rightArrow) {
      onDone(onlyTrue(checked)) // accept the current state from any row
      return
    }
    if (input === ' ') {
      if (selectedIndex === doneIndex) {
        onDone(onlyTrue(checked))
        return
      }
      if (selectedIndex === moreIndex) {
        fold.expand() // cursor lands on the first revealed row
        return
      }
      const id = String(visible[selectedIndex].id)
      setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
    }
  })
  const isLongList = visible.length > 20
  const rowMargin = isLongList ? 0 : 1
  return (
    <Box flexDirection="column" paddingX={2} paddingBottom={2}>
      <Header title={title} description={description} />
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
          {fold.expanded ? null : (
            <Box key="more" marginBottom={rowMargin}>
              <ActionRow
                label={`► show ${fold.hiddenCount} more`}
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
