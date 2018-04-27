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
* use wtf_wikipedia v3 (big re-factor too!)
