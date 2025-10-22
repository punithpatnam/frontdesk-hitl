# Frontend Integration Guide for LiveKit Voice Agent

This guide explains how to integrate the LiveKit voice agent into your frontend application.

## 🎯 Overview

Your backend provides:
- **REST API** on `http://localhost:8000` for help requests and knowledge base
- **LiveKit Voice Agent** that handles real-time voice conversations
- **Token Generation** endpoint for secure LiveKit access

---

## 📦 Frontend Requirements

### 1. Install Dependencies

```bash
npm install @livekit/components-react livekit-client
# or
yarn add @livekit/components-react livekit-client
```

### 2. Environment Variables

Create `.env` file in your frontend:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud
```

---

## 🎤 LiveKit Voice Panel Component

### Basic Implementation

```tsx
// src/components/LiveKitVoicePanel.tsx
import { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';

interface VoicePanelProps {
  customerId: string;
  onEscalation?: (helpRequestId: string) => void;
}

export function LiveKitVoicePanel({ customerId, onEscalation }: VoicePanelProps) {
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Fetch LiveKit token from backend
    const fetchToken = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/livekit/token?identity=${customerId}`,
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error('Failed to get LiveKit token');
        }
        
        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Token fetch error:', err);
      }
    };

    fetchToken();
  }, [customerId]);

  if (error) {
    return (
      <div className="error-container">
        <p>Error connecting to voice agent: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!token) {
    return <div className="loading">Connecting to voice agent...</div>;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={() => console.log('Disconnected from voice agent')}
      className="voice-room"
    >
      <VoiceAssistantUI onEscalation={onEscalation} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// Internal component for voice assistant UI
function VoiceAssistantUI({ onEscalation }: { onEscalation?: (id: string) => void }) {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <div className="voice-assistant-container">
      <div className="visualizer-container">
        <BarVisualizer
          state={state}
          barCount={5}
          trackRef={audioTrack}
          className="voice-visualizer"
        />
      </div>

      <div className="status-container">
        <p className="status-text">
          {state === 'listening' && '🎤 Listening...'}
          {state === 'thinking' && '🤔 Processing...'}
          {state === 'speaking' && '🗣️ Agent speaking...'}
          {state === 'idle' && '💬 Ready to help'}
        </p>
      </div>

      <VoiceAssistantControlBar />

      <p className="hint-text">
        Speak naturally - the agent will help you or escalate to a supervisor if needed.
      </p>
    </div>
  );
}
```

---

## 🔧 API Integration Functions

### Helper Functions for Backend API

```tsx
// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface HelpRequest {
  id: string;
  customer_id: string;
  question: string;
  status: 'pending' | 'resolved' | 'unresolved';
  supervisor_answer?: string;
  created_at: string;
  updated_at: string;
}

// Get LiveKit token
export async function getLiveKitToken(identity: string, room?: string): Promise<{
  token: string;
  url: string;
  identity: string;
  room: string;
}> {
  const params = new URLSearchParams({ identity });
  if (room) params.append('room', room);
  
  const response = await fetch(`${API_BASE}/livekit/token?${params}`);
  if (!response.ok) throw new Error('Failed to get LiveKit token');
  return response.json();
}

// Ask agent a question (REST API alternative)
export async function askAgent(customerId: string, question: string) {
  const response = await fetch(`${API_BASE}/agent/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId, question }),
  });
  
  if (!response.ok) throw new Error('Failed to ask agent');
  return response.json();
}

// List help requests (for supervisor dashboard)
export async function listHelpRequests(
  status?: 'pending' | 'resolved' | 'unresolved',
  limit = 20,
  cursor?: string
): Promise<{ items: HelpRequest[]; next_cursor: string | null }> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (status) params.append('status', status);
  if (cursor) params.append('cursor', cursor);
  
  const response = await fetch(`${API_BASE}/help-requests?${params}`);
  if (!response.ok) throw new Error('Failed to list help requests');
  return response.json();
}

