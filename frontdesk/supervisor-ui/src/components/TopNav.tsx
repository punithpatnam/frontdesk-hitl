import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { listHelpRequests, markAllHelpRequestsSeen } from "@/api/helpRequests";
import type { HelpRequest } from "@/types/helpRequests";

export function TopNav() {
  const { pathname } = useLocation();
  const Tab = ({ to, label, showDot, onClick, icon }: { 
    to: string; 
    label: string; 
    showDot?: boolean; 
    onClick?: () => void;
    icon?: React.ReactNode;
  }) => {
    const isActive = pathname === to;
    return (
      <Link 
        to={to} 
        className={`nav-tab ${isActive ? 'active' : ''}`}
        onClick={onClick}
      >
        {icon && <span className="nav-icon">{icon}</span>}
        <span className="nav-label">{label}</span>
        {showDot && <span className="nav-dot"></span>}
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
    <nav className="top-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="nav-logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-title">Frontdesk</span>
              <span className="logo-subtitle">Supervisor</span>
            </div>
          </div>
        </div>
        
        <div className="nav-tabs">
          <Tab to="/" label="Requests" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
            </svg>
          } />
          <Tab to="/learned" label="Knowledge" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          } />
          <Tab to="/history" label="History" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3C8 3 4 7 4 12H1L4.9 15.9L8.8 12H5C5 8.1 8.1 5 12 5S19 8.1 19 12 15.9 19 12 19C10.3 19 8.8 18.2 7.8 17L6.2 18.6C7.6 20.3 9.7 21.5 12 21.5C17.5 21.5 22 17 22 12S17.5 2.5 12 2.5V3M12 8V12L15.2 15.2L16.6 13.8L14 11.2V8H12Z" fill="currentColor"/>
            </svg>
          } showDot={hasUnseen} onClick={async () => {
            if (hasUnseen) {
              await markAllHelpRequestsSeen();
              setHasUnseen(false);
            }
          }} />
          <Tab to="/caller" label="Voice" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1C13.1 1 14 1.9 14 3V11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11V3C10 1.9 10.9 1 12 1Z" fill="currentColor"/>
              <path d="M19 10V11C19 15.4 15.4 19 11 19H13V21H11C6.6 21 3 17.4 3 13V10H5V11C5 16.5 9.5 21 15 21H17V19H15C10.6 19 7 15.4 7 11V10H9V11C9 14.3 11.7 17 15 17C18.3 17 21 14.3 21 11V10H19Z" fill="currentColor"/>
            </svg>
          } />
          <Tab to="/supervisor" label="Dashboard" icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
            </svg>
          } />
        </div>
        
        <div className="nav-actions">
          {/* Voice controls moved to Voice page */}
        </div>
      </div>
    </nav>
  );
}
