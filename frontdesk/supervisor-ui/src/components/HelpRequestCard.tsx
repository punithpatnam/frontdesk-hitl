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
    <div style={{
      background: "#ffffff",
      border: "1px solid var(--border-light)",
      borderRadius: 16,
      padding: "24px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      transition: "all 0.2s ease",
      position: "relative"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.08)";
      e.currentTarget.style.borderColor = "var(--border-medium)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
      e.currentTarget.style.borderColor = "var(--border-light)";
    }}
    >
      {/* Status Indicator */}
      <div style={{
        position: "absolute",
        top: 16,
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 6
      }}>
        <span className={`badge ${item.status}`} style={{
          fontSize: "12px",
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: 20
        }}>
          {item.status}
        </span>
        <div className="small mono" style={{ 
          color: "var(--text-tertiary)",
          fontSize: "11px",
          fontWeight: 500
        }}>
          #{item.id.slice(0, 8)}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ 
          fontWeight: 600, 
          fontSize: "18px", 
          marginBottom: 12, 
          color: "#000000",
          lineHeight: 1.4,
          paddingRight: 120
        }}>
          {item.question}
        </h3>
        
        <div style={{ 
          display: "flex", 
          gap: 16, 
          alignItems: "center", 
          flexWrap: "wrap",
          marginBottom: 16
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border-light)"
          }}>
            <div style={{
              width: 6,
              height: 6,
              background: "#000000",
              borderRadius: "50%"
            }}></div>
            <span style={{ 
              fontSize: "13px", 
              fontWeight: 500,
              color: "var(--text-primary)"
            }}>
              {item.customer_id}
            </span>
          </div>
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            background: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border-light)"
          }}>
            <span style={{ fontSize: "12px" }}>🕒</span>
            <span style={{ 
              fontSize: "13px", 
              fontWeight: 500,
              color: "var(--text-secondary)"
            }}>
              {since}
            </span>
          </div>
        </div>
      </div>

      {status === "pending" ? (
        <>
          <div style={{
            height: 1,
            background: "var(--border-light)",
            margin: "20px 0",
            borderRadius: 1
          }} />
          <div style={{
            padding: "20px",
            background: "var(--bg-secondary)",
            borderRadius: 12,
            border: "1px solid var(--border-light)"
          }}>
            <h4 style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#000000",
              margin: "0 0 16px"
            }}>
              Resolve Request
            </h4>
            <ResolveForm
              defaultResolver="supervisor-1"
              onSubmit={(answer, resolver) => onResolve(item.id, answer, resolver)}
            />
          </div>
        </>
      ) : null}
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
