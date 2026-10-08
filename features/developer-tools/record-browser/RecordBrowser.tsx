import { useEffect, useMemo, useState } from "react";
import { allExpanded, darkStyles, defaultStyles, JsonView } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";

import { filterRecord } from "./filter-record";
import {
  GET_RECORD_MESSAGE,
  type GetRecordRequest,
  type GetRecordResponse,
  type RecordData,
} from "./types/messages";

// Matches core/theme.css, which also only follows prefers-color-scheme.
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const treeStyles = prefersDark ? darkStyles : defaultStyles;

// Same two-levels-open default as the original extension's JSONFormatter
// call: every body field and sublist name visible, sublist lines (and
// anything else nested deeper) collapsed until clicked.
const DEFAULT_EXPAND = (level: number) => level < 2;

// The NetSuite tab this page was opened from (see open-record-browser.ts)
// — this page is its own tab, so "the active tab" would be itself. Loads
// on mount; Reload re-asks the same tab, which picks up whatever record
// it's on by then.
export function RecordBrowser({ sourceTabId }: { sourceTabId: number }) {
  const [record, setRecord] = useState<RecordData | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const visible = useMemo(() => {
    if (!record) return null;
    return searchTerm ? filterRecord(record, searchTerm) : record;
  }, [record, searchTerm]);

  async function loadRecord(): Promise<void> {
    setLoading(true);
    setStatus("Loading…");
    try {
      let response: GetRecordResponse;
      try {
        response = await chrome.tabs.sendMessage<GetRecordRequest, GetRecordResponse>(sourceTabId, {
          type: GET_RECORD_MESSAGE,
        });
      } catch {
        setRecord(null);
        setStatus(
          "Couldn't reach the NetSuite tab this was opened from — it may have been closed. Reload that tab and click Load Record again.",
        );
        return;
      }

      if (response.ok) {
        setRecord(response.record);
        setSourceUrl(response.sourceUrl);
        setStatus("");
      } else {
        setRecord(null);
        setStatus(`Error: ${response.error}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecord();
    // Once per page load — sourceTabId comes from the URL and never changes.
  }, []);

  return (
    <div className="rb-root">
      <header className="rb-header">
        <h1 className="rb-title">
          {record ? `${record.recordType ?? "record"} #${record.id ?? "?"}` : "Record Browser"}
        </h1>
        <button type="button" className="btn btn-primary" onClick={() => void loadRecord()} disabled={loading}>
          Reload Record
        </button>
      </header>
      {status && <p className="rb-status">{status}</p>}

      {record && (
        <>
          <div className="rb-toolbar">
            <input
              type="search"
              className="rb-search"
              placeholder="Search fields and values…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              autoFocus
            />
            <a className="rb-source" href={sourceUrl} target="_blank" rel="noreferrer">
              View raw XML
            </a>
          </div>
          <div className="rb-tree">
            {visible && Object.keys(visible).length ? (
              // Keyed on the search term: JsonView only reads
              // shouldExpandNode on mount, so remounting is what makes a
              // new search expand everything that matched.
              <JsonView
                key={searchTerm}
                data={visible}
                style={treeStyles}
                shouldExpandNode={searchTerm ? allExpanded : DEFAULT_EXPAND}
              />
            ) : (
              <p className="rb-status">No fields match “{searchTerm}”.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
