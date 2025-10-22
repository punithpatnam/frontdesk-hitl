# 🔧 Voice Not Working? Complete Troubleshooting Guide

## 🎤 Voice Recording Issue Diagnosis

If clicking the LiveKit voice button shows no errors but voice isn't being recorded, follow these steps:

---

## ✅ Step 1: Check Browser Console

Open browser DevTools (F12) and look for these console messages when you click "Join Voice Room":

### Expected Console Output:
```
🎤 Requesting microphone permission...
✅ Microphone permission granted
🔑 Got LiveKit token: { url: "...", room: "...", identity: "..." }
✅ Connected to LiveKit room
👥 Local participant: demo-caller
🎙️ Enabling microphone...
✅ Microphone track published: TR_XXXXXX
👥 Participants in room: []
📤 Local track published: audio microphone
```

### If You See These Errors:

#### ❌ "Microphone permission denied"
**Problem:** Browser blocked microphone access  
**Solution:**
1. Click the 🔒 lock icon in browser address bar
2. Set "Microphone" to "Allow"
3. Refresh page (Ctrl+R)
4. Try joining again

#### ❌ "NotAllowedError: Permission denied"
**Problem:** System-level microphone blocked  
**Solution (Windows):**
1. Press Win + I (Settings)
2. Go to Privacy & Security → Microphone
3. Turn ON "Let apps access your microphone"
4. Turn ON "Let desktop apps access your microphone"
5. Restart browser

#### ❌ "Connection failed" or "WebSocket error"
**Problem:** Backend LiveKit server not running  
**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not, start the backend server
cd ../../  # Go to backend directory
python -m uvicorn main:app --reload
```

---

## ✅ Step 2: Verify Microphone Is Working

### Test in Browser:
1. Go to: https://mictests.com/
2. Click "Test Microphone"
3. Speak - you should see audio levels moving
4. If not working → Fix Windows microphone first

### Test in Windows:
1. Right-click speaker icon in taskbar
2. Click "Sound settings"
3. Under "Input", select your microphone
4. Speak and watch the blue bar move
5. If no movement → Check device drivers

---

## ✅ Step 3: Check LiveKit Backend Configuration

The backend needs a working LiveKit server. Verify:

```python
# In your backend code, check:
LIVEKIT_URL = "ws://localhost:7880"  # or wss://your-livekit-server.com
LIVEKIT_API_KEY = "your-api-key"
LIVEKIT_API_SECRET = "your-api-secret"
```

### Test Token Endpoint:
```bash
# Should return valid token
curl http://localhost:8000/livekit/token?identity=test&room=test-room
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "url": "ws://localhost:7880",
  "identity": "test",
  "room": "test-room"
}
```

---

## ✅ Step 4: Check Agent Is In The Room

**CRITICAL:** For voice to work, **an agent must be connected to the same LiveKit room**.

### Is Your Agent Running?
```bash
# Check if agent process is running
ps aux | grep agent  # Linux/Mac
Get-Process | Select-String "agent"  # Windows PowerShell
```

### Agent Must:
1. ✅ Connect to same LiveKit room (e.g., "frontdesk-demo")
2. ✅ Subscribe to user's audio track
3. ✅ Publish its own audio track (for speaking back)
4. ✅ Process audio through speech-to-text
5. ✅ Generate responses with text-to-speech

### Check Agent Logs:
Look for these messages in agent logs:
```
✅ Connected to LiveKit room: frontdesk-demo
👤 User joined: demo-caller
📻 Subscribed to audio track from demo-caller
🎙️ Receiving audio chunks...
```

If agent is **NOT** connected:
- Your microphone works ✅
- LiveKit connection works ✅  
- BUT: No one is listening! 🔇

---

## ✅ Step 5: Verify Audio Track Publishing

After joining, check console for:
```
📤 Local track published: audio microphone
✅ Microphone track published: TR_ABC123
```

If missing:
1. Microphone permission was denied
2. No microphone device found
3. Another app is using microphone (close Zoom/Teams/Discord)

---

## ✅ Step 6: Test With LiveKit Playground

Visit: https://meet.livekit.io/

1. Enter your LiveKit URL: `ws://localhost:7880`
2. Generate a token with your API key/secret
3. Join a room
4. Check if microphone works there
5. If YES → Problem is in your app code
6. If NO → Problem is LiveKit server configuration

---

## 🔍 Common Issues & Solutions

### Issue 1: "Connected but agent doesn't respond"
**Cause:** Agent not running or in different room  
**Fix:**
```bash
# Start agent with same room name
python agent.py --room frontdesk-demo
```

### Issue 2: "Can't hear agent voice"
**Cause:** Browser autoplay policy blocked audio  
**Symptoms:** Console shows "⚠️ Audio autoplay blocked"  
**Fix:** Click anywhere on page to enable audio playback

### Issue 3: "Microphone icon shows muted"
**Cause:** Track not published  
**Fix:** Click "🔇 Unmute" button to enable

