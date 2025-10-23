import { useEffect, useState } from "react";
import { listKB, queryKB } from "@/api/kb";
import type { KBItem } from "@/types/kb";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { PAGE_SIZE } from "@/config";

export function LearnedAnswersPage() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // query box
  const [q, setQ] = useState("");
  const [hit, setHit] = useState<{ answer: string; kb_id: string; similarity: number } | null>(null);

  const toast = useToast();

  async function fetchPage(reset = false, nextPageCursor: string | null = null) {
    setLoading(true);
    try {
      const res = await listKB({ 
        cursor: reset ? null : (nextPageCursor ?? cursor), 
        limit: PAGE_SIZE 
      });
      const newItems = res.items || [];
      if (reset) {
        setItems(newItems);
        setCursor(null);
      } else {
        setItems(prev => [...prev, ...newItems]);
        setCursor(nextPageCursor);
      }
      setNextCursor(res.next_cursor || null);
    } catch (e: unknown) {
      toast.show((e as Error).message || "Failed to load KB", "err");
      // Ensure items is set even on error
      if (reset) setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setHit(null);
    const text = q.trim();
    if (!text) return;
    try {
      const res = await queryKB({ question: text });
      if (res.found) {
        setHit({ answer: res.answer, kb_id: res.kb_id, similarity: res.similarity });
      } else {
        toast.show("No match in KB", "ok");
      }
    } catch (e: unknown) {
      toast.show((e as Error).message || "KB query failed", "err");
    }
  }

  return (
    <div style={{ marginTop:16, display:"grid", gap:16 }}>
      <h2>Learned Answers</h2>

      {/* semantic search */}
      <div className="card" style={{ background: "var(--bg-secondary)" }}>
        <form onSubmit={onSearch} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="small" style={{ fontWeight: 600 }}>Semantic Search</span>
            <input
              className="input"
              placeholder="e.g., 'Do you give student discounts?'"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>
      </div>

      {hit && (
        <div className="card" style={{ 
          background: "var(--success-50)",
          borderColor: "var(--success-500)", 
          borderWidth: "2px",
          borderStyle: "solid"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: "20px" }}>✓</span>
            <div className="small text-success" style={{ fontWeight: 600 }}>
              Semantic match • {(hit.similarity*100).toFixed(0)}% similarity • KB ID: <span className="mono">{hit.kb_id}</span>
            </div>
          </div>
          <div style={{ whiteSpace:"pre-wrap", lineHeight: 1.6, color: "var(--text-primary)" }}>{hit.answer}</div>
        </div>
      )}

      {/* list */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>Knowledge Base</h3>
        {loading && <div className="small" style={{ color: "var(--info-600)" }}>Loading...</div>}
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {items?.length === 0 && !loading && <EmptyState label="No learned answers yet." />}
        {items?.map((it) => (
          <div key={it.id} className="card">
            <div style={{ fontWeight:600, fontSize: "15px", color: "var(--text-primary)", marginBottom: 6 }}>
              {it.question || it.question_raw || "Untitled"}
            </div>
            <div className="small" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
              <span className="badge">
                {it.source === "supervisor" ? "Supervisor" : "Seed"}
              </span>
              <span>•</span>
              <span>Updated: {it.updated_at ? formatWhen(it.updated_at) : "N/A"}</span>
            </div>
            <div className="separator" />
            <div title={it.answer} style={{ whiteSpace:"pre-wrap", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {truncate(it.answer, 400)}
            </div>
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

function truncate(s: string | undefined, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}
