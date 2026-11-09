import { useInput, useStdin } from 'ink'
import { store } from './store.js'

const useKeyboard = function (finish) {
  const { isRawModeSupported } = useStdin()
  useInput(
    (input, key) => {
      if (key.return) {
        store.nextPage()
      }
      if (key.escape || (key.ctrl && input === 'c')) {
        finish()
      }
    },
    { isActive: isRawModeSupported }
  )
}

export default useKeyboard
