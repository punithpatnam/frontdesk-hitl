# 🔧 FRONTEND LIVEKIT FIX - URGENT

## ✅ Good News
Your frontend HAS LiveKit packages installed:
- ✅ @livekit/components-react: ^2.9.15
- ✅ livekit-client: ^2.15.11
- ✅ @livekit/components-styles: ^1.1.6
- ✅ LiveKit components exist in your code

## ❌ Problems Found

### **Problem 1: Wrong Environment Variable Name**
Your `.env` file has:
```env
VITE_API_BASE=http://localhost:8000  ❌ WRONG NAME
```

Should be:
```env
VITE_API_BASE_URL=http://localhost:8000  ✅ CORRECT
```

### **Problem 2: Empty LiveKit URL**
Your `.env` file has:
```env
VITE_LIVEKIT_URL=  ❌ EMPTY!
```

Should be:
```env
VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud  ✅ CORRECT
```

---

## 🚀 IMMEDIATE FIX

### Step 1: Update `.env` File

Open this file in your frontend:
```
C:\Users\punit\FrontDesk\frontdesk-assessment\frontdesk\supervisor-ui\.env
```

Replace the entire content with:
```env
# API Backend
VITE_API_BASE_URL=http://localhost:8000

# LiveKit WebSocket URL
VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud
```

### Step 2: Restart Your Frontend

```powershell
# Stop the frontend (Ctrl+C if running)
# Then restart:
cd C:\Users\punit\FrontDesk\frontdesk-assessment\frontdesk\supervisor-ui
npm run dev
```

### Step 3: Hard Reload in Browser

After frontend restarts:
1. Open browser DevTools (F12)
2. Hold `Ctrl + Shift + R` (hard reload to clear cache)
3. Or right-click reload button → "Empty Cache and Hard Reload"

---

## 🧪 Test After Fix

### Test 1: Check Environment Variables Loaded
Open browser console and type:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
console.log(import.meta.env.VITE_LIVEKIT_URL);
```

**Expected output:**
```
http://localhost:8000
wss://frontdesk-hitl-wx3g7nnr.livekit.cloud
```

If you see `undefined`, you need to restart the frontend.

### Test 2: Test Token Fetch
In browser console:
```javascript
fetch(`${import.meta.env.VITE_API_BASE_URL}/livekit/token?identity=test-user`)
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected:** Token object with `token`, `url`, `identity`, `room`

### Test 3: Try Voice Connection
1. Open the caller/voice page in your frontend
2. Grant microphone permission when prompted
3. Agent should greet you: "Hello! I'm here to help you..."

---

## 📋 Complete Startup Checklist

Make sure ALL of these are running:

- [ ] **Terminal 1:** Backend FastAPI
  ```powershell
  cd C:\Users\punit\FrontDesk\frontdesk-assessment\backend
  .\start-dev.ps1
  ```
  **Verify:** http://localhost:8000/health returns OK

- [ ] **Terminal 2:** LiveKit Agent Worker
  ```powershell
  cd C:\Users\punit\FrontDesk\frontdesk-assessment\backend
  python agent_bot.py dev
  ```
  **Verify:** Shows "registered worker" and stays running

- [ ] **Terminal 3:** Frontend
  ```powershell
  cd C:\Users\punit\FrontDesk\frontdesk-assessment\frontdesk\supervisor-ui
  npm run dev
  ```
  **Verify:** Shows localhost URL (e.g., http://localhost:5173)

- [ ] **Frontend `.env` fixed:** Both variables set correctly

- [ ] **Browser:** Hard reload after .env changes

---

## 🐛 If Still Not Working

### Check Browser Console Errors

Common errors and fixes:

**Error:** `undefined is not an object (evaluating 'import.meta.env.VITE_API_BASE_URL')`
- **Fix:** Restart frontend after changing `.env`

**Error:** `Failed to fetch` or `CORS error`
- **Fix:** Backend not running on port 8000

**Error:** `WebSocket connection failed`
- **Fix:** `VITE_LIVEKIT_URL` is empty or wrong

**Error:** `401 Unauthorized` from LiveKit
- **Fix:** Backend LiveKit credentials wrong in `backend/app/config.py`

**Error:** `getUserMedia not allowed`
- **Fix:** Grant microphone permission in browser settings

---

## 📝 Quick Copy-Paste Commands

### Fix .env file (PowerShell):
```powershell
cd C:\Users\punit\FrontDesk\frontdesk-assessment\frontdesk\supervisor-ui

# Backup old .env
Copy-Item .env .env.backup

# Create new .env
@"
# API Backend
VITE_API_BASE_URL=http://localhost:8000

# LiveKit WebSocket URL
VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud
"@ | Set-Content .env

# Show the new file
Get-Content .env
```

### Restart everything:
```powershell
# Terminal 1: Backend
cd C:\Users\punit\FrontDesk\frontdesk-assessment\backend
.\start-dev.ps1

# Terminal 2: Agent (in new terminal)
cd C:\Users\punit\FrontDesk\frontdesk-assessment\backend
python agent_bot.py dev

# Terminal 3: Frontend (in new terminal)
cd C:\Users\punit\FrontDesk\frontdesk-assessment\frontdesk\supervisor-ui
npm run dev
```

---

## ✅ After Fixing

You should see:
1. ✅ Frontend loads without errors
2. ✅ LiveKit voice panel appears
3. ✅ Microphone permission requested
4. ✅ Agent greets you with voice
5. ✅ Voice visualizer shows activity
6. ✅ You can speak and agent responds

---

## 🎯 Summary

**Main Issues:**
1. `.env` variable name was `VITE_API_BASE` instead of `VITE_API_BASE_URL`
2. `VITE_LIVEKIT_URL` was empty
3. Frontend needs restart after .env changes

**Fix:**
- Update `.env` with correct variable names and values
- Restart frontend
- Hard reload browser

**The LiveKit agent is working - it's just the frontend config that needs fixing!** 🚀
