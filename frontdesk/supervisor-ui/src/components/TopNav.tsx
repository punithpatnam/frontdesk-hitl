import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LiveKitPanel } from "./LiveKitPanel";
import { listHelpRequests, markAllHelpRequestsSeen } from "@/api/helpRequests";
import type { HelpRequest } from "@/types/helpRequests";

export function TopNav() {
  const { pathname } = useLocation();
  const Tab = ({ to, label, showDot, onClick }: { to: string; label: string; showDot?: boolean; onClick?: () => void }) => {
    const isActive = pathname === to;
    return (
      <Link 
        to={to} 
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: "14px",
          fontWeight: isActive ? 600 : 500,
          color: isActive ? "#ffffff" : "var(--text-secondary)",
          background: isActive ? "#000000" : "transparent",
          textDecoration: "none",
          transition: "all 0.2s ease",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "80px",
          position: "relative"
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
      >
        {label}
        {/* Notification dot removed as requested */}
      </Link>
    );
  };

  // Poll for unseen help requests
  const [hasUnseen, setHasUnseen] = useState(false);
  // Removed unused hasClearedRef
  useEffect(() => {
    let mounted = true;
    async function pollUnseen() {
      try {
        const res = await listHelpRequests({ status: "resolved" });
        if (mounted) {
          const unseen = (res.items || []).filter((it: HelpRequest) => it.seen_by_supervisor === false);
          setHasUnseen(unseen.length === 1);
        }
      } catch { /* ignore errors */ }
    }
    pollUnseen();
    const interval = setInterval(pollUnseen, 10000); // poll every 10s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Clear notification dot only when user navigates to /history
  useEffect(() => {
    // Removed route-based clearing logic. Notification will be cleared only on click.
  }, []);

  return (
    <nav style={{ 
      borderBottom: "1px solid var(--border-light)", 
      background: "var(--bg-primary)",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{ 
        display:"flex", 
        alignItems:"center", 
        gap:24, 
        paddingTop:20, 
        paddingBottom:20,
        maxWidth: "1400px"
      }}>
        <div style={{ 
          fontWeight:800, 
          fontSize: "20px",
          color: "#000000",
          letterSpacing: "-0.8px",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <div style={{
            width: 8,
            height: 8,
            background: "#000000",
            borderRadius: "50%"
          }}></div>
          Frontdesk Supervisor
        </div>
        
        <div style={{ 
          display:"flex", 
          gap:4,
          background: "var(--bg-secondary)",
          padding: 4,
          borderRadius: 12,
          border: "1px solid var(--border-light)"
        }}>
          <Tab to="/" label="Requests" />
          <Tab to="/learned" label="Knowledge" />
          <Tab to="/history" label="History" showDot={hasUnseen} onClick={async () => {
            if (hasUnseen) {
              await markAllHelpRequestsSeen();
              setHasUnseen(false);
            }
          }} />
          <Tab to="/caller" label="Voice" />
          <Tab to="/supervisor" label="Dashboard" />
        </div>
        
        <div style={{ marginLeft:"auto" }}>
          <LiveKitPanel />
        </div>
      </div>
    </nav>
  );
}
