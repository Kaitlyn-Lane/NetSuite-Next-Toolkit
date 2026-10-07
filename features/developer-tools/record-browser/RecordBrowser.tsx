import { useMemo, useState } from "react";
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

export function RecordBrowser() {
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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setStatus("Couldn't find the active tab.");
        return;
      }

      let response: GetRecordResponse;
      try {
        response = await chrome.tabs.sendMessage<GetRecordRequest, GetRecordResponse>(tab.id, {
          type: GET_RECORD_MESSAGE,
        });
      } catch {
        setStatus("Couldn't reach the page — make sure you're on a NetSuite tab and try reloading it.");
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

  return (
    <div className="rb-root">
      <button type="button" className="btn btn-primary" onClick={() => void loadRecord()} disabled={loading}>
        {record ? "Reload record" : "Load current record"}
      </button>
      {status && <p className="rb-status">{status}</p>}

      {record && (
        <>
          <input
            type="search"
            className="rb-search"
            placeholder="Filter fields and values…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            autoFocus
          />
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
          <a className="rb-source" href={sourceUrl} target="_blank" rel="noreferrer">
            View raw XML
          </a>
        </>
      )}
    </div>
  );
}
