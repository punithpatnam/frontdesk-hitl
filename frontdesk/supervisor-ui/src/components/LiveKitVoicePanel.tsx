import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { API_BASE } from '@/config';

interface VoicePanelProps {
  customerId: string;
  enabled?: boolean;
  onEscalation?: (helpRequestId: string) => void;
}

// Ensure/resume AudioContext inside a user gesture so browsers allow audio playback/capture
async function ensureAudioContextRunning(): Promise<void> {
  try {
    // narrow the window typing slightly (avoid explicit `any`)
    const win = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown; livekitAudioContext?: unknown };
    const AudioCtor = (win.AudioContext || win.webkitAudioContext) as unknown as { new (): unknown } | undefined;
    if (!AudioCtor) return;

    // Create a temp context and resume it so browser will allow subsequent audio operations
    const ctx = new AudioCtor();
    // resume() and state are runtime features on the created context; use safe access
    // @ts-expect-error - runtime AudioContext-like object
    if (ctx && typeof ctx.resume === 'function' && ctx.state !== 'running') {
      // @ts-expect-error - runtime AudioContext-like object
      await ctx.resume();
    }
    // Cache it lightly for reuse
    // attach for reuse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (win as any).livekitAudioContext = (win as any).livekitAudioContext || ctx;
  } catch {
    // non-fatal - ignore errors when trying to create/resume AudioContext
  }
}

