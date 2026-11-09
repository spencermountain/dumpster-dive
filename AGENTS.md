
This is a nodejs application intended to be a open source package, for letting people download and parse Wikipedia data dumps on normal consumer hardware, like a laptop, and with no existing expertise.

A number of plug-ins are being built, in separate repository, for writing the results into a different databases and outputs.

---

# Development

Unless given specific instruction:

- Do not edit README or add documentation
- do not install or change dependencies
- do not change existing tests
- do not make a commit or PR

Work on the current branch. The user may make simultaneous changes, and will make commits when they choose. Check before any destructive git changes to verify this work is not disrupted.

If you are generating tests, do so blindly and without research on the codebase.

### Code style

- Write maintainable javascript, using esmodules
- Write portable ES2022+ for browers and Node>=18
- Typescript and jsdoc are typically not required
- Add terse comments for maintainability
- Prefer functions assigned with const, over function declarations
- Do not use unbracketed if statements
- Do not use complex, multi-line, or nested ternary operators
- Avoid while loops when possible
- Prefer forEach and original for loops, unless an await is required
- File-size is always important
- Defensive try/catch blocks are not usually required

### Project structure

- Prefer pnpm over npm
- eslint is always available with `pnpm lint`
- Prefer small maintainable files with one purpose
- Split utility functions into a _lib.js file or ./_lib directory
- Prefer `export default` on files with only one export
- Prefer all exports at the bottom of files
- If the workflow is sequential, prefix filenames with 01-, 02-, ...
- Prefer tape-formatted tests and tap-dancer reporter
- Use process.env for any secrets, tokens, or keys
- Place configuration variables at top of file or in a seperate file
