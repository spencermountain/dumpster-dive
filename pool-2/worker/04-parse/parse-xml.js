/*
<page>
	<title>Géorgie (pays)</title>
	<ns>0</ns>
	<id>1319</id>
	<revision>
	  ...
		<text bytes="129221" sha1="h2us6q7s44agn6tyzojghtwv8tz7kik" xml:space="preserve">
		  TEXT HERE
    </text>
		<sha1>o12sfdnrh6vqiwz0d9mkc0jfd07j5u5</sha1>
	</revision>
</page>
*/

import decodeEntities from './_lib.js'

const parseXML = (xmlString) => {
  const title = xmlString.match(/<title>([^<]*)<\/title>/)?.[1] || ''
  // The first ID belongs to the page, before revision and contributor IDs.
  const id = Number(xmlString.match(/<id>(\d+)<\/id>/)?.[1])
  const ns = Number(xmlString.match(/<ns>(-?\d+)<\/ns>/)?.[1])
  // Text can have attributes and line breaks; empty/deleted text becomes ''.
  const text = xmlString.match(/<text\b[^>]*>([\s\S]*?)<\/text>/)?.[1] || ''

  return { title: decodeEntities(title), id, ns, text: decodeEntities(text) }
}

export default parseXML
