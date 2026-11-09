import { useInput, useStdin } from 'ink'
import { store } from './store.js'

// global keys - left/esc step backward, and close the dialogue from the first page
const useKeyboard = function (finish) {
  const { isRawModeSupported } = useStdin()
  useInput(
    (input, key) => {
      if (key.leftArrow || key.escape) {
        const wentBack = store.goBack()
        if (!wentBack) {
          finish()
        }
      }
      if (key.ctrl && input === 'c') {
        finish()
      }
    },
    { isActive: isRawModeSupported }
  )
}

export default useKeyboard
