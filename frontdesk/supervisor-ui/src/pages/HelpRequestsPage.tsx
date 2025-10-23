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
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Help Requests</h1>
            <p className="page-subtitle">Manage and resolve customer inquiries</p>
          </div>
          
          {loading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Section */}
      <div className="page-controls">
        <div className="controls-left">
          <div className="form-group">
            <label className="form-label">Status Filter</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value as HelpRequestStatus)}
              className="status-filter"
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>
          </div>
          
          {status === "pending" && (
            <div className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                className="refresh-checkbox"
              />
              <span className="refresh-label">Auto-refresh every 3s</span>
            </div>
          )}
        </div>
        
        <div className="controls-right">
          <div className="request-count">
            <div className={`count-indicator ${status === "pending" ? "active" : ""}`}></div>
            <span className="count-text">{items.length} {status} requests</span>
          </div>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="requests-grid">
        {items?.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">No {status} requests found</h3>
            <p className="empty-description">
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
