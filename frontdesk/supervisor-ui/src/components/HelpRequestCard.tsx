import type { HelpRequest } from "@/types/helpRequests";
import { ResolveForm } from "./ResolveForm";

export function HelpRequestCard({
  item,
  status,
  onResolve,
}: {
  item: HelpRequest;
  status: "pending" | "resolved" | "unresolved";
  onResolve: (id: string, answer: string, resolver: string) => Promise<void>;
}) {
  const created = new Date(item.created_at);
  const since = timeSince(created);

  return (
    <div className={`help-request-card ${status}`}>
      {/* Header */}
      <div className="card-header">
        <div className="request-meta">
          <div className="customer-info">
            <div className="customer-avatar">
              {item.customer_id?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="customer-details">
              <span className="customer-id">{item.customer_id}</span>
              <span className="request-time">{since}</span>
            </div>
          </div>
        </div>
        
        <div className="request-status">
          <span className={`badge badge-${item.status}`}>
            {item.status}
          </span>
          <span className="request-id">#{item.id.slice(0, 8)}</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="card-content">
        <h3 className="question-text">
          {item.question}
        </h3>
      </div>

      {status === "pending" && (
        <div className="resolve-section">
          <div className="resolve-header">
            <h4 className="resolve-title">Resolve Request</h4>
            <div className="resolve-indicator">
              <div className="indicator-dot"></div>
              <span>Needs attention</span>
            </div>
          </div>
          <ResolveForm
            defaultResolver="supervisor-1"
            onSubmit={(answer, resolver) => onResolve(item.id, answer, resolver)}
          />
        </div>
      )}
    </div>
  );
}

function timeSince(d: Date) {
  const secs = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
