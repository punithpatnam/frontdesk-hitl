import { useState } from 'react';
import { LiveKitVoicePanel } from '../components/LiveKitVoicePanel';
export function CallerPage() {
  const [customerId] = useState(() => `caller-${Date.now()}`);
  const [callActive, setCallActive] = useState(false);
  const [callEnabled, setCallEnabled] = useState(false);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100" style={{ background: 'linear-gradient(135deg,#e0e7ff 0%,#f8fafc 100%)' }}>
      {!callActive && (
        <div className="text-center w-100" style={{ maxWidth: 420 }}>
          <div className="mb-4">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: 96, height: 96, fontSize: 40 }}>🎤</div>
          </div>
          <h1 className="fw-bold mb-3" style={{ fontSize: 36 }}>Voice Assistant</h1>
          <div className="card shadow-sm mb-4" style={{ borderRadius: 18 }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">How it works</h5>
              <ul className="list-unstyled text-start mb-0" style={{ fontSize: 16 }}>
                <li className="mb-2 d-flex align-items-center"><span className="me-2 text-success">1.</span>Click <b>Start Voice Call</b> to connect</li>
                <li className="mb-2 d-flex align-items-center"><span className="me-2 text-success">2.</span>Allow microphone permission when prompted</li>
                <li className="mb-2 d-flex align-items-center"><span className="me-2 text-success">3.</span>Wait for AI Agent to join</li>
                <li className="mb-2 d-flex align-items-center"><span className="me-2 text-success">4.</span>Speak your question naturally</li>
                <li className="mb-2 d-flex align-items-center"><span className="me-2 text-success">5.</span>AI will answer or escalate to supervisor if needed</li>
              </ul>
            </div>
          </div>
          <button className="btn btn-success btn-lg px-5 py-3 shadow" style={{ fontSize: 20, borderRadius: 32 }} onClick={() => { setCallActive(true); setCallEnabled(true); }}>
            Start Call
          </button>
        </div>
      )}
      {callActive && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(30,41,59,0.85)', zIndex: 9999 }}>
          <div className="w-100" style={{ maxWidth: 400 }}>
            <LiveKitVoicePanel customerId={customerId} enabled={callEnabled} />
            <button className="btn btn-danger w-100 mt-4 py-3 fw-bold" style={{ fontSize: 18, borderRadius: 24 }} onClick={() => setCallActive(false)}>
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