// Get single help request
export async function getHelpRequest(id: string): Promise<HelpRequest> {
  const response = await fetch(`${API_BASE}/help-requests/${id}`);
  if (!response.ok) throw new Error('Failed to get help request');
  return response.json();
}

// Resolve help request (supervisor)
export async function resolveHelpRequest(
  id: string,
  answer: string,
  resolver: string
) {
  const response = await fetch(`${API_BASE}/help-requests/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer, resolver }),
  });
  
  if (!response.ok) throw new Error('Failed to resolve help request');
  return response.json();
}

// Query knowledge base
export async function queryKnowledgeBase(question: string) {
  const response = await fetch(`${API_BASE}/kb/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  
  if (!response.ok) throw new Error('Failed to query knowledge base');
  return response.json();
}
```

---

## 🎨 Example Pages

### 1. Caller Page (Voice Interface)

```tsx
// src/pages/CallerPage.tsx
import { useState } from 'react';
import { LiveKitVoicePanel } from '../components/LiveKitVoicePanel';

export function CallerPage() {
  const [customerId] = useState(() => `caller-${Date.now()}`);
  const [escalatedId, setEscalatedId] = useState<string | null>(null);

  return (
    <div className="caller-page">
      <header>
        <h1>🎤 Salon Support - Voice Assistant</h1>
        <p>Speak to ask about our services, hours, or book an appointment</p>
      </header>

      <main>
        <LiveKitVoicePanel
          customerId={customerId}
          onEscalation={(id) => {
            setEscalatedId(id);
            console.log('Escalated to supervisor, request ID:', id);
          }}
        />

        {escalatedId && (
          <div className="escalation-notice">
            <p>✅ Your question has been escalated to a supervisor.</p>
            <p>We'll get back to you shortly!</p>
            <small>Request ID: {escalatedId}</small>
          </div>
        )}
      </main>
    </div>
  );
}
```

### 2. Supervisor Dashboard

```tsx
// src/pages/SupervisorDashboard.tsx
import { useState, useEffect } from 'react';
import { listHelpRequests, resolveHelpRequest, type HelpRequest } from '../services/api';

export function SupervisorDashboard() {
  const [pendingRequests, setPendingRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [answer, setAnswer] = useState('');
  const [resolver, setResolver] = useState('');

  useEffect(() => {
    loadPendingRequests();
    // Refresh every 10 seconds
    const interval = setInterval(loadPendingRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingRequests = async () => {
    try {
      const data = await listHelpRequests('pending', 50);
      setPendingRequests(data.items);
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest || !answer || !resolver) return;

    try {
      await resolveHelpRequest(selectedRequest.id, answer, resolver);
      alert('✅ Help request resolved and added to knowledge base!');
      setSelectedRequest(null);
      setAnswer('');
      loadPendingRequests();
    } catch (err) {
      alert('❌ Failed to resolve: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="supervisor-dashboard">
      <header>
        <h1>👔 Supervisor Dashboard</h1>
        <p>{pendingRequests.length} pending request(s)</p>
      </header>

      <div className="dashboard-layout">
        <aside className="requests-sidebar">
          <h2>Pending Requests</h2>
          {pendingRequests.length === 0 ? (
            <p>No pending requests</p>
          ) : (
            <ul className="requests-list">
              {pendingRequests.map((req) => (
                <li
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={selectedRequest?.id === req.id ? 'selected' : ''}
                >
                  <strong>{req.customer_id}</strong>
                  <p>{req.question}</p>
                  <small>{new Date(req.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="resolution-panel">
          {selectedRequest ? (
            <>
              <h2>Resolve Request</h2>
              <div className="request-details">
                <p><strong>Customer:</strong> {selectedRequest.customer_id}</p>
                <p><strong>Question:</strong> {selectedRequest.question}</p>
                <p><strong>Asked:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>

              <div className="form-group">
                <label>Your Name (Resolver):</label>
                <input
                  type="text"
                  value={resolver}
                  onChange={(e) => setResolver(e.target.value)}
                  placeholder="e.g., Jane (Manager)"
                />
              </div>

              <div className="form-group">
                <label>Answer:</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Provide the answer to this customer's question..."
                  rows={5}
                />
              </div>

              <button
                onClick={handleResolve}
                disabled={!answer || !resolver}
                className="btn-primary"
              >
                ✅ Resolve & Add to Knowledge Base
              </button>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a pending request to resolve</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## 🎨 Basic Styling

```css
/* src/styles/voice-panel.css */
.voice-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  margin: 2rem auto;
}

.voice-assistant-container {
  width: 100%;
  text-align: center;
  color: white;
}

.visualizer-container {
  margin: 2rem 0;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-visualizer {
  height: 100%;
}

.status-container {
  margin: 1rem 0;
}

.status-text {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.hint-text {
  margin-top: 1.5rem;
  opacity: 0.8;
  font-size: 0.9rem;
}

.escalation-notice {
  background: #4caf50;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
}

/* Supervisor Dashboard */
.supervisor-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  margin-top: 2rem;
}

.requests-sidebar {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  max-height: 70vh;
  overflow-y: auto;
}

.requests-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.requests-list li {
  background: white;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.requests-list li:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.requests-list li.selected {
  border: 2px solid #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.resolution-panel {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 🚀 Quick Start

### 1. Start Backend Services

**Terminal 1: FastAPI**
```powershell
.\start-dev.ps1
```

**Terminal 2: LiveKit Agent**
```powershell
python agent_bot.py dev
```

### 2. Start Frontend

```bash
npm run dev
# or
yarn dev
```

### 3. Test the Flow

1. **Open Caller Page** → Click "Start Conversation" → Speak a question
2. **Agent responds** with knowledge base answer OR escalates to supervisor
3. **Open Supervisor Dashboard** → See pending requests → Provide answer
4. **Answer is added to KB** → Future callers get instant response

---

## 🔍 Testing Checklist

- [ ] Token generation works: `GET /livekit/token?identity=test-user`
- [ ] Voice connection established (green indicators in UI)
- [ ] Agent responds to known questions (from seeded KB)
- [ ] Agent escalates unknown questions
- [ ] Supervisor sees pending requests
- [ ] Resolve adds answer to KB
- [ ] Next caller gets instant answer from KB

---

## 🐛 Troubleshooting

### Issue: "Failed to get LiveKit token"
- **Solution**: Make sure backend is running on port 8000
- Check: `http://localhost:8000/health`

### Issue: "Connection refused" to LiveKit
- **Solution**: Verify `LIVEKIT_URL` in config.py matches frontend `.env`
- Check credentials: `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`

### Issue: Agent not responding
- **Solution**: Check Terminal 2 shows "Worker started"
- Verify: `python agent_bot.py dev` is running (not just `python agent_bot.py`)

### Issue: No audio
- **Solution**: Browser permissions - allow microphone access
- Check browser console for WebRTC errors

### Issue: CORS errors
- **Solution**: Backend has CORS enabled for `localhost:5173`
- If using different port, update `app/main.py` CORS settings

---

## 📚 Additional Resources

- [LiveKit Components React Docs](https://docs.livekit.io/guides/room/react/)
- [LiveKit Agents Framework](https://docs.livekit.io/agents/)
- [Voice Assistant Guide](https://docs.livekit.io/agents/voice-assistant/)

---

## 🎯 Next Steps

1. Implement the `CallerPage` component
2. Implement the `SupervisorDashboard` component
3. Add real-time updates (polling or WebSockets)
4. Add authentication for supervisor dashboard
5. Deploy to production with proper environment variables

---

**Your backend is ready! Start building the frontend and you'll have a complete HITL system.** 🚀
