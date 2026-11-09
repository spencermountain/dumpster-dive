const pageCounts = async function (opts) {
  const { lang, project } = opts
  const url = `https://${lang}.${project}.org/w/api.php?action=query&meta=siteinfo&siprop=statistics&format=json`
  const response = await fetch(url)
  const data = await response.json()
  const { pages, articles } = data?.query?.statistics || {}
  return { pages, articles }
}
export default pageCounts
