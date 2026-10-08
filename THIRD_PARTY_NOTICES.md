# Third-Party Notices

This project adapts code or approaches from the following third-party
projects. Dependencies installed through npm are tracked in
`package.json` and carry their own license files under `node_modules/`;
this file is for anything adapted *into* this repo's own source.

## netsuite-field-explorer

- Source: https://github.com/michoelchaikin/netsuite-field-explorer
- Used in: `features/developer-tools/record-browser/` (`parse-record.ts`,
  `filter-record.ts`)
- What was adapted: the approach of fetching a record's `&xml=T`
  representation and reshaping it into `{ recordType, id, bodyFields,
  lineFields }` (its `formatRecord` transform, in `src/js/popup.js`), plus
  its `filterRecord` key/value search filter. Reimplemented in TypeScript
  with the browser's own `DOMParser` in place of its `x2js`/lodash
  dependencies.
- License: MIT
