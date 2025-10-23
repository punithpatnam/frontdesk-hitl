# Frontdesk Engineering Test: Human-in-the-Loop AI Supervisor

A complete implementation of a human-in-the-loop system for AI agents that can escalate to human supervisors, learn from interactions, and improve over time.

## 🎯 Project Overview

This system implements a complete human-in-the-loop workflow where an AI agent can:
- Handle customer calls and respond to known questions
- Escalate unknown questions to human supervisors
- Learn from supervisor responses and update its knowledge base
- Follow up with customers automatically

## 🏗️ Architecture

- **Backend**: FastAPI-based Python service with Firestore database
- **Frontend**: React/TypeScript supervisor dashboard
- **Voice Integration**: LiveKit for real-time voice communication
- **AI**: OpenAI integration with intelligent escalation
- **Database**: Google Firestore for help requests and knowledge base

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Google Cloud Project with Firestore enabled
- LiveKit account
- OpenAI API key

### Backend Setup

1. **Clone and navigate to backend**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # or
   source .venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual credentials:
   - Google Cloud project ID
   - LiveKit server details
   - OpenAI API key

5. **Set up Google Cloud credentials**:
   - Download your service account key JSON file
   - Place it in the backend directory
   - Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

6. **Start development server**:
   ```bash
   # Using PowerShell script
   .\start-dev.ps1
   
   # Or manually
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend**:
   ```bash
   cd frontdesk/supervisor-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your actual API URLs

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `FIRESTORE_PROJECT_ID`: Your Google Cloud project ID
- `LIVEKIT_URL`: Your LiveKit server WebSocket URL
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `OPENAI_API_KEY`: OpenAI API key for AI assistance

#### Frontend (.env)
- `VITE_API_BASE_URL`: Backend API URL (e.g., http://localhost:8000)
- `VITE_LIVEKIT_URL`: LiveKit WebSocket URL

## 🛡️ Security

**IMPORTANT**: This project has been configured for GitHub with proper security measures:

- ✅ Sensitive files are ignored by git
- ✅ Service account keys are excluded
- ✅ Environment files are templated
- ✅ No hardcoded credentials in code

**Before deploying**:
1. Set up proper environment variables
2. Use Google Cloud service account authentication
3. Configure LiveKit with proper access controls
4. Secure your OpenAI API key

## 📁 Project Structure

```
├── backend/                 # FastAPI backend service
│   ├── app/                # Application code
│   ├── .env.example        # Environment template
│   └── requirements.txt    # Python dependencies
├── frontdesk/supervisor-ui/ # React frontend
│   ├── src/               # Source code
│   ├── .env.example       # Environment template
│   └── package.json       # Node dependencies
└── .gitignore            # Git ignore rules
```

## 🔄 Development Workflow

1. **Start Firestore emulator** (optional for local development):
   ```bash
   cd backend
   .\start-emulator.ps1
   ```

2. **Start backend**:
   ```bash
   .\start-dev.ps1
   ```

3. **Start frontend**:
   ```bash
   cd frontdesk/supervisor-ui
   npm run dev
   ```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure no secrets are committed
5. Submit a pull request

## 🎯 Design Decisions & Architecture

### Help Request Lifecycle
- **Model**: HelpRequest entity with clear state transitions (PENDING → RESOLVED/UNRESOLVED)
- **Timeout Handling**: 5-minute timeout with automatic escalation to UNRESOLVED
- **Data Structure**: Firestore document with customer info, question, timestamp, and resolution

### Knowledge Base Design
- **Learning System**: Automatic KB updates when supervisors provide answers
- **Confidence Scoring**: Questions with high confidence (exact matches) vs. low confidence (escalations)
- **Scalability**: Designed to handle 10-1000 requests/day with efficient querying

### System Architecture
- **Modular Design**: Separate services for Agent, Help Requests, and Knowledge Base
- **Event-Driven**: Clean separation between AI responses, escalations, and follow-ups
- **Error Handling**: Robust error handling with graceful degradation

### Key Features Implemented
1. **AI Agent**: LiveKit integration with salon knowledge base
2. **Escalation Flow**: "Let me check with my supervisor" → Help request creation
3. **Supervisor Dashboard**: View pending requests, submit answers, see history
4. **Automatic Follow-up**: AI texts back customers when supervisor responds
5. **Knowledge Learning**: Updates KB with new information from supervisor responses

## 🎥 Demo Video

[Record a short screen recording demonstrating:]
- How the system works end-to-end
- Key design decisions and trade-offs
- Areas for future improvement

## 🚀 Future Improvements

- **Scaling**: Implement proper queuing for high-volume scenarios
- **Analytics**: Add metrics for escalation patterns and learning effectiveness
- **Integration**: Real SMS/phone integration instead of console logging
- **Advanced AI**: Implement more sophisticated confidence scoring and learning algorithms

## 📄 License

[Add your license information here]
