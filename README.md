# dumpster workspace

Three pnpm projects:

- [dialogue](./dialogue/): Ink JSX components and a terminal playground.
- [pageviews](./pageviews/): empty boilerplate for future pageview tools.
- [pool](./pool/): the `dumpster-lib` parsing library, CLI, types, and tests.

Install dependencies with `pnpm install` (pnpm 11.5.0).

The root keeps shared Ink/React/tsx dependencies, lint tooling, and four scripts:

```sh
pnpm test       # pool tests
pnpm watch      # dialogue TUI, restarting when imported files change
pnpm dialogue   # same dialogue watcher
pnpm lint       # JavaScript and JSX across the workspace
```

Each project has a `scratch.jsx` TUI playground and a watcher:

```sh
pnpm --filter ./dialogue watch
pnpm --filter ./pool watch
pnpm --filter ./pageviews watch
```

You can also run `node --import tsx pool/scratch.jsx` from the root (replace
`pool` with any project), or `node --import tsx scratch.jsx` inside a project.
Watch mode restarts the app on changes, resetting component state. Ctrl+C exits
the TUI; press it again if the watcher remains waiting for changes.
Previous terminal output is preserved across restarts.
The parser smoke runner lives in `pool/smoke.js`: run `pnpm --filter ./pool smoke`,
optionally followed by `/absolute/path/to/dump.xml`.

Each package declares its own Ink/React runtime dependencies,
so the pool can still be packaged independently. Its package name, `dumpster-lib`,
exports, and `dumpster` CLI are unchanged. See [pool/README.md](./pool/README.md)
for the library API. Commands in that README run from `pool/`.
