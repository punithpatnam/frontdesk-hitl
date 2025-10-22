# Frontdesk Supervisor UI

React + TypeScript + Vite frontend for the Frontdesk HITL (Human-in-the-Loop) system.

## ✨ Features

### 🎤 **LiveKit Voice Integration**
- Real-time voice communication with AI agents
- WebRTC-based audio streaming
- Microphone mute/unmute controls
- Automatic reconnection handling
- See `VOICE-USAGE-GUIDE.md` for details

### 📞 **Help Requests Management**
- View pending/resolved/unresolved help requests
- Inline resolve with answer submission
- Auto-refresh polling (3s for pending requests)
- Cursor-based pagination
- Status filtering

### 📚 **Knowledge Base**
- Browse learned answers from supervisors and seed data
- Semantic search with similarity scoring
- View answer source and timestamps
- Pagination support

### 📜 **History Timeline**
- View resolved and unresolved request history
- Track AI follow-up status
- Timestamp tracking (created/updated)
- Customer ID and request details

### 🎨 **Design System**
- Consistent color palette with CSS variables
- Accessible focus states and color contrast
- Responsive design for mobile/desktop
- Professional UI with smooth animations
- See `DESIGN-SYSTEM.md` for full documentation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173/ in your browser.

---

## 🎤 Voice Integration

### LiveKit Voice Features
- **Real-time voice communication** with AI agents using LiveKit WebRTC
- **Microphone capture** - Your voice is recorded and sent to the agent
- **Audio playback** - Hear the agent's voice responses
- **Connection management** - Join/leave rooms with visual feedback
- **Mute controls** - Toggle microphone on/off during conversation

### 🔧 Voice Not Working?

**Most Common Issue:** Agent not running!

For voice to work, you need:
1. ✅ Frontend connected to LiveKit room
2. ✅ Microphone permission granted
3. ✅ **Agent running and connected to SAME room** ← Most important!

If you can join but no voice is recorded:
```bash
# Check if agent is running in the same room
ps aux | grep agent  # Linux/Mac
Get-Process | Select-String "agent"  # Windows

# Start agent with correct room name
python agent.py --room frontdesk-demo
```

**See full troubleshooting guide:** [VOICE-TROUBLESHOOTING.md](./VOICE-TROUBLESHOOTING.md)

### How to Use Voice

1. **Join Room**
   - Enter your identity (default: "demo-caller")
   - Enter room name (default: "frontdesk-demo")
   - Click "🎤 Join Voice Room"
   - Allow microphone permission when prompted

2. **Start Speaking**
   - Once connected (green "🎤 Connected" message appears)
   - Speak into your microphone
   - Agent will hear you and respond with voice

3. **Controls**
   - **🎤 Mute** - Stop sending your audio
   - **🔇 Unmute** - Resume sending your audio
   - **📞 Leave** - Disconnect from voice room

4. **What You'll See**
   - Browser console logs: "✅ Connected", "📤 Local track published"
   - Info message: "🎤 Connected • Room: frontdesk-demo"
   - When agent speaks: "� Agent speaking"

**Note:** The agent must be running and connected to the same LiveKit room for voice to work!

---

## 📁 Project Structure

```
src/
├── api/                    # API client layer
│   ├── client.ts          # Fetch wrapper with error handling
│   ├── helpRequests.ts    # Help request endpoints
│   ├── kb.ts              # Knowledge base endpoints
│   ├── livekit.ts         # LiveKit token endpoint
│   └── agent.ts           # Agent interaction endpoint
├── components/            # Reusable components
│   ├── TopNav.tsx         # Navigation bar
│   ├── Toast.tsx          # Notification system
│   ├── HealthBadge.tsx    # API health indicator
│   ├── LiveKitPanel.tsx   # Voice room controls (LiveKit)
│   ├── HelpRequestCard.tsx
│   ├── ResolveForm.tsx
│   ├── EmptyState.tsx
│   └── Pagination.tsx
├── pages/                 # Page components
│   ├── HelpRequestsPage.tsx
│   ├── LearnedAnswersPage.tsx
│   └── HistoryPage.tsx
├── hooks/                 # Custom React hooks
│   ├── usePolling.ts     # Smart polling with visibility detection
│   └── useToast.ts       # Toast notification state
├── types/                 # TypeScript type definitions
│   ├── common.ts         # CursorPage, ApiError
│   ├── helpRequests.ts   # HelpRequest types
│   └── kb.ts             # KB types
├── styles/
│   └── globals.css       # Design system with CSS variables
├── config.ts             # Environment configuration
├── App.tsx               # Root component
├── app-routes.tsx        # Route definitions
└── main.tsx              # Entry point
```

