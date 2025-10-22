# LiveKit Voice Agent Troubleshooting Guide

## 🔍 Diagnostic Questions to Ask About Your Frontend

Please answer these questions so I can help you debug why the LiveKit agent isn't working:

### 1. **What is your frontend technology?**
- [ ] React (with Vite)
- [ ] React (with Create React App)
- [ ] Next.js
- [ ] Plain HTML/JavaScript
- [ ] Vue.js
- [ ] Other: _______________

### 2. **Where is your frontend code located?**
- Path: _______________
- Is it in a separate repository?
- Is it in the same `frontdesk-assessment` folder but different directory?

### 3. **What LiveKit packages did you install?**
- [ ] `@livekit/components-react`
- [ ] `livekit-client`
- [ ] `@livekit/components-styles`
- [ ] Other: _______________

### 4. **What error messages are you seeing?**
- Browser console errors: _______________
- Network tab errors: _______________
- UI error messages: _______________

### 5. **Can you access the backend API?**
Test this in browser: `http://localhost:8000/health`
- [ ] Yes, returns `{"status": "ok", ...}`
- [ ] No, connection refused
- [ ] Other error: _______________

### 6. **Can you get a LiveKit token?**
Test this in browser: `http://localhost:8000/livekit/token?identity=test-user`
- [ ] Yes, returns a token
- [ ] No, 500 error
- [ ] No, other error: _______________

### 7. **Is your frontend connecting to the backend?**
- What's your frontend URL? (e.g., `http://localhost:5173`)
- What's your backend URL in frontend config? _______________
- Are you seeing CORS errors in browser console?

### 8. **Is the LiveKit agent worker running?**
- [ ] Yes, `python agent_bot.py dev` is running in Terminal 2
- [ ] No, it stopped/crashed
- [ ] Not sure
- What output do you see? _______________

---

## 🚨 Common Issues and Solutions

### Issue 1: "Failed to get LiveKit token" in Frontend

**Symptoms:**
- Frontend shows error when trying to connect
- Browser console shows 404 or 500 error on `/livekit/token`

**Debug Steps:**

1. **Check backend is running:**
```powershell
# Open browser and visit:
http://localhost:8000/health
```
Expected: `{"status": "ok", "version": "0.1.0", ...}`

2. **Test token endpoint directly:**
```powershell
# In PowerShell:
Invoke-RestMethod -Uri "http://localhost:8000/livekit/token?identity=test-user" -Method Get
```
Expected: `{"token": "eyJ...", "url": "wss://...", ...}`

3. **Check CORS configuration:**
If frontend is on `localhost:5173`, verify `app/main.py` has:
```python
allow_origins=[
    "http://localhost:5173",  # ← Your frontend URL
    # ...
]
```

**Fix:**
- Start backend: `.\start-dev.ps1` in Terminal 1
- Update CORS in `app/main.py` if using different port
- Restart backend after CORS changes

---

### Issue 2: Agent Worker Not Responding

**Symptoms:**
- Frontend connects but no voice interaction
- Agent doesn't speak greeting
- No audio visualization

**Debug Steps:**

1. **Check agent is running:**
```powershell
# Terminal 2 should show:
# "Worker started" or similar message
# NOT: "Worker shutting down"
```

2. **Check agent logs:**
Look for errors in Terminal 2 output:
- `ModuleNotFoundError` → Missing packages
- `401 Unauthorized` → Wrong API credentials
- `RuntimeError` → Environment variables not set

3. **Verify agent environment variables:**
```powershell
# In agent_bot.py, these are set:
os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
os.environ["LIVEKIT_API_KEY"] = settings.LIVEKIT_API_KEY
os.environ["LIVEKIT_API_SECRET"] = settings.LIVEKIT_API_SECRET
os.environ["LIVEKIT_URL"] = settings.LIVEKIT_URL
```

**Fix:**
```powershell
# Stop agent (Ctrl+C in Terminal 2)
# Reinstall packages:
pip install livekit livekit-agents livekit-plugins-openai pyjwt

# Restart agent:
python agent_bot.py dev
```

---

### Issue 3: WebSocket Connection Failed

**Symptoms:**
- Browser console shows: `WebSocket connection to 'wss://...' failed`
- Network tab shows failed WebSocket connection
- Frontend stuck on "Connecting..."

