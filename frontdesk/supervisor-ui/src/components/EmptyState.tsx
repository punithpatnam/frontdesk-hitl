export function EmptyState({ label }: { label: string }) {
  return (
    <div className="card" style={{ textAlign:"center", color:"var(--text-tertiary)", fontSize: 14 }}>
      {label}
    </div>
  );
}
