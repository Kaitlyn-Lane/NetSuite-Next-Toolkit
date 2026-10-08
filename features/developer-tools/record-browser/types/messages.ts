// Shared contract between entrypoints/record-browser and
// entrypoints/developer-tools.content.ts — imported by both sides so a
// mismatch is a compile error, not a runtime surprise.

export const GET_RECORD_MESSAGE = "GET_RECORD" as const;

export interface GetRecordRequest {
  type: typeof GET_RECORD_MESSAGE;
}

// Values are whatever parse-record.ts's xmlElementToValue produced — plain
// strings, nested objects, arrays — so a loose JSON-ish type rather than a
// per-field schema (every record type has different fields).
export type RecordValue = string | RecordValue[] | { [key: string]: RecordValue };

export interface RecordData {
  recordType: string | null;
  id: string | null;
  bodyFields: Record<string, RecordValue>;
  lineFields: Record<string, RecordValue[]>;
}

export type GetRecordResponse =
  | { ok: true; record: RecordData; sourceUrl: string }
  | { ok: false; error: string };

export function isGetRecordRequest(message: unknown): message is GetRecordRequest {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { type?: unknown }).type === GET_RECORD_MESSAGE
  );
}