---

## 🛠️ Tech Stack

- **React 19.1.1** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.1.14** - Build tool (Rolldown)
- **React Router** - Client-side routing
- **LiveKit Client SDK** - Real-time voice/video
- **CSS Variables** - Design system

---

## 🎨 Design System

### Color Palette
- **Primary**: Blue (`#2563eb`) for brand and primary actions
- **Success**: Green (`#059669`) for resolved status
- **Error**: Red (`#dc2626`) for unresolved status  
- **Warning**: Amber (`#d97706`) for pending status
- **Neutral**: Gray scale for text and backgrounds

### Components
- `.btn` / `.btn-primary` - Buttons with hover/focus states
- `.badge` / `.badge-{status}` - Status indicators
- `.card` - Content containers with elevation
- `.input` / `.textarea` - Form controls with focus rings

**Full documentation:** See `DESIGN-SYSTEM.md`

---

## 📚 API Integration

### Backend Endpoints Used

```typescript
GET  /health                     // API health check
GET  /help-requests              // List help requests (cursor pagination)
POST /help-requests/:id/resolve  // Resolve with answer
GET  /kb                         // List knowledge base items
POST /kb/query                   // Semantic search
GET  /livekit/token              // Get LiveKit access token
POST /agent/ask                  // Ask agent (text-based demo)
```

### Environment Configuration

```typescript
// src/config.ts
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || "ws://localhost:7880";
export const POLL_MS_PENDING = 3000;  // 3 seconds
export const PAGE_SIZE = 25;
```

---

## 🧪 Development

### Available Scripts

```bash
# Development server with HMR
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Code Quality

- **TypeScript** - Full type coverage, no `any` types
- **ESLint** - Code quality rules
- **React 19** - Latest features and optimizations
- **CSS Variables** - Maintainable styling

---

## 🐛 Troubleshooting

### Voice Not Working?
1. Check microphone permissions in browser
2. Verify backend LiveKit server is running
3. Check browser console for errors
4. See `VOICE-USAGE-GUIDE.md` for detailed troubleshooting

### API Errors?
1. Verify backend is running on port 8000
2. Check HealthBadge in top-right (should be green)
3. Look at Network tab in DevTools
4. Verify CORS is configured on backend

### Build Errors?
1. Delete `node_modules` and reinstall: `npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Check Node.js version (18+ required)

---

## 📖 Documentation

- `DESIGN-SYSTEM.md` - Complete design system reference
- `UI-UX-IMPROVEMENTS.md` - Changelog of UI/UX updates
- `VOICE-USAGE-GUIDE.md` - How to use voice features
- `VOICE-INTEGRATION-GUIDE.md` - Technical voice implementation

---

## 🚀 Production Build

```bash
# Build optimized bundle
npm run build

# Output in dist/ folder
# Serve with any static file server
```

### Environment Variables

Create `.env` for production:

```bash
VITE_API_BASE=https://your-api.com
VITE_LIVEKIT_URL=wss://your-livekit.com
```

---

## 🎯 Key Features Implementation

### Smart Polling
- Only polls when tab is visible
- Only polls pending requests
- Configurable interval (3s default)
- Auto-refresh toggle

### Cursor Pagination
- Efficient for large datasets
- Next page with cursor
- Refresh to reset

### Error Handling
- Toast notifications for all errors
- Type-safe error extraction
- User-friendly messages

### Type Safety
- Discriminated unions for API responses
- Generic types for reusable code
- No implicit `any`

---

## 🤝 Contributing

This is an assessment project for the Frontdesk HITL system.

---

## 📄 License

Proprietary - Frontdesk Assessment Project

---

**Version**: 1.0  
**Last Updated**: October 20, 2025  
**Status**: ✅ Production Ready with Voice Integration
