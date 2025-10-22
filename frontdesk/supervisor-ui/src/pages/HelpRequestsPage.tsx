import { useEffect, useMemo, useState } from "react";
import { listHelpRequests, resolveHelpRequest } from "@/api/helpRequests";
import type { HelpRequest, HelpRequestStatus } from "@/types/helpRequests";
import { usePolling } from "@/hooks/usePolling";
import { useToast } from "@/hooks/useToast";
import { POLL_MS_PENDING, PAGE_SIZE } from "@/config";
import { HelpRequestCard } from "@/components/HelpRequestCard";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Toast } from "@/components/Toast";

export function HelpRequestsPage() {
  const [status, setStatus] = useState<HelpRequestStatus>("pending");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [items, setItems] = useState<HelpRequest[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const pollingEnabled = useMemo(
    () => status === "pending" && autoRefresh,
    [status, autoRefresh]
  );

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
    } catch (e: unknown) {
      toast.show((e as Error).message || "Failed to load help requests", "err");
    } finally {
      setLoading(false);
    }
  }

  // initial + when status changes
  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // polling for pending
  usePolling(pollingEnabled, POLL_MS_PENDING, () => {
    // Refresh the first page to show newest pending at top
    fetchPage(true);
  });

  async function handleResolve(id: string, answer: string, resolver: string) {
    try {
      await resolveHelpRequest(id, { answer, resolver });
      // remove from list immediately
      setItems(prev => prev.filter(i => i.id !== id));
      toast.show("Follow-up sent to caller; KB updated");
    } catch (e: unknown) {
      toast.show((e as Error).message || "Failed to resolve request", "err");
    }
  }

  return (
    <div style={{ 
      marginTop: 32, 
      display: "grid", 
      gap: 24,
      maxWidth: "1200px",
      margin: "32px auto 0",
      padding: "0 20px"
    }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 16,
        borderBottom: "2px solid var(--border-light)"
      }}>
        <div>
          <h1 style={{ 
            fontSize: "32px", 
            fontWeight: 800, 
            color: "#000000",
            margin: 0,
            letterSpacing: "-1px"
          }}>
            Help Requests
          </h1>
          <p style={{ 
            fontSize: "16px", 
            color: "var(--text-secondary)", 
            margin: "8px 0 0",
            fontWeight: 400
          }}>
            Manage and resolve customer inquiries
          </p>
        </div>
        
        {loading && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border-light)"
          }}>
            <div style={{
              width: 16,
              height: 16,
              border: "2px solid var(--border-light)",
              borderTopColor: "#000000",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Loading...</span>
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "20px",
        background: "var(--bg-secondary)",
        borderRadius: 12,
        border: "1px solid var(--border-light)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ 
              fontSize: "12px", 
              fontWeight: 600, 
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
              Status Filter
            </label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value as HelpRequestStatus)}
              style={{
                padding: "10px 16px",
                border: "1px solid var(--border-light)",
                borderRadius: 8,
                background: "#ffffff",
                fontSize: "14px",
                fontWeight: 500,
                minWidth: "140px",
                cursor: "pointer"
              }}
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>
          
          {status === "pending" && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12,
              padding: "12px 16px",
              background: "#ffffff",
              borderRadius: 8,
              border: "1px solid var(--border-light)"
            }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                style={{ 
                  cursor: "pointer",
                  width: 16,
                  height: 16,
                  accentColor: "#000000"
                }}
              />
              <span style={{ 
                fontSize: "14px", 
                fontWeight: 500,
                color: "var(--text-primary)"
              }}>
                Auto-refresh every 3s
              </span>
            </div>
          )}
        </div>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "#ffffff",
          borderRadius: 8,
          border: "1px solid var(--border-light)"
        }}>
          <div style={{
            width: 8,
            height: 8,
            background: status === "pending" ? "#000000" : "var(--text-tertiary)",
            borderRadius: "50%"
          }}></div>
          <span style={{ 
            fontSize: "14px", 
            fontWeight: 600,
            color: "var(--text-primary)"
          }}>
            {items.length} {status} requests
          </span>
        </div>
      </div>

      {/* Requests Grid */}
      <div style={{ display: "grid", gap: 16 }}>
        {items?.length === 0 && !loading && (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "var(--bg-secondary)",
            borderRadius: 12,
            border: "1px solid var(--border-light)"
          }}>
            <div style={{
              width: 48,
              height: 48,
              background: "var(--bg-tertiary)",
              borderRadius: "50%",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              📋
            </div>
            <h3 style={{ 
              fontSize: "18px", 
              fontWeight: 600, 
              color: "var(--text-primary)",
              margin: "0 0 8px"
            }}>
              No {status} requests found
            </h3>
            <p style={{ 
              fontSize: "14px", 
              color: "var(--text-secondary)",
              margin: 0
            }}>
              {status === "pending" ? "All caught up! New requests will appear here." : "No items match your current filter."}
            </p>
          </div>
        )}
        
        {items?.map(item => (
          <HelpRequestCard key={item.id} item={item} status={status} onResolve={handleResolve} />
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
