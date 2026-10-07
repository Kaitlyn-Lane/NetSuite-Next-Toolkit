// Adapted from michoelchaikin/netsuite-field-explorer
// (https://github.com/michoelchaikin/netsuite-field-explorer, MIT licensed
// — see THIRD_PARTY_NOTICES.md at the repo root). Its src/js/popup.js
// fetches a record's `&xml=T` representation, converts it to JSON with
// x2js, then reshapes it with formatRecord (mirrored by formatRecord
// below). This is a TypeScript reimplementation on the browser's own
// DOMParser instead of pulling in x2js + lodash for one transform —
// xmlElementToValue follows x2js's conventions closely enough that
// formatRecord's shape matches the original.
import type { RecordData, RecordValue } from "./types/messages";

// x2js-style conversion of one element:
// - no attributes and no child elements → its text content (a string)
// - otherwise an object: each attribute as `_<name>`, each child element
//   under its tag name (a repeated tag becomes an array), and any
//   non-whitespace text alongside them as `__text`
function xmlElementToValue(element: Element): RecordValue {
  const children = Array.from(element.children);
  if (element.attributes.length === 0 && children.length === 0) {
    return element.textContent ?? "";
  }

  const result: Record<string, RecordValue> = {};
  for (const attr of Array.from(element.attributes)) {
    result[`_${attr.name}`] = attr.value;
  }

  for (const child of children) {
    const value = xmlElementToValue(child);
    const existing = result[child.tagName];
    if (existing === undefined) {
      result[child.tagName] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[child.tagName] = [existing, value];
    }
  }

  if (children.length === 0) {
    const text = element.textContent?.trim();
    if (text) result.__text = text;
  }

  return result;
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

// Mirrors the original's formatRecord: <record>'s recordType/id
// attributes become top-level fields, each <machine name="..."> sublist
// becomes lineFields[name], the `fields` attribute (a comma-separated
// field-id list, redundant with the elements themselves) is dropped, and
// everything else is a body field. One deliberate difference: a sublist
// with a single <line> is still an array here (x2js — and so the
// original — collapses it to a bare object), so every lineFields entry
// has the same shape regardless of line count.
function formatRecord(record: Record<string, RecordValue>): RecordData {
  const formatted: RecordData = { recordType: null, id: null, bodyFields: {}, lineFields: {} };

  for (const [key, value] of Object.entries(record)) {
    switch (key) {
      case "machine":
        for (const sublist of asArray(value)) {
          if (typeof sublist !== "object" || Array.isArray(sublist)) continue;
          const name = sublist._name;
          if (typeof name !== "string") continue;
          formatted.lineFields[name] = sublist.line === undefined ? [] : asArray(sublist.line);
        }
        break;

      case "_recordType":
        formatted.recordType = typeof value === "string" ? value : null;
        break;

      case "_id":
        formatted.id = typeof value === "string" ? value : null;
        break;

      case "_fields":
        break;

      default:
        formatted.bodyFields[key] = value;
    }
  }

  return formatted;
}

// Throws if the response isn't a NetSuite record XML document — the
// usual way that happens is NetSuite answering with an HTML page instead
// (login redirect, error page, or a page that isn't a record at all).
export function parseRecordXml(xml: string): RecordData {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Response wasn't valid XML — is this a record page, and are you still logged in?");
  }

  const recordElement = doc.querySelector("nsResponse > record");
  if (!recordElement) {
    throw new Error("Response had no <nsResponse><record> — is this a record page?");
  }

  const record = xmlElementToValue(recordElement);
  if (typeof record !== "object" || Array.isArray(record)) {
    throw new Error("Record element was empty");
  }
  return formatRecord(record);
}
