import { useEffect, useState } from "react";
import { API_BASE } from "@/config";

type Health = { status: string; version: string; time_utc: string };

export function HealthBadge() {
  const [h, setH] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function ping() {
    try {
      setErr(null);
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Health;
      setH(json);
    } catch (e: unknown) {
      setErr((e as Error).message || "unreachable");
    }
  }

  useEffect(() => {
    ping();
    const id = setInterval(ping, 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  const ok = h?.status === "ok" && !err;
  const text = ok ? `OK v${h?.version}` : `DOWN${err ? `: ${err}` : ""}`;
  const icon = ok ? "●" : "⚠";

  return (
    <div style={{
      position: "fixed",
      left: 20,
      bottom: 20,
      padding: "8px 14px",
      borderRadius: 9999,
      fontSize: 13,
      fontWeight: 500,
      background: ok ? "#000000" : "#ffffff",
      color: ok ? "#ffffff" : "#000000",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      border: ok ? "none" : "2px solid #000000",
      display: "flex",
      alignItems: "center",
      gap: 6,
      zIndex: 1000
    }}
      title={ok ? `Backend healthy • ${h?.time_utc}` : `Backend error • ${err || "unknown"}`}
    >
      <span style={{ fontSize: 8 }}>{icon}</span>
      <span>API {text}</span>
    </div>
  );
}
