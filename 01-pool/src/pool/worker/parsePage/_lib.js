const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

// Decode once, so escaped wikitext entities such as &amp;lt; remain &lt;.
const decodeEntities = (text) => text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (match, entity) => {
  if (entity[0] !== '#') {
    return entities[entity] || match
  }
  const hex = entity[1].toLowerCase() === 'x'
  const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10)
  if (code > 0x10ffff) {
    return match
  }
  return String.fromCodePoint(code)
})

export default decodeEntities
