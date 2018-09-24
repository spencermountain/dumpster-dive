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
### 3.3.0
* bugfix for runtime parsing error
### 3.4.2
* update deps, wtf library improvements
* relicense as MIT
* use latest mongo api
### 3.6.0
* :warning: remove `.infoboxes` and `.citations` from top-level result. this is duplicate data. find them both in `section[i].templates`
* improve handling of redirect pages
* refactor encoding logic

## v4
* major json format changes from [wtf_wikipedia v6.0.0](https://github.com/spencermountain/wtf_wikipedia/pull/190)
* get skip_redirects actually working
* reduce default batch_size even lower
* add `verbose_skip` option, to log disambig/redirect skipping
