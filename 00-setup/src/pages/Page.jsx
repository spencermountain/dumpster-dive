import React from 'react'
import { Box, Text } from 'ink'
import { useSnapshot } from 'valtio'
import { store } from '../store.js'
import { Show } from '../components/lib.jsx'
import Lang from './Lang/Index.jsx'
import Project from './Project/Index.jsx'
import Source from './Source/Index.jsx'
import Writer from './Writer/Index.jsx'
import Format from './Format/Index.jsx'

const pages = {
  project: Project,
  lang: Lang,
  source: Source,
  writer: Writer,
  format: Format
}

const Page = function () {
  const { livePage } = useSnapshot(store)
  const PageComponent = pages[livePage]
  return (
    <Box>
      <Show condition={PageComponent}>
        <PageComponent />
      </Show>
      <Show condition={!PageComponent}>
        <Text dimColor>{'Error: no page ' + livePage}</Text>
      </Show>
    </Box>
  )
}
export default Page
