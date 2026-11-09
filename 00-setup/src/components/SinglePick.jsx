  import React, { useState } from 'react'
  import { Text, Box, useInput } from 'ink'
  import { ScrollList } from 'ink-scroll-list'
  import { Show } from './lib.jsx'

  const SinglePick = ({ list, title, description, onSelect }) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    // Handle keyboard navigation in the parent
    useInput((_, key) => {
      if (key.upArrow) {
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }
      if (key.downArrow) {
        setSelectedIndex((prev) => Math.min(prev + 1, list.length - 1))
      }
      if (key.return) {
        onSelect(list[selectedIndex].id)
      }
    })
    const isLongList = list.length > 20
    return (
      <Box flexDirection="column" padding={2}>
        <Text bold underline color="cyan">
          {title || ''}
        </Text>
        <Box paddingLeft={2} height={1}>
          {/* <Text color="white" dimColor>
            ╰─
          </Text>*/}
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
            {list.map((obj, i) => (
              <Box key={i} gap={1} paddingBottom={0} height={1} marginBottom={isLongList ? 0 : 1}>
                {/* icon*/}
                <Text bold>{i === selectedIndex ? '●' : '○'}</Text>
                {/* title*/}
                <Text
                  bold
                  color={i === selectedIndex ? 'blue' : 'white'}
                  dimColor={i !== selectedIndex}
                >
                  {obj.label}
                </Text>
                <Text color="grey">- {obj.description || ''}</Text>
                {/* <Show condition={obj.isDefault}>
                  <Text color="grey">{' ❯'}</Text>
                </Show>*/}

              </Box>
            ))}
          </ScrollList>
        </Box>
      </Box>
    )
  }

  export default SinglePick
