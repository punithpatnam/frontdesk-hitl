import { useEffect, useState } from 'react';

interface TranscriptLine {
  id: string;
  speaker: 'user' | 'ai' | 'system';
  text: string;
  confidence?: number; // 0..1
}

interface Props {
  onEscalate?: (id: string) => void;
}

export function TranscriptionPanel({ onEscalate }: Props) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [inputEditId, setInputEditId] = useState<string | null>(null);

  // simulate an AI intro message on mount
  useEffect(() => {
    setLines([
      {
        id: 'sys-1',
        speaker: 'system',
        text: "Hello — I'm the AI Assistant. I can answer questions, fetch info, or escalate to a human.",
        confidence: 0.98,
      },
    ]);
  }, []);

  function addUserLine(text: string) {
    const id = `u-${Date.now()}`;
    setLines((s) => [...s, { id, speaker: 'user', text, confidence: 0.95 }]);
    // fake AI reply
    setTimeout(() => {
      const aid = `a-${Date.now()}`;
      setLines((s) => [...s, { id: aid, speaker: 'ai', text: `I heard: "${text}" — here's a helpful reply.`, confidence: 0.88 }]);
    }, 800);
  }

  function updateLine(id: string, text: string) {
    setLines((s) => s.map(l => l.id === id ? { ...l, text } : l));
  }

  return (
    <div style={{ width: '100%', marginTop: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Transcript</div>
      <div style={{ background: '#fff', borderRadius: 10, padding: 12, maxHeight: 260, overflowY: 'auto', border: '1px solid #e6e8eb' }}>
        {lines.map(line => (
          <div key={line.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{line.speaker === 'user' ? 'You' : line.speaker === 'ai' ? 'Assistant' : 'System'}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{typeof line.confidence === 'number' ? `conf ${(line.confidence*100).toFixed(0)}%` : ''}</div>
            </div>
            {inputEditId === line.id ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <input style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #e5e7eb' }} defaultValue={line.text} onBlur={(e) => { updateLine(line.id, e.currentTarget.value); setInputEditId(null); }} />
              </div>
            ) : (
              <div style={{ marginTop: 6, fontSize: 14 }}>{line.text}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => { addUserLine('Can you tell me my next appointment?'); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc' }}>Quick: Next appointment</button>
        <button onClick={() => { addUserLine('What are your hours?'); }} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f8fafc' }}>Quick: Hours</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => onEscalate?.(`escalate-${Date.now()}`)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff' }}>Escalate</button>
      </div>
    </div>
  );
}

export default TranscriptionPanel;