**Debug Steps:**

1. **Check LiveKit URL format:**
In `app/config.py`, verify:
```python
LIVEKIT_URL: str = "wss://frontdesk-hitl-wx3g7nnr.livekit.cloud"  # ✅ Correct (wss://)
# NOT: "https://..." ❌ Wrong
```

2. **Check frontend .env:**
```env
VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud  # ✅ Must match backend
```

3. **Verify token has correct permissions:**
Check token payload includes:
```json
{
  "video": {
    "room": "frontdesk-demo",
    "roomJoin": true,
    "canPublish": true,
    "canSubscribe": true
  }
}
```

**Fix:**
- Ensure `LIVEKIT_URL` starts with `wss://` (not `https://`)
- Restart frontend after changing `.env`
- Clear browser cache and reload

---

### Issue 4: Agent Connects but No Audio

**Symptoms:**
- LiveKit room connects successfully
- No errors in console
- Agent doesn't speak, no microphone input detected

**Debug Steps:**

1. **Check browser microphone permissions:**
- Browser should prompt for microphone access
- Check browser settings → Site permissions → Microphone
- Allow microphone for your frontend URL

2. **Check browser console for audio errors:**
```
getUserMedia error: NotAllowedError
getUserMedia error: NotFoundError  # No microphone
```

3. **Verify LiveKitRoom configuration:**
```tsx
<LiveKitRoom
  token={token}
  serverUrl={import.meta.env.VITE_LIVEKIT_URL}
  connect={true}
  audio={true}      // ✅ Must be true
  video={false}     // ✅ Set to false for voice-only
  // ...
>
```

**Fix:**
- Grant microphone permissions in browser
- Test microphone works: Visit `https://www.onlinemictest.com/`
- Use HTTPS (not HTTP) for production - browsers require HTTPS for microphone

---

### Issue 5: "Room not found" or 401 Unauthorized

**Symptoms:**
- Connection fails with 401 or 404
- Token seems valid but connection rejected

**Debug Steps:**

1. **Check LiveKit credentials in `app/config.py`:**
```python
LIVEKIT_URL: str = "wss://frontdesk-hitl-wx3g7nnr.livekit.cloud"
LIVEKIT_API_KEY: str = "APIUvN7k9KJKXdG"
LIVEKIT_API_SECRET: str = "mNhIun7ALKfL3a8L7lh1Sj0sUskGHVg4fb1ov7j07GW"
```

2. **Verify credentials are valid:**
- Log in to LiveKit Cloud dashboard
- Check project is active
- Verify API key/secret match

3. **Check token generation:**
```powershell
# Get a token and decode it at jwt.io
Invoke-RestMethod -Uri "http://localhost:8000/livekit/token?identity=test" -Method Get
```

**Fix:**
- Update credentials in `app/config.py`
- Restart backend after credential changes
- Restart agent worker after credential changes

---

### Issue 6: Agent Immediately Shuts Down

**Symptoms:**
- Terminal 2 shows "Worker started" then "Worker shutting down"
- Agent doesn't stay running

**Debug Steps:**

1. **Run agent in foreground to see full error:**
```powershell
python agent_bot.py dev
# Watch the full output - don't run in background
```

2. **Common errors:**
```
ModuleNotFoundError: No module named 'livekit'
→ Fix: pip install livekit livekit-agents livekit-plugins-openai

ImportError: cannot import name 'openai' from 'livekit.plugins'
→ Fix: pip install --upgrade livekit-plugins-openai

OpenAI API key not set
→ Fix: Check settings.OPENAI_API_KEY in config.py

LiveKit credentials invalid
→ Fix: Check LIVEKIT_API_KEY and LIVEKIT_API_SECRET
```

**Fix:**
```powershell
# Reinstall all dependencies:
pip install --upgrade livekit livekit-agents livekit-plugins-openai pyjwt openai

# Verify config.py has all required keys
# Restart: python agent_bot.py dev
```

---

## 🧪 Step-by-Step Testing Procedure

### Test 1: Backend Health Check
```powershell
# Open browser:
http://localhost:8000/health
```
✅ **Expected:** `{"status": "ok", "version": "0.1.0", "time_utc": "..."}`

---