export function LiveKitVoicePanel({ customerId, onEscalation }: VoicePanelProps) {
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [enabled, setEnabled] = useState<boolean>(false);
  // Removed unused muted/onHold state
  const [seconds, setSeconds] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    // Fetch LiveKit token from backend
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(
          `${API_BASE}/livekit/token?identity=${customerId}`,
          { method: 'GET' }
        );
        if (!response.ok) {
          throw new Error(`Failed to get LiveKit token (${response.status})`);
        }
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Token fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchToken();
  }, [customerId]);

  // use a simple effect to advance the call timer while running
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    if (running) {
      id = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [running]);

  // reference onEscalation to avoid unused var warning (no-op)
  useEffect(() => {
    if (typeof onEscalation === 'function') {
      // noop: available for future escalation flows
    }
  }, [onEscalation]);

  if (loading) {
    return (
      <div style={{
        padding: "40px 20px",
        textAlign: "center",
        background: "var(--bg-secondary)",
        borderRadius: 12,
        border: "1px solid var(--border-light)"
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "3px solid var(--border-light)",
          borderTopColor: "#000000",
          borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 1s linear infinite"
        }}></div>
        <div style={{
          fontSize: "16px",
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: 0
        }}>
          Connecting to voice agent...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "32px 20px",
        textAlign: "center",
        background: "#ffffff",
        borderRadius: 12,
        border: "2px solid #000000",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)"
      }}>
        <div style={{
          width: 48,
          height: 48,
          background: "#000000",
          borderRadius: "50%",
          margin: "0 auto 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          color: "#ffffff"
        }}>
          ⚠️
        </div>
        
        <h3 style={{
          fontSize: "18px",
          fontWeight: 600,
          color: "#000000",
          margin: "0 0 8px"
        }}>
          Connection Error
        </h3>
        
        <p style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          margin: "0 0 20px",
          lineHeight: 1.5
        }}>
          Unable to connect to the voice agent. This usually means the backend server isn't running.
        </p>
        
        <div style={{
          padding: "16px",
          background: "var(--bg-secondary)",
          borderRadius: 8,
          border: "1px solid var(--border-light)",
          marginBottom: "20px",
          textAlign: "left"
        }}>
          <h4 style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#000000",
            margin: "0 0 8px"
          }}>
            To fix this:
          </h4>
          <ol style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            margin: 0,
            paddingLeft: "20px",
            lineHeight: 1.6
          }}>
            <li>Make sure the backend server is running on <code style={{ background: "var(--bg-tertiary)", padding: "2px 4px", borderRadius: 3 }}>http://localhost:8000</code></li>
            <li>Check that the LiveKit token endpoint is configured</li>
            <li>Verify your network connection</li>
          </ol>
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: "12px 24px",
            background: "#000000",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#404040";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#000000";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{
        padding: "40px 20px",
        textAlign: "center",
        background: "var(--bg-secondary)",
        borderRadius: 12,
        border: "1px solid var(--border-light)"
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "3px solid var(--border-light)",
          borderTopColor: "#000000",
          borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 1s linear infinite"
        }}></div>
        <div style={{
          fontSize: "16px",
          fontWeight: 500,
          color: "var(--text-primary)",
          margin: 0
        }}>
          Initializing voice connection...
        </div>

        {/* Show enable mic button to satisfy browser audio policy */}
        <div style={{ marginTop: 16 }}>
          <button
            onClick={async () => {
              // resume/create audio context in user gesture
              await ensureAudioContextRunning();
              setEnabled(true);
              // start timer when enabling audio/connect
              setRunning(true);
            }}
            style={{
              padding: "10px 18px",
              background: "#000000",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Enable microphone
          </button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={enabled}
      audio={true}
      video={false}
      onDisconnected={() => console.log('Disconnected from voice agent')}
      className="voice-room"
    >
      <VoiceAssistantUI seconds={seconds} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}


// Internal component for voice assistant UI
type VoiceAssistantUIProps = {
  seconds: number;
};

function VoiceAssistantUI({ seconds }: VoiceAssistantUIProps) {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <div style={{
      padding: "32px 20px",
      textAlign: "center",
      background: "#ffffff",
      borderRadius: 16,
      border: "1px solid var(--border-light)",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)"
    }}>
      {/* Visualizer */}
      <div style={{
        marginBottom: "24px",
        padding: "20px",
        background: "var(--bg-secondary)",
        borderRadius: 12,
        border: "1px solid var(--border-light)"
      }}>
        <BarVisualizer
          state={state}
          barCount={5}
          trackRef={audioTrack}
          style={{
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />
      </div>
      
      {/* Call Card Header */}
      <div className="card shadow-sm p-4 mb-4" style={{ textAlign: 'left', borderRadius: 16 }}>
        <div className="d-flex align-items-center mb-3">
          <span className={`avatar-glow${state === 'speaking' ? ' speaking' : ''} me-3`}>
            <div className="caller-avatar bg-primary text-white d-flex align-items-center justify-content-center" style={{ width: 64, height: 64, borderRadius: '50%', fontSize: 32 }}>🎤</div>
          </span>
          <div>
            <div className="fw-bold fs-5">Virtual Assistant</div>
            <div className="text-muted">Connected • <span className="call-timer badge bg-light text-dark ms-1">{formatTime(seconds)}</span></div>
          </div>
        </div>
        {state === 'speaking' && (
          <div className="ai-wave-container w-100 mt-2">
            <div className="ai-wave">
              <svg viewBox="0 0 400 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="aiWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d6efd" />
                    <stop offset="100%" stopColor="#6610f2" />
                  </linearGradient>
                </defs>
                <path className="ai-wave-path" d="M0,30 Q100,10 200,30 T400,30 V40 H0 Z" fill="url(#aiWaveGradient)" />
              </svg>
            </div>
          </div>
        )}

        {/* Status */}
      <div style={{
          marginTop: 6,
          padding: "12px",
          background: state === 'listening' ? "#111827" : "var(--bg-secondary)",
          borderRadius: 8,
          border: state === 'listening' ? "none" : "1px solid var(--border-light)"
      }}>
        <div style={{
          fontSize: "16px",
          fontWeight: 600,
            color: state === 'listening' ? "#ffffff" : "var(--text-primary)",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        }}>
          {String(state) === 'listening' && (
            <>
              <span style={{ fontSize: "20px" }}>🎤</span>
              Listening...
            </>
          )}
          {String(state) === 'thinking' && (
            <>
              <div style={{
                width: 16,
                height: 16,
                border: "2px solid var(--border-light)",
                borderTopColor: "#000000",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              Processing...
            </>
          )}
          {String(state) === 'speaking' && (
            <>
              <span style={{ fontSize: "20px" }}>🗣️</span>
              Agent speaking...
            </>
          )}
          {String(state) === 'idle' && (
            <>
              <span style={{ fontSize: "20px" }}>💬</span>
              Ready to help
            </>
          )}
        </div>
      </div>

      {/* ...no controls, only avatar, timer, and wave... */}

      {/* Instructions */}
      <div style={{
        padding: "16px",
        background: "var(--bg-secondary)",
        borderRadius: 8,
        border: "1px solid var(--border-light)"
      }}>
        <p style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          margin: 0,
          lineHeight: 1.5
        }}>
          Speak naturally - the agent will help you or escalate to a supervisor if needed.
        </p>
      </div>
      </div>
    </div>
  );
}

// small helper to format seconds -> mm:ss
function formatTime(s: number) {
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}
