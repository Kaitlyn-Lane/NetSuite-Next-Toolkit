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

```
MIT License

Copyright (c) 2017 michoelchaikin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
