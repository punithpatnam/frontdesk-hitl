# LiveKit Voice Integration Guide

## 🎯 Current Status

The LiveKit panel currently provides **visual demonstration only** - it fetches a token but doesn't actually connect to a LiveKit room or handle audio.

---

## 🎤 To Enable Voice Functionality

### 1. Install LiveKit SDK

```bash
npm install livekit-client
```

### 2. Update LiveKitPanel Component

Replace the current `LiveKitPanel.tsx` with full audio integration:

```tsx
import { useState, useEffect, useRef } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { getLivekitToken } from "@/api/livekit";
import { askAgent, type AgentAskResponse } from "@/api/agent";
import { LIVEKIT_URL } from "@/config";

export function LiveKitPanel() {
  const [identity, setIdentity] = useState("demo-caller");
  const [room, setRoom] = useState("frontdesk-demo");
  const [connected, setConnected] = useState(false);
  const [info, setInfo] = useState<string>("");
  
  // LiveKit room instance
  const roomRef = useRef<Room | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  // Ask box
  const [customerId, setCustomerId] = useState("demo-1");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [asking, setAsking] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  async function join() {
    try {
      // Get token from backend
      const tokenData = await getLivekitToken({ identity, room });
      
      // Create LiveKit room
      const livekitRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up event listeners
      livekitRoom.on(RoomEvent.Connected, () => {
        console.log("Connected to LiveKit room");
        setInfo(`Connected to ${room}`);
        setConnected(true);
      });

      livekitRoom.on(RoomEvent.Disconnected, () => {
        console.log("Disconnected from LiveKit room");
        setConnected(false);
        setInfo("");
      });

      livekitRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log("Track subscribed:", track.kind, "from", participant.identity);
        
        // Handle audio tracks (agent's voice)
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          audioElement.play();
        }
      });

      livekitRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach(el => el.remove());
      });

      // Connect to room
      await livekitRoom.connect(LIVEKIT_URL, tokenData.token);

      // Enable microphone
      await livekitRoom.localParticipant.setMicrophoneEnabled(true);

      roomRef.current = livekitRoom;
      
    } catch (e: unknown) {
      console.error("Failed to join room:", e);
      setInfo((e as Error).message || "Failed to join room");
    }
  }

  function leave() {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnected(false);
    setInfo("");
    setAnswer("");
  }

  async function toggleAudio() {
    if (!roomRef.current) return;
    const newState = !isAudioEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    setIsAudioEnabled(newState);
  }

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setAsking(true);
    setAnswer("");
    try {
      const res: AgentAskResponse = await askAgent({ 
        customer_id: customerId, 
        question: q 
      });
      
      if (res.known) {
        setAnswer(res.answer + renderSemantic(res.similarity, res.kb_id));
      } else {
        setAnswer(`I'll check with my supervisor and get back to you.\n(ref: ${res.help_request_id})`);
      }
    } catch (e: unknown) {
      setAnswer((e as Error).message || "Failed to ask agent");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="row">
      <input 
        className="input" 
        style={{ width:130 }} 
        value={identity} 
        onChange={e => setIdentity(e.target.value)} 
        title="Identity"
        disabled={connected}
      />
      <input 
        className="input" 
        style={{ width:150 }} 
        value={room} 
        onChange={e => setRoom(e.target.value)} 
        title="Room"
        disabled={connected}
      />
      
      {!connected ? (
        <button className="btn btn-primary" onClick={join}>
          🎤 Join Voice Room
        </button>
      ) : (
        <>
          <button className="btn" onClick={leave}>
            📞 Leave
          </button>
          <button 
            className="btn" 
            onClick={toggleAudio}
            style={{ 
              background: isAudioEnabled ? "var(--success-50)" : "var(--error-50)",
              borderColor: isAudioEnabled ? "var(--success-500)" : "var(--error-500)"
            }}
          >
            {isAudioEnabled ? "🎤 Mute" : "🔇 Unmute"}
          </button>
        </>
      )}
      
      {info && (
        <div className="small mono" style={{ 
          maxWidth: 260, 
          color: "var(--text-secondary)" 
        }}>
          {info}
        </div>
      )}

      {/* Ask box */}
      <form onSubmit={onAsk} className="row" style={{ marginLeft:12, gap:6 }}>
        <input 
          className="input" 
          style={{ width:110 }} 
          value={customerId} 
          onChange={e => setCustomerId(e.target.value)} 
          placeholder="Customer ID" 
        />
        <input 
          className="input" 
          style={{ width:240 }} 
          placeholder="Ask a question…" 
          value={question} 
          onChange={e => setQuestion(e.target.value)} 
        />
        <button 
          className="btn btn-primary" 
          type="submit" 
          disabled={!connected || asking}
        >
          {asking ? "Asking…" : "Ask Question"}
        </button>
      </form>

      {/* Answer bubble */}
      {answer && (
        <div className="small" style={{
          maxWidth: 360, 
          marginLeft: 8, 
          padding: "10px 12px", 
          border: "1px solid var(--border-color)",
          borderRadius: 8, 
          background: "var(--bg-secondary)", 
          whiteSpace:"pre-wrap",
          color: "var(--text-primary)",
          lineHeight: 1.5,
          boxShadow: "var(--shadow-sm)"
        }}>
          {answer}
        </div>
      )}
    </div>
  );
}

