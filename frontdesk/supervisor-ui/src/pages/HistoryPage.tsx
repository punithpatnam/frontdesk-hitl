import { useEffect, useState, useRef } from "react";
import { listHelpRequests, markAllHelpRequestsSeen } from "@/api/helpRequests";
import type { HelpRequest, HelpRequestStatus } from "@/types/helpRequests";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { PAGE_SIZE } from "@/config";

export function HistoryPage() {
  const [status, setStatus] = useState<Extract<HelpRequestStatus, "resolved" | "unresolved">>("resolved");
  const [items, setItems] = useState<HelpRequest[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasUnseen, setHasUnseen] = useState(false);
  const toast = useToast();

  async function fetchPage(reset = false, nextPageCursor: string | null = null) {
    setLoading(true);
    try {
      const res = await listHelpRequests({
        status,
        limit: PAGE_SIZE,
        cursor: reset ? null : (nextPageCursor ?? cursor),
      });
      if (reset) {
        setItems(res.items);
        setCursor(null);
      } else {
        setItems(prev => prev.concat(res.items));
        setCursor(nextPageCursor);
      }
      setNextCursor(res.next_cursor);
  setHasUnseen((res.items || []).some((it: HelpRequest) => it.seen_by_supervisor === false));
    } catch (e: unknown) {
      toast.show((e as Error).message || "Failed to load history", "err");
    } finally {
      setLoading(false);
    }
  }

  // Only mark as seen on first mount, not on every filter change
  const markedSeenRef = useRef(false);
  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    if (!markedSeenRef.current) {
      markedSeenRef.current = true;
      markAllHelpRequestsSeen().finally(() => {
        fetchPage(true);
      });
    } else {
      fetchPage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div style={{ marginTop:16, display:"grid", gap:16 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, position: "relative" }}>
        Help Request History
        {hasUnseen && (
          <span style={{
            position: "absolute",
            right: -18,
            top: 6,
            width: 12,
            height: 12,
            background: "#e53935",
            borderRadius: "50%",
            display: "inline-block"
          }} />
        )}
      </h2>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="small" style={{ fontWeight: 600 }}>Filter</span>
          <select value={status} onChange={e => setStatus(e.target.value as Extract<HelpRequestStatus, "resolved" | "unresolved">)}>
            <option value="resolved">Resolved</option>
            <option value="unresolved">Unresolved</option>
          </select>
        </label>
        {loading && <div className="small" style={{ color: "var(--info-600)" }}>Loading...</div>}
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {items?.length === 0 && !loading && <EmptyState label="No items found in history." />}
        {items?.map((it) => (
          <div key={it.id} className="card position-relative">
            {/* Show notification dot on card if unseen */}
            {it.seen_by_supervisor === false && (
              <span style={{
                position: "absolute",
                right: 12,
                top: 12,
                width: 10,
                height: 10,
                background: "#e53935",
                borderRadius: "50%",
                zIndex: 2,
                boxShadow: "0 0 2px #e53935"
              }} />
            )}
            <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight:600, fontSize: "16px", marginBottom: 6, color: "var(--text-primary)" }}>
                  {it.question}
                </div>
                <div className="small" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span>Customer: <span className="mono">{it.customer_id}</span></span>
                  <span>•</span>
                  <span className={`badge badge-${it.status}`}>{it.status}</span>
                </div>
              </div>
              <div className="small mono" style={{ color: "var(--text-tertiary)" }}>
                ID: {it.id.slice(0, 8)}
              </div>
            </div>
            <div className="separator" />
            <div className="small" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span>Created: {fmt(it.created_at)}</span>
              <span>Updated: {fmt(it.updated_at)}</span>
            </div>
            {it.supervisor_answer && (
              <div className="alert alert-success mt-3 mb-0 p-2 d-flex align-items-center" style={{ borderRadius: 8 }}>
                <span className="me-2" style={{ fontSize: 18 }}>🟢</span>
                <span><b>Supervisor Answer:</b> {it.supervisor_answer}</span>
              </div>
            )}
            {it.ai_followup_sent && status === "resolved" && (
              <div className="small text-success" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "16px" }}>✓</span>
                <span>AI follow-up sent to caller after resolution</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Pagination
        hasNext={!!nextCursor}
        loading={loading}
        onNext={() => fetchPage(false, nextCursor)}
        onRefresh={() => fetchPage(true)}
      />

      {toast.msg && <Toast message={toast.msg} variant={toast.variant} onClose={toast.clear} />}
    </div>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}
