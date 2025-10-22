import { useState } from "react";

export function ResolveForm({
  defaultResolver,
  onSubmit,
}: {
  defaultResolver: string;
  onSubmit: (answer: string, resolver: string) => Promise<void>;
}) {
  const [answer, setAnswer] = useState("");
  const [resolver, setResolver] = useState(defaultResolver);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(answer.trim(), resolver.trim());
      setAnswer("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display:"grid", gap:12 }}>
      <label>
        <div className="label">Answer</div>
        <textarea className="input" rows={4} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type the answer to send to the caller…" style={{ resize: "vertical", marginTop: 4 }} />
      </label>
      <label>
        <div className="label">Resolver</div>
        <input className="input" value={resolver} onChange={e => setResolver(e.target.value)} style={{ marginTop: 4 }} />
      </label>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn" type="button" onClick={() => setAnswer("")} disabled={submitting}>Clear</button>
        <button className="btn btn-primary" type="submit" disabled={submitting || !answer.trim()}>
          {submitting ? "Submitting…" : "Submit Answer"}
        </button>
      </div>
    </form>
  );
}
