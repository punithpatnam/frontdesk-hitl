import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCallState } from '@/hooks/useCallState';

export function FloatingCallWidget() {
  const { callState, endCall, toggleMute } = useCallState();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // Auto-minimize when not on voice page
  useEffect(() => {
    if (location.pathname !== '/caller') {
      setIsMinimized(true);
    }
  }, [location.pathname]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    toggleMute();
  };

  const handleEndCall = () => {
    endCall();
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!callState.isActive) return null;

  return (
    <div className={`floating-call-widget ${isMinimized ? 'minimized' : ''} ${isExpanded ? 'expanded' : ''}`}>
      {isMinimized ? (
        <div className="call-minimized" onClick={() => setIsMinimized(false)}>
          <div className="call-status-indicator">
            <div className={`status-dot ${callState.isConnected ? 'connected' : 'connecting'}`}></div>
            <span className="call-duration">{formatDuration(callState.callDuration)}</span>
          </div>
          <div className="call-info">
            <span className="call-title">Voice Call</span>
            <span className="call-subtitle">{callState.customerId}</span>
          </div>
        </div>
      ) : (
        <div className="call-expanded">
          <div className="call-header">
            <div className="call-title-section">
              <div className="call-avatar">
                <span className="avatar-text">{callState.customerId?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div className="call-details">
                <h4 className="call-title">Voice Call</h4>
                <p className="call-subtitle">{callState.customerId}</p>
                <div className="call-status">
                  <div className={`status-dot ${callState.isConnected ? 'connected' : 'connecting'}`}></div>
                  <span className="status-text">
                    {callState.isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                  <span className="call-duration">{formatDuration(callState.callDuration)}</span>
                </div>
              </div>
            </div>
            <div className="call-controls-header">
            <button 
              className="control-btn minimize-btn" 
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
              <div className="minimize-icon"></div>
            </button>
            <button 
              className="control-btn expand-btn" 
              onClick={handleExpand}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}></div>
            </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="call-details-expanded">
              <div className="call-info-item">
                <span className="info-label">Room:</span>
                <span className="info-value">{callState.roomName}</span>
              </div>
              <div className="call-info-item">
                <span className="info-label">Customer ID:</span>
                <span className="info-value">{callState.customerId}</span>
              </div>
              <div className="call-info-item">
                <span className="info-label">AI Agent:</span>
                <span className={`info-value ${callState.agentConnected ? 'agent-connected' : 'agent-disconnected'}`}>
                  {callState.agentConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              {callState.agentConnected && (
                <div className="call-info-item">
                  <span className="info-label">Agent Status:</span>
                  <span className={`info-value ${callState.agentSpeaking ? 'agent-speaking' : 'agent-listening'}`}>
                    {callState.agentSpeaking ? 'Speaking' : 'Listening'}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className="call-controls">
            <button 
              className={`control-btn mute-btn ${callState.isMuted ? 'muted' : ''}`}
              onClick={handleMuteToggle}
              title={callState.isMuted ? "Unmute" : "Mute"}
            >
              <div className={`mic-icon ${callState.isMuted ? 'muted' : ''}`}></div>
            </button>
            <button 
              className="control-btn end-call-btn"
              onClick={handleEndCall}
              title="End Call"
            >
              <div className="end-call-icon"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
