import React, { useState } from 'react'
import { Text, Box, useInput } from 'ink'
import { ScrollList } from 'ink-scroll-list'
import { ActionRow, useFold } from './lib.jsx'
import Header from './Header.jsx'

// radio-style list - enter, space or right-arrow selects the highlighted row
// long lists start folded at `collapseAt` rows, with a 'show more' row to unfold
const SinglePick = ({ list, title, description, onSelect, collapseAt = 5 }) => {
  // cursor starts on the default choice, so right-arrow accepts it
  const defaultIndex = Math.max(
    list.findIndex((obj) => obj.isDefault === true),
    0
  )
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex)
  const fold = useFold(list, collapseAt, defaultIndex >= collapseAt)
  const { visible, moreIndex } = fold
  const lastIndex = fold.expanded ? visible.length - 1 : moreIndex

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, lastIndex))
    }
    if (key.return || key.rightArrow || input === ' ') {
      if (selectedIndex === moreIndex) {
        fold.expand() // cursor lands on the first revealed row
        return
      }
      onSelect(visible[selectedIndex].id)
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
          gap={0}
          borderStyle="singleDouble"
          borderColor="grey"
          borderTop={false}
          borderLeft={false}
          borderBottom={isLongList}
          borderRight={false}
        >
          {visible.map((obj, i) => {
            const isSelected = i === selectedIndex
            return (
              <Box key={i} gap={1} paddingBottom={0} height={1} marginBottom={rowMargin}>
                {/* cursor*/}
                <Text bold color="blue">
                  {isSelected ? '❯' : ' '}
                </Text>
                {/* icon*/}
                <Text bold>{isSelected ? '●' : '○'}</Text>
                {/* title - bold marks the default choice*/}
                <Text
                  bold={obj.isDefault === true}
                  color={isSelected ? 'blue' : 'white'}
                  dimColor={!isSelected}
                >
                  {obj.label}
                </Text>
                <Text color="grey">- {obj.description || ''}</Text>
              </Box>
            )
          })}
          {/* fold row*/}
          {fold.expanded ? null : (
            <Box key="more">
              <ActionRow
                label={`► show ${fold.hiddenCount} more`}
                isSelected={selectedIndex === moreIndex}
                dim={true}
              />
            </Box>
          )}
        </ScrollList>
      </Box>
    </Box>
  )
}

export default SinglePick
