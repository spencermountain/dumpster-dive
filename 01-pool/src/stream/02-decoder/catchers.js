// wrap chosen decoder with error-handling
const addCatchers = function (decoder) {
  const fail = (error) => {
    decoder.stdout.destroy(error)
  }
  decoder.on('error', fail)
  decoder.stdin.on('error', fail)
  decoder.on('exit', (code, signal) => {
    if (code !== 0) {
      fail(new Error(`${decoder.spawnfile} exited with ${signal || code}`))
    }
  })
  decoder.stdout.on('close', () => {
    decoder.stdin.destroy()
    if (!decoder.stdout.readableEnded && decoder.exitCode === null && decoder.signalCode === null) {
      decoder.kill()
    }
  })
}
export default addCatchers
