// the three output flavours. tweak these presets to taste -
// anything on wtf_wikipedia's Document class is fair game here.
const toJson = function (doc, fmt) {
  if (fmt === 'sm') {
    return {
      plaintext: doc.text(),
      categories: doc.categories(),
      isDisambig: doc.isDisambig(),
    }
  }
  if (fmt === 'lg') {
    let json = doc.json({ images: true, coordinates: true, categories: true })
    json.plaintext = doc.text()
    json.isDisambig = doc.isDisambig()
    return json
  }
  // 'md' - the wtf_wikipedia default
  return doc.json()
}

export default toJson
