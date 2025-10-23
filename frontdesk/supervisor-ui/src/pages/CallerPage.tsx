import { useState } from 'react';
import { useCallState } from '@/hooks/useCallState';

export function CallerPage() {
  const [customerId] = useState(() => `caller-${Date.now()}`);
  const [roomName] = useState('frontdesk-demo');
  const { callState, startCall, endCall, toggleMute } = useCallState();

  const handleStartCall = async () => {
    await startCall(customerId, roomName);
  };

  const handleEndCall = () => {
    endCall();
  };

  const handleMuteToggle = () => {
    toggleMute();
  };

  const testAudio = () => {
    // Create a test audio context to check if audio is working
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
    
    console.log('🔊 Test audio played - if you heard a beep, audio is working');
  };

  return (
    <div className="voice-page">
      <div className="voice-container">
        <div className="voice-header">
          <div className="voice-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1C13.1 1 14 1.9 14 3V11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11V3C10 1.9 10.9 1 12 1Z" fill="currentColor"/>
              <path d="M19 10V11C19 15.4 15.4 19 11 19H13V21H11C6.6 21 3 17.4 3 13V10H5V11C5 16.5 9.5 21 15 21H17V19H15C10.6 19 7 15.4 7 11V10H9V11C9 14.3 11.7 17 15 17C18.3 17 21 14.3 21 11V10H19Z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="voice-title">Voice Assistant</h1>
          <p className="voice-subtitle">Connect with our AI agent for instant help</p>
        </div>
        
        <div className="voice-controls">
          <div className="call-interface">
            <div className="call-inputs">
              <div className="form-group">
                <label className="form-label">Customer ID</label>
                <input 
                  type="text" 
                  className="input" 
                  value={customerId} 
                  readOnly
                  style={{ background: 'var(--bg-tertiary)' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={roomName} 
                  readOnly
                  style={{ background: 'var(--bg-tertiary)' }}
                />
              </div>
            </div>
            
            {!callState.isActive ? (
              <button 
                className="btn btn-primary btn-lg start-call-btn" 
                onClick={handleStartCall}
              >
                <span className="btn-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1C13.1 1 14 1.9 14 3V11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11V3C10 1.9 10.9 1 12 1Z" fill="currentColor"/>
                    <path d="M19 10V11C19 15.4 15.4 19 11 19H13V21H11C6.6 21 3 17.4 3 13V10H5V11C5 16.5 9.5 21 15 21H17V19H15C10.6 19 7 15.4 7 11V10H9V11C9 14.3 11.7 17 15 17C18.3 17 21 14.3 21 11V10H19Z" fill="currentColor"/>
                  </svg>
                </span>
                Start Voice Call
              </button>
            ) : (
              <div className="call-status-panel">
                <div className="status-header">
                  <div className="status-indicator">
                    <div className={`status-dot ${callState.isConnected ? 'connected' : 'connecting'}`}></div>
                    <span className="status-text">
                      {callState.isConnected ? 'Connected' : 'Connecting...'}
                    </span>
                  </div>
                  <div className="call-duration">
                    {Math.floor(callState.callDuration / 60).toString().padStart(2, '0')}:
                    {(callState.callDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                
                <div className="call-message">
                  {callState.statusMessage}
                </div>
                
                {/* Agent Connection Status */}
                <div className="agent-status-section">
                  <h4 className="agent-status-title">AI Agent Status</h4>
                  <div className="agent-status-card">
                    <div className="agent-status-header">
                    <div className="agent-avatar">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9.5C15 10.3 14.3 11 13.5 11H10.5C9.7 11 9 10.3 9 9.5V7.5L3 7V9L9 9.5V11.5C9 12.3 9.7 13 10.5 13H13.5C14.3 13 15 12.3 15 11.5V9.5L21 9ZM12 7.5C13.4 7.5 14.5 8.6 14.5 10C14.5 11.4 13.4 12.5 12 12.5C10.6 12.5 9.5 11.4 9.5 10C9.5 8.6 10.6 7.5 12 7.5ZM6 14H18C19.1 14 20 14.9 20 16V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V16C4 14.9 4.9 14 6 14Z" fill="currentColor"/>
                      </svg>
                    </div>
                      <div className="agent-info">
                        <div className="agent-name">AI Assistant</div>
                        <div className={`agent-status ${callState.agentConnected ? 'connected' : 'disconnected'}`}>
                          <div className={`agent-status-dot ${callState.agentConnected ? 'connected' : 'disconnected'}`}></div>
                          <span className="agent-status-text">
                            {callState.agentConnected ? 'Connected & Ready' : 'Not Connected'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {callState.agentConnected && (
                      <div className="agent-activity">
                        <div className="activity-indicator">
                          <div className={`activity-dot ${callState.agentSpeaking ? 'speaking' : 'listening'}`}></div>
                          <span className="activity-text">
                            {callState.agentSpeaking ? 'Agent is speaking...' : 'Agent is listening...'}
                          </span>
                        </div>
                        {callState.agentSpeaking && (
                          <div className="audio-debug">
                            <div className="debug-info">
                              <span className="debug-label">🔊 Audio Status:</span>
                              <span className="debug-value">Agent audio should be playing</span>
                            </div>
                            <div className="debug-tips">
                              <p><strong>If you can't hear the agent:</strong></p>
                              <ul>
                                <li>Check your system volume</li>
                                <li>Check browser audio permissions</li>
                                <li>Try refreshing the page</li>
                                <li>Check browser console for errors</li>
                              </ul>
                              <button 
                                className="btn btn-sm btn-info" 
                                onClick={testAudio}
                                style={{ marginTop: 'var(--space-2)' }}
                              >
                                🔊 Test Audio
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!callState.agentConnected && (
                      <div className="agent-waiting">
                        <div className="waiting-message">
                          <span className="waiting-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.6 20 4 16.4 4 12S7.6 4 12 4 20 7.6 20 12 16.4 20 12 20M12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="currentColor"/>
                            </svg>
                          </span>
                          <span>Waiting for AI Agent to join...</span>
                        </div>
                        <div className="waiting-tips">
                          <p>Make sure:</p>
                          <ul>
                            <li>Backend server is running</li>
                            <li>AI Agent bot is started</li>
                            <li>Agent is connected to room: <code>{roomName}</code></li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="call-controls">
                  <button 
                    className={`btn ${callState.isMuted ? 'btn-error' : 'btn-success'}`}
                    onClick={handleMuteToggle}
                  >
                    <span className="btn-icon">
                      {callState.isMuted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 1C13.1 1 14 1.9 14 3V11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11V3C10 1.9 10.9 1 12 1Z" fill="currentColor"/>
                          <path d="M19 10V11C19 15.4 15.4 19 11 19H13V21H11C6.6 21 3 17.4 3 13V10H5V11C5 16.5 9.5 21 15 21H17V19H15C10.6 19 7 15.4 7 11V10H9V11C9 14.3 11.7 17 15 17C18.3 17 21 14.3 21 11V10H19Z" fill="currentColor"/>
                          <path d="M2 2L22 22L20.6 23.4L1.4 4.2L2 2Z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 1C13.1 1 14 1.9 14 3V11C14 12.1 13.1 13 12 13C10.9 13 10 12.1 10 11V3C10 1.9 10.9 1 12 1Z" fill="currentColor"/>
                          <path d="M19 10V11C19 15.4 15.4 19 11 19H13V21H11C6.6 21 3 17.4 3 13V10H5V11C5 16.5 9.5 21 15 21H17V19H15C10.6 19 7 15.4 7 11V10H9V11C9 14.3 11.7 17 15 17C18.3 17 21 14.3 21 11V10H19Z" fill="currentColor"/>
                        </svg>
                      )}
                    </span>
                    {callState.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button 
                    className="btn btn-error" 
                    onClick={handleEndCall}
                  >
                    <span className="btn-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9C10.3 9 9 10.3 9 12S10.3 15 12 15 15 13.7 15 12 13.7 9 12 9M20 12C20 16.4 16.4 20 12 20S4 16.4 4 12 7.6 4 12 4 20 7.6 20 12M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.6 20 4 16.4 4 12S7.6 4 12 4 20 7.6 20 12 16.4 20 12 20M15.5 8.5L14.1 7.1L12 9.2L9.9 7.1L8.5 8.5L10.6 10.6L8.5 12.7L9.9 14.1L12 12L14.1 14.1L15.5 12.7L13.4 10.6L15.5 8.5Z" fill="currentColor"/>
                      </svg>
                    </span>
                    End Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="voice-instructions">
          <h3 className="instructions-title">How it works</h3>
          <div className="instructions-list">
            <div className="instruction-item">
              <span className="step-number">1</span>
              <span className="step-text">Click <strong>Start Voice Call</strong> to connect</span>
            </div>
            <div className="instruction-item">
              <span className="step-number">2</span>
              <span className="step-text">Allow microphone permission when prompted</span>
            </div>
            <div className="instruction-item">
              <span className="step-number">3</span>
              <span className="step-text">Wait for AI Agent to join</span>
            </div>
            <div className="instruction-item">
              <span className="step-number">4</span>
              <span className="step-text">Speak your question naturally</span>
            </div>
            <div className="instruction-item">
              <span className="step-number">5</span>
              <span className="step-text">AI will answer or escalate to supervisor if needed</span>
            </div>
          </div>
        </div>
        
        <div className="voice-requirements">
          <h4 className="requirements-title">Before starting:</h4>
          <div className="requirements-list">
            <div className="requirement-item">
              <span className="requirement-icon">🔗</span>
              <span className="requirement-text">Backend running: <code>http://localhost:8000/health</code></span>
            </div>
            <div className="requirement-item">
              <span className="requirement-icon">🤖</span>
              <span className="requirement-text">AI Agent bot connected to room: <code>frontdesk-demo</code></span>
            </div>
            <div className="requirement-item">
              <span className="requirement-icon">🌐</span>
              <span className="requirement-text">LiveKit server accessible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
