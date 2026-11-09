import { useInput, useStdin } from 'ink'
import { store } from './store.js'

// global keys - left steps backward (closing from the first page), esc or ctrl-c closes
const useKeyboard = function (finish) {
  const { isRawModeSupported } = useStdin()
  useInput(
    (input, key) => {
      if (key.leftArrow) {
        const wentBack = store.goBack()
        if (!wentBack) {
          finish()
        }
      }
      if (key.escape || (key.ctrl && input === 'c')) {
        finish()
      }
    },
    { isActive: isRawModeSupported }
  )
}

export default useKeyboard