function renderSemantic(sim: number, kbId: string) {
  const pct = Math.round(sim * 100);
  return `\n\n(semantic match ${pct}% • KB: ${kbId})`;
}
```

---

## 🔧 Configuration Requirements

### 1. Environment Variables

Add to your `.env` file:

```bash
VITE_LIVEKIT_URL=wss://your-livekit-server.com
```

### 2. Backend Requirements

Your backend must:
- ✅ Have LiveKit server running
- ✅ Generate valid access tokens with correct permissions
- ✅ Handle voice agent connections

### 3. Browser Permissions

Users must grant:
- 🎤 Microphone access
- 🔊 Audio playback permission

---

## 📋 Implementation Checklist

### Phase 1: Basic Audio Connection
- [ ] Install `livekit-client` package
- [ ] Update `LiveKitPanel.tsx` with Room connection
- [ ] Test microphone capture
- [ ] Test audio playback from agent

### Phase 2: UI Enhancements
- [ ] Add microphone permission handling
- [ ] Add mute/unmute toggle
- [ ] Show connection status
- [ ] Display audio level indicators
- [ ] Add error recovery

### Phase 3: Advanced Features
- [ ] Add push-to-talk mode
- [ ] Show speaking indicators
- [ ] Add audio quality controls
- [ ] Implement echo cancellation settings
- [ ] Add recording capability

---

## 🎯 Testing Voice Integration

### 1. Test Token Generation
```bash
curl http://localhost:8000/livekit/token \
  -H "Content-Type: application/json" \
  -d '{"identity":"test-user","room":"test-room"}'
```

### 2. Test LiveKit Connection
```javascript
// In browser console after joining
console.log(roomRef.current.state); // Should be 'connected'
console.log(roomRef.current.participants.size); // Number of participants
```

### 3. Test Audio Tracks
```javascript
// Check local tracks
roomRef.current.localParticipant.audioTracks.forEach((track, key) => {
  console.log("Local audio track:", key, track.isMuted);
});

// Check remote tracks
roomRef.current.participants.forEach((participant, key) => {
  console.log("Participant:", key);
  participant.audioTracks.forEach((track, trackKey) => {
    console.log("  Audio track:", trackKey);
  });
});
```

---

## 🐛 Common Issues

### Issue 1: "Permission Denied"
**Solution:** Check browser microphone permissions in browser settings

### Issue 2: No Audio from Agent
**Solution:** 
- Verify agent is publishing audio tracks
- Check browser audio output device
- Look for `TrackSubscribed` event in console

### Issue 3: Echo/Feedback
**Solution:**
- Enable echo cancellation in browser
- Use headphones during testing
- Configure LiveKit noise suppression

### Issue 4: Connection Fails
**Solution:**
- Verify `LIVEKIT_URL` is correct (wss://)
- Check token has correct permissions
- Verify backend LiveKit server is running

---

## 📚 LiveKit Documentation

- **Client SDK**: https://docs.livekit.io/client-sdk-js/
- **Room Events**: https://docs.livekit.io/client-sdk-js/enums/RoomEvent.html
- **Track Management**: https://docs.livekit.io/client-sdk-js/classes/Track.html
- **Audio Capture**: https://docs.livekit.io/client-sdk-js/interfaces/AudioCaptureOptions.html

---

## 🎤 Alternative: Simple Audio Test

For quick testing without full LiveKit integration:

```tsx
// Simple microphone test
function testMicrophone() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      console.log("✅ Microphone access granted");
      
      // Create audio context to visualize
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      function checkVolume() {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
        console.log("Volume level:", volume);
        requestAnimationFrame(checkVolume);
      }
      
      checkVolume();
    })
    .catch(err => {
      console.error("❌ Microphone access denied:", err);
    });
}
```

---

## ⚠️ Important Notes

1. **Current Implementation**: The LiveKit panel is for visual demonstration only
2. **Voice Requires**: Full LiveKit client SDK integration
3. **Backend Dependency**: LiveKit server must be running and configured
4. **Browser Support**: Modern browsers with WebRTC support required
5. **Permissions**: User must grant microphone/audio permissions

---

## 🚀 Next Steps

To enable voice:

1. **Install LiveKit SDK**: `npm install livekit-client`
2. **Update Component**: Use the code above
3. **Configure Backend**: Ensure LiveKit server is running
4. **Test Connection**: Verify token generation works
5. **Grant Permissions**: Allow microphone access in browser
6. **Join Room**: Click "Join Voice Room" button
7. **Speak**: Your voice should transmit to the agent
8. **Listen**: Agent responses should play through speakers

---

**Status**: 📝 Voice integration not implemented (UI demo only)  
**Effort**: ~2-4 hours for basic voice functionality  
**Complexity**: Medium (requires LiveKit SDK knowledge)
