import { useEffect } from "react";

export function Toast({ message, variant, onClose }: { message: string; variant: "ok" | "err"; onClose: () => void; }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = variant === "ok" 
    ? {
        background: "var(--success-600)",
        borderLeft: "4px solid var(--success-700)"
      }
    : {
        background: "var(--error-600)",
        borderLeft: "4px solid var(--error-700)"
      };

  return (
    <div style={{
      position: "fixed",
      right: 20,
      bottom: 20,
      ...styles,
      color: "#fff",
      padding: "14px 18px",
      borderRadius: 10,
      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      minWidth: "280px",
      maxWidth: "400px",
      fontSize: "14px",
      fontWeight: 500,
      animation: "slideIn 0.3s ease-out",
      zIndex: 9999
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{variant === "ok" ? "✓" : "✕"}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
