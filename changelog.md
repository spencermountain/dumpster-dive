## v2
* updates to use `wtf_wikipedia@2.0.0` - a [major](https://github.com/spencermountain/wtf_wikipedia/blob/master/changelog.md#200) result-format change

* renames bin cmd to `wiki2mongo`
* supports use from cli, or use via javascript `require()`
* support --plaintext flag
### v2.3.0
* add try/catch
* supoprt --skip_redirects && --skip_disambig
### v2.4.0
* add a 3s 'break' to avoid build-up of mongo inserts
* add new --verbose and --skip_first options

## v3
* MASSIVE SPEEDUP! full re-write by @devrim 🙏 to fix #59
* rename from `wikipedia-to-mongo` to `dumpster-dive`
* use wtf_wikipedia v3 (a big re-factor too!)
* use `line-by-line`, and `worker-nodes` to run parsing in parallel
### v3.1.0
* fix connection time-outs & improve logging output
* change default collection name to `pages`
* add `.custom()` function support
### v3.2.0
* update to [wtf_wikipedia v4.2.0](https://github.com/spencermountain/wtf_wikipedia/blob/master/changelog.md#310)
* support passing-in arbitrary functions to worker