### Test 2: LiveKit Token Generation
```powershell
# Open browser:
http://localhost:8000/livekit/token?identity=debug-user
```
✅ **Expected:** 
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "url": "wss://frontdesk-hitl-wx3g7nnr.livekit.cloud",
  "identity": "debug-user",
  "room": "frontdesk-demo"
}
```

---

### Test 3: Agent Worker Running
```powershell
# In Terminal 2, run:
python agent_bot.py dev

# Look for output like:
# "starting worker"
# "registered worker"
# Should NOT see "shutting down"
```
✅ **Expected:** Worker stays running, shows "registered worker"

---

### Test 4: Frontend Can Reach Backend
```javascript
// In browser console (on frontend page):
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```
✅ **Expected:** `{status: "ok", ...}` printed to console  
❌ **If CORS error:** Update `app/main.py` CORS settings

---

### Test 5: Frontend LiveKit Connection
```javascript
// In browser console (on frontend page):
const identity = 'test-' + Date.now();
fetch(`http://localhost:8000/livekit/token?identity=${identity}`)
  .then(r => r.json())
  .then(data => {
    console.log('Token received:', data);
    // Copy this data to verify token format
  })
  .catch(console.error)
```
✅ **Expected:** Token object printed  
❌ **If error:** Backend not running or wrong URL

---

## 📋 Complete Checklist Before Testing

- [ ] **Terminal 1:** FastAPI running on port 8000
  - Command: `.\start-dev.ps1`
  - Output shows: "Uvicorn running on http://127.0.0.1:8000"

- [ ] **Terminal 2:** LiveKit agent worker running
  - Command: `python agent_bot.py dev`
  - Output shows: "registered worker"

- [ ] **Backend health:** http://localhost:8000/health returns OK

- [ ] **Token endpoint:** http://localhost:8000/livekit/token?identity=test returns token

- [ ] **Frontend .env configured:**
  ```env
  VITE_API_BASE_URL=http://localhost:8000
  VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud
  ```

- [ ] **Browser microphone permission:** Allowed for frontend URL

- [ ] **CORS configured:** Frontend URL in `app/main.py` allow_origins

- [ ] **All packages installed:**
  ```powershell
  pip list | findstr livekit
  # Should show: livekit, livekit-agents, livekit-plugins-openai
  ```

---

## 🔧 Quick Fixes Reference

| Problem | Quick Fix |
|---------|-----------|
| Backend not responding | `.\start-dev.ps1` in Terminal 1 |
| Agent not running | `python agent_bot.py dev` in Terminal 2 |
| CORS error | Add frontend URL to `app/main.py` CORS origins |
| "Failed to get token" | Check backend running on port 8000 |
| No audio | Grant microphone permission in browser |
| Worker shuts down | Check Terminal 2 for errors, reinstall packages |
| 401 Unauthorized | Verify LiveKit credentials in `config.py` |
| WebSocket failed | Check `LIVEKIT_URL` starts with `wss://` |

---

## 📞 Share This Information

To help me debug your specific issue, please provide:

1. **Frontend framework and location**
2. **Exact error messages from browser console**
3. **Output from Terminal 2 (agent worker)**
4. **Result of test endpoints above**
5. **Your frontend code** (especially LiveKit integration part)

---

## 🎯 Most Likely Issues

Based on typical problems, check these first:

### 1. Agent Worker Not Running
```powershell
# Terminal 2 must show and keep showing:
python agent_bot.py dev
# Output: "registered worker" (stays running)
```

### 2. Frontend Can't Reach Backend
```
Error: Failed to fetch
CORS policy: No 'Access-Control-Allow-Origin'
```
**Fix:** Add your frontend URL to CORS in `app/main.py`

### 3. Browser Microphone Blocked
```
getUserMedia error: NotAllowedError
```
**Fix:** Click allow when browser asks for microphone permission

### 4. Wrong LiveKit URL Format
```python
# WRONG:
LIVEKIT_URL = "https://frontdesk-hitl-wx3g7nnr.livekit.cloud"

# CORRECT:
LIVEKIT_URL = "wss://frontdesk-hitl-wx3g7nnr.livekit.cloud"
```

---

## 📚 Next Steps

1. Run through the test procedure above
2. Note which test fails first
3. Check the corresponding fix
4. Share your frontend code so I can provide specific help

The agent is ready on the backend - we just need to debug the frontend connection!
