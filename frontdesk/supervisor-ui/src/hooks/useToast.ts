import { useState } from "react";

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const [variant, setVariant] = useState<"ok" | "err">("ok");
  function show(message: string, v: "ok" | "err" = "ok") {
    setVariant(v); setMsg(message);
  }
  return { msg, variant, show, clear: () => setMsg(null) };
}
