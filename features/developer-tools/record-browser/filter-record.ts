// Adapted from michoelchaikin/netsuite-field-explorer's filterRecord
// (https://github.com/michoelchaikin/netsuite-field-explorer, MIT licensed
// — see THIRD_PARTY_NOTICES.md), without its lodash dependency.
//
// Keeps any leaf whose key or value contains `searchTerm`
// (case-insensitive), plus every container on the path to one; drops
// containers with no matching descendants. Arrays stay arrays (matching
// elements only) rather than turning into index-keyed objects, so a
// filtered sublist still renders as a list.
type Json = unknown;

function filterValue(value: Json, key: string, term: string): Json | undefined {
  if (value === null || typeof value !== "object") {
    const matches = key.toUpperCase().includes(term) || String(value ?? "").toUpperCase().includes(term);
    return matches ? value : undefined;
  }

  if (Array.isArray(value)) {
    const kept = value
      .map((item, index) => filterValue(item, String(index), term))
      .filter((item) => item !== undefined);
    return kept.length ? kept : undefined;
  }

  const kept: Record<string, Json> = {};
  for (const [childKey, childValue] of Object.entries(value)) {
    const filtered = filterValue(childValue, childKey, term);
    if (filtered !== undefined) kept[childKey] = filtered;
  }
  return Object.keys(kept).length ? kept : undefined;
}

export function filterRecord<T extends object>(record: T, searchTerm: string): Partial<T> {
  return (filterValue(record, "", searchTerm.toUpperCase()) ?? {}) as Partial<T>;
}
