// group consecutive bz2 streams into jobs for the worker pool.
// each job is a {start, end} byte range that begins and ends exactly on
// stream boundaries, so any worker can decompress it independently.
//
// sizing: aim for ~40 jobs per worker - small enough to load-balance the
// tail, big enough that spawning a decompressor per job stays negligible.
const partition = function (offsets, fileSize, workers) {
  let perJob = Math.ceil(offsets.length / (workers * 40))
  perJob = Math.max(1, Math.min(perJob, 200))
  let jobs = []
  for (let i = 0; i < offsets.length; i += perJob) {
    let start = offsets[i]
    let next = offsets[i + perJob]
    // createReadStream's `end` is inclusive. the final job runs to the end of
    // the file, which tacks on the closing '</mediawiki>' stream - harmless.
    let end = next !== undefined ? next - 1 : fileSize - 1
    jobs.push({ id: jobs.length, start, end, streams: Math.min(perJob, offsets.length - i) })
  }
  return jobs
}

export default partition