### Issue 4: "Room connection drops frequently"
**Cause:** Network issues or LiveKit server overloaded  
**Fix:** Check network stability, restart LiveKit server

### Issue 5: "Echo or feedback noise"
**Cause:** Speakers too close to microphone  
**Fix:** Use headphones instead of speakers

---

## 🧪 Quick Debugging Commands

Run these in browser console while connected:

```javascript
// Check room connection
console.log("Connected:", room?.state);

// Check local microphone track
const micTrack = room?.localParticipant?.getTrackPublication("microphone");
console.log("Mic track:", micTrack?.track?.mediaStreamTrack?.enabled);

// Check participants
console.log("Participants:", Array.from(room?.remoteParticipants?.values() || []).map(p => p.identity));

// Check audio context state
console.log("AudioContext:", new AudioContext().state);
```

---

## 📊 Complete Diagnostic Checklist

Run through this checklist:

- [ ] ✅ Browser microphone permission granted
- [ ] ✅ Windows microphone permission enabled
- [ ] ✅ Microphone device works (test at mictests.com)
- [ ] ✅ Backend server running (localhost:8000)
- [ ] ✅ LiveKit token endpoint returns valid token
- [ ] ✅ LiveKit server running (localhost:7880 or cloud)
- [ ] ✅ Console shows "Connected to LiveKit room"
- [ ] ✅ Console shows "Microphone track published"
- [ ] ✅ Agent is running and connected to same room
- [ ] ✅ Agent logs show "Subscribed to audio track"
- [ ] ✅ No other app using microphone (Zoom, Teams, Discord)
- [ ] ✅ Speakers/headphones working for audio playback
- [ ] ✅ Browser autoplay enabled (click page if needed)

---

## 🎯 Most Likely Causes

Based on "no errors but not recording":

### 1. **Agent Not Running** (80% likely)
- Frontend connects ✅
- Microphone publishes ✅
- BUT: No agent listening = No response

**Fix:** Start the agent process

### 2. **Wrong Room Name** (10% likely)
- You join room "frontdesk-demo"
- Agent joins room "production-room"
- You're in different rooms!

**Fix:** Match room names exactly

### 3. **Microphone Permission Silent Fail** (5% likely)
- Permission requested but user clicked "Block" too fast
- Track publishes but with no data

**Fix:** Check browser permission settings

### 4. **Audio Context Suspended** (5% likely)
- Browser policy requires user interaction before audio
- Track publishes but audio context suspended

**Fix:** Click anywhere on page after joining

---

## 🔧 Emergency Reset

If nothing works:

```bash
# 1. Close all browser tabs
# 2. Stop all processes
pkill -f "agent"
pkill -f "uvicorn"

# 3. Restart everything
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Agent
cd agent
python agent.py --room frontdesk-demo

# Terminal 3: Frontend
cd supervisor-ui
npm run dev

# 4. Open fresh browser tab (Ctrl+Shift+N for incognito)
# 5. Go to http://localhost:5173
# 6. Allow microphone when prompted
# 7. Join room
```

---

## 📞 Still Not Working?

Collect this diagnostic info:

1. **Browser console logs** (full output from clicking "Join")
2. **Backend logs** (from uvicorn terminal)
3. **Agent logs** (from agent terminal)
4. **Browser:** Chrome/Firefox/Safari + version
5. **OS:** Windows/Mac/Linux + version
6. **Microphone test result** from mictests.com

Share these logs to diagnose the exact issue!

---

## ✅ Expected Working Flow

When everything works correctly:

```
USER SIDE (Browser):
1. 🎤 Click "Join Voice Room"
2. 🔐 Allow microphone permission
3. 🔗 Connect to LiveKit room
4. 📤 Publish microphone audio track
5. 🗣️ Speak into microphone
6. ⏳ Wait for agent response
7. 🔊 Hear agent's voice through speakers

AGENT SIDE (Backend):
1. 👂 Listen in LiveKit room
2. 📻 Subscribe to user's audio track
3. 🎙️ Receive audio chunks
4. 📝 Convert speech to text (STT)
5. 🤖 Generate response (LLM)
6. 🗣️ Convert text to speech (TTS)
7. 📡 Publish audio track back to room
8. ✅ User hears response
```

---

## 🎓 Understanding LiveKit Voice Flow

```
Your Microphone → Browser → LiveKit Server → Agent
                                ↓
Your Speakers  ← Browser ← LiveKit Server ← Agent
```

**All links must work** for voice to function!

If **any** link is broken:
- ❌ Microphone blocked → No audio sent
- ❌ LiveKit connection failed → No audio transmitted
- ❌ Agent not running → No one listening
- ❌ Agent not responding → No audio returned
- ❌ Browser autoplay blocked → Can't hear response

---

**Pro Tip:** The most common issue is **agent not running**. Always check agent logs first!
