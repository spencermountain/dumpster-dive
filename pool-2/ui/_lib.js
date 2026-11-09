// '2h:32m' past an hour, otherwise '12m:05s'
const niceTime = function (ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const pad = (n) => String(n).padStart(2, '0')
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h:${pad(mins)}m`
  }
  return `${Math.floor(seconds / 60)}m:${pad(seconds % 60)}s`
}

// '5.1mb/s'
const niceRate = (mbps) => `${(mbps || 0).toFixed(1)}mb/s`

// whole-number percent of a part, safe when the whole is zero
const percentOf = function (part, whole) {
  if (!whole) {
    return 0
  }
  return Math.round((part / whole) * 100)
}

// '25gb', '178mb'
const niceBytes = function (bytes) {
  if (!bytes) {
    return ''
  }
  const units = ['b', 'kb', 'mb', 'gb', 'tb']
  let total = bytes
  let unit = 0
  while (total >= 1000 && unit < units.length - 1) {
    total /= 1000
    unit += 1
  }
  const digits = total < 10 ? 1 : 0
  return `${total.toFixed(digits)}${units[unit]}`
}

export { niceTime, niceRate, niceBytes, percentOf }
