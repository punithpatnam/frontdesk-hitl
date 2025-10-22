export function Pagination({
  hasNext,
  loading,
  onNext,
  onRefresh,
}: {
  hasNext: boolean;
  loading: boolean;
  onNext: () => void;
  onRefresh: () => void;
}) {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "flex-end", 
      gap: 12,
      paddingTop: 24,
      borderTop: "1px solid var(--border-light)",
      marginTop: 24
    }}>
      <button 
        onClick={onRefresh} 
        disabled={loading}
        style={{
          padding: "12px 20px",
          border: "1px solid var(--border-light)",
          borderRadius: 8,
          background: "#ffffff",
          color: "var(--text-primary)",
          fontSize: "14px",
          fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.background = "var(--bg-tertiary)";
            e.currentTarget.style.borderColor = "var(--border-medium)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "var(--border-light)";
          }
        }}
        title="Refresh current page"
      >
        <div style={{
          width: 16,
          height: 16,
          border: "2px solid var(--border-light)",
          borderTopColor: loading ? "#000000" : "var(--text-secondary)",
          borderRadius: "50%",
          animation: loading ? "spin 1s linear infinite" : "none"
        }}></div>
        {loading ? "Loading..." : "Refresh"}
      </button>
      
      <button 
        onClick={onNext} 
        disabled={!hasNext || loading}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: 8,
          background: hasNext && !loading ? "#000000" : "var(--bg-tertiary)",
          color: hasNext && !loading ? "#ffffff" : "var(--text-tertiary)",
          fontSize: "14px",
          fontWeight: 600,
          cursor: (hasNext && !loading) ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
        onMouseEnter={(e) => {
          if (hasNext && !loading) {
            e.currentTarget.style.background = "#404040";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
          }
        }}
        onMouseLeave={(e) => {
          if (hasNext && !loading) {
            e.currentTarget.style.background = "#000000";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
        title="Load next page"
      >
        {hasNext ? "Next Page" : "No More Items"}
        {hasNext && (
          <span style={{ fontSize: "12px" }}>→</span>
        )}
      </button>
    </div>
  );
}
