import { useState, useEffect, useRef } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { getLivekitToken } from "@/api/livekit";

type CallState = "idle" | "connecting" | "talking" | "onHold" | "resolved" | "error";

export function LiveKitPanel() {
  // Room configuration
  const [identity, setIdentity] = useState(`caller-${Date.now()}`);
  const [roomName, setRoomName] = useState("frontdesk-demo");
  
  // Connection state
  const [connected, setConnected] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  
  // LiveKit room instance
  const roomRef = useRef<Room | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  
  // Agent detection
  const [agentConnected, setAgentConnected] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  
  // Transcript/conversation history
  const [transcript, setTranscript] = useState<Array<{ speaker: string; message: string }>>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  // Helper to add transcript
  const addToTranscript = (speaker: string, message: string) => {
    setTranscript(prev => [...prev, { speaker, message }]);
  };

  // Ensure/resume AudioContext in a user gesture so browsers allow audio playback/capture
  async function ensureAudioContextRunning(): Promise<void> {
    try {
      const win = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown; livekitAudioContext?: unknown };
      const AudioCtor = (win.AudioContext || win.webkitAudioContext) as unknown as { new (): unknown } | undefined;
      if (!AudioCtor) return;
      const ctx = new AudioCtor();
      // @ts-expect-error - runtime AudioContext-like
      if (ctx && typeof ctx.resume === 'function' && ctx.state !== 'running') {
        // @ts-expect-error - runtime AudioContext-like
        await ctx.resume();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (win as any).livekitAudioContext = (win as any).livekitAudioContext || ctx;
    } catch {
      // ignore
    }
  }

  async function join() {
    try {
      setCallState("connecting");
      setStatusMessage("Connecting to call...");
      // Ensure audio context is allowed by browser (must be called in user gesture)
      await ensureAudioContextRunning();
      
      // Check microphone permissions first
      try {
        console.log("🎤 Requesting microphone permission...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone permission granted");
        addToTranscript("System", "Microphone access granted");
        
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr) {
        console.error("❌ Microphone permission denied:", permErr);
        setCallState("error");
        setStatusMessage("Microphone access denied");
        addToTranscript("System", "ERROR: Microphone permission denied");
        return;
      }
      
      // Get token from backend
      console.log(`🔑 Requesting token for ${identity} in room ${roomName}...`);
      const tokenData = await getLivekitToken({ identity, room: roomName });
      console.log("✅ Token received:", { url: tokenData.url, room: tokenData.room, identity: tokenData.identity });
      addToTranscript("System", `Joining room: ${tokenData.room}`);
      
      // Create LiveKit room
      const livekitRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Set up event listeners
      livekitRoom.on(RoomEvent.Connected, () => {
        console.log("✅ Connected to LiveKit room");
        console.log("👥 Local participant:", livekitRoom.localParticipant.identity);
        setConnected(true);
        setCallState("talking");
        setStatusMessage("Connected - Speak to AI Agent");
        addToTranscript("System", "✅ Connected to voice room");
      });

      livekitRoom.on(RoomEvent.Disconnected, () => {
        console.log("❌ Disconnected from LiveKit room");
        setConnected(false);
        setCallState("idle");
        setStatusMessage("");
        setAgentConnected(false);
        addToTranscript("System", "Disconnected from call");
      });

      livekitRoom.on(RoomEvent.Reconnecting, () => {
        console.log("🔄 Reconnecting...");
        setStatusMessage("Reconnecting...");
        setCallState("connecting");
      });

      livekitRoom.on(RoomEvent.Reconnected, () => {
        console.log("✅ Reconnected");
        setStatusMessage("Reconnected - Continue speaking");
        setCallState("talking");
        addToTranscript("System", "Reconnected to call");
      });

      livekitRoom.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        console.log(`📻 Track subscribed: ${track.kind} from ${participant.identity}`, {
          trackSid: track.sid,
          source: track.source,
          muted: track.isMuted
        });
        
        // Handle audio tracks (agent's voice)
        if (track.kind === Track.Kind.Audio) {
          console.log("🔊 Agent audio track received");
          setAgentSpeaking(true);
          
          if (participant.identity.includes('agent')) {
            setStatusMessage("🗣️ AI Agent is speaking...");
            addToTranscript("AI Agent", "Speaking...");
          }
          
          const audioElement = track.attach();
          audioElement.style.display = "none";
          document.body.appendChild(audioElement);
          audioElement.volume = 1.0;
          
          audioElement.play().then(() => {
            console.log("✅ Agent audio playing");
          }).catch(err => {
            console.warn("⚠️ Audio autoplay blocked:", err);
            setStatusMessage("🔊 Click anywhere to hear AI Agent");
            
            // Fallback: play on user interaction
            const enableAudio = () => {
              audioElement.play().then(() => {
                console.log("✅ Audio enabled after user interaction");
                setStatusMessage("🗣️ AI Agent is speaking...");
              }).catch(e => console.error("Audio play failed:", e));
            };
            
            document.addEventListener('click', enableAudio, { once: true });
            document.addEventListener('keydown', enableAudio, { once: true });
          });
          
          // Clean up when track ends
          track.on("ended", () => {
            setAgentSpeaking(false);
            audioElement.remove();
          });
        }
      });

      livekitRoom.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
        console.log("📻 Track unsubscribed:", track.kind, "from", participant.identity);
        track.detach().forEach(el => el.remove());
        
        if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
          setAgentSpeaking(false);
          setStatusMessage("✅ Your turn - Speak now");
        }
      });

      livekitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log("👤 Participant joined:", participant.identity);
        
        if (participant.identity.includes('agent')) {
          setAgentConnected(true);
          setStatusMessage("🤖 AI Agent joined - Start speaking!");
          addToTranscript("System", "🤖 AI Agent joined the call");
        } else {
          addToTranscript("System", `${participant.identity} joined`);
        }
      });

      livekitRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log("👋 Participant left:", participant.identity);
        
        if (participant.identity.includes('agent')) {
          setAgentConnected(false);
          setStatusMessage("⚠️ AI Agent disconnected");
          addToTranscript("System", "AI Agent left the call");
        } else {
          addToTranscript("System", `${participant.identity} left`);
        }
      });
      
      // Log when local participant publishes tracks
      livekitRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
        console.log("📤 Local track published:", publication.kind, publication.source);
        
        if (publication.kind === Track.Kind.Audio) {
          addToTranscript("System", "🎤 Your microphone is active");
        }
      });
      
      // Detect when agent sends data messages
      livekitRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
        try {
          const decoder = new TextDecoder();
          const message = decoder.decode(payload);
          const data = JSON.parse(message);
          
          console.log("📨 Data received from", participant?.identity, data);
          
          if (data.type === "on_hold") {
            setCallState("onHold");
            setStatusMessage("⏳ On hold - Supervisor reviewing your question");
            addToTranscript("AI Agent", "Please hold while I check with my supervisor...");
          } else if (data.type === "resolved") {
            setCallState("resolved");
            setStatusMessage("✅ Question resolved!");
            addToTranscript("System", "Your question has been answered");
          } else if (data.type === "transcription" && data.text) {
            // Add transcribed text to conversation
            addToTranscript(data.speaker || "You", data.text);
          }
        } catch (e) {
          console.warn("Could not parse data message:", e);
        }
      });

      // Connect to room using token and URL from backend
      await livekitRoom.connect(tokenData.url, tokenData.token);
      console.log("🔗 Room connection established");

      // Enable microphone and publish audio track
      console.log("🎙️ Enabling microphone...");
      await livekitRoom.localParticipant.setMicrophoneEnabled(true);
      setIsMicEnabled(true);

      roomRef.current = livekitRoom;
      
      // Log microphone track info
      const micTrack = livekitRoom.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (micTrack) {
        console.log("✅ Microphone track published:", micTrack.track?.sid);
      } else {
        console.warn("⚠️ Microphone track not found");
      }
      
      // Log all participants
      const participants = Array.from(livekitRoom.remoteParticipants.values());
      console.log("👥 Participants in room:", participants.map(p => p.identity));
      
      // Check if agent is already in room
      const hasAgent = participants.some(p => p.identity.includes('agent'));
      if (hasAgent) {
        setAgentConnected(true);
        setStatusMessage("🤖 AI Agent ready - Start speaking!");
        addToTranscript("System", "AI Agent is already in the room");
      } else {
        setStatusMessage("⏳ Waiting for AI Agent to join...");
        addToTranscript("System", "Waiting for AI Agent...");
      }
      
    } catch (e: unknown) {
      console.error("❌ Failed to join room:", e);
      const errorMsg = (e as Error).message || "Failed to join room";
      setCallState("error");
      setStatusMessage(`Error: ${errorMsg}`);
      setConnected(false);
      addToTranscript("System", `ERROR: ${errorMsg}`);
    }
  }

  function leave() {
    if (roomRef.current) {
      console.log("📞 Leaving room...");
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnected(false);
    setCallState("idle");
    setStatusMessage("");
    setIsMicEnabled(true);
    setAgentConnected(false);
    setAgentSpeaking(false);
    addToTranscript("System", "Call ended");
  }

  async function toggleMicrophone() {
    if (!roomRef.current) return;
    const newState = !isMicEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    setIsMicEnabled(newState);
    
    console.log(`🎤 Microphone ${newState ? "enabled" : "muted"}`);
    
    if (newState) {
      setStatusMessage("🎤 Microphone ON - Speak now");
      addToTranscript("System", "🎤 Microphone unmuted");
    } else {
      setStatusMessage("🔇 Microphone OFF");
      addToTranscript("System", "🔇 Microphone muted");
    }
  }

  // Get status color based on call state
  const getStatusColor = () => {
    switch (callState) {
      case "talking": return "var(--success-600)";
      case "onHold": return "var(--warning-600)";
      case "resolved": return "var(--success-700)";
      case "error": return "var(--error-600)";
      case "connecting": return "var(--primary-600)";
      default: return "var(--text-secondary)";
    }
  };
  
  // Get call state icon
  const getCallStateIcon = () => {
    switch (callState) {
      case "talking": return agentSpeaking ? "🗣️" : "🎤";
      case "onHold": return "⏳";
      case "resolved": return "✅";
      case "error": return "❌";
      case "connecting": return "🔄";
      default: return "📞";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      {/* Main Controls Row */}
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        <input 
          className="input" 
          style={{ width: 140, fontSize: 13 }} 
          value={identity} 
          onChange={e => setIdentity(e.target.value)} 
          placeholder="Caller ID"
          disabled={connected}
          title="Your caller identity"
        />
        <input 
          className="input" 
          style={{ width: 150, fontSize: 13 }} 
          value={roomName} 
          onChange={e => setRoomName(e.target.value)} 
          placeholder="Room name"
          disabled={connected}
          title="LiveKit room name"
        />
        
        {!connected ? (
          <button className="btn btn-primary" onClick={join}>
            📞 Start Voice Call
          </button>
        ) : (
          <>
            <button 
              className="btn" 
              onClick={leave} 
              style={{ 
                background: "var(--error-50)", 
                borderColor: "var(--error-500)", 
                color: "var(--error-700)" 
              }}
            >
              📞 End Call
            </button>
            <button 
              className="btn" 
              onClick={toggleMicrophone}
              style={{ 
                background: isMicEnabled ? "var(--success-50)" : "var(--error-50)",
                borderColor: isMicEnabled ? "var(--success-500)" : "var(--error-500)",
                color: isMicEnabled ? "var(--success-700)" : "var(--error-700)"
              }}
              title={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isMicEnabled ? "🎤 Mute" : "🔇 Unmute"}
            </button>
          </>
        )}
      </div>

      {/* Status Banner */}
      {connected && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          background: callState === "onHold" ? "var(--warning-50)" : 
                      callState === "resolved" ? "var(--success-50)" :
                      callState === "error" ? "var(--error-50)" : "var(--primary-50)",
          border: `2px solid ${callState === "onHold" ? "var(--warning-500)" : 
                                callState === "resolved" ? "var(--success-500)" :
                                callState === "error" ? "var(--error-500)" : "var(--primary-500)"}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          animation: agentSpeaking ? "pulse 2s ease-in-out infinite" : "none"
        }}>
          <span style={{ fontSize: 24 }}>{getCallStateIcon()}</span>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: 14, 
              color: getStatusColor(),
              marginBottom: 2
            }}>
              {statusMessage || "Connected"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {agentConnected ? (
                <span style={{ color: "var(--success-600)" }}>
                  ✅ AI Agent connected{agentSpeaking ? " • Speaking..." : ""}
                </span>
              ) : (
                <span style={{ color: "var(--warning-600)" }}>
                  ⏳ Waiting for AI Agent...
                </span>
              )}
              {" • "}
              Mic: {isMicEnabled ? "🎤 ON" : "🔇 OFF"}
            </div>
          </div>
          
          {/* Recording Indicator */}
          {isMicEnabled && !agentSpeaking && callState === "talking" && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              background: "var(--error-500)",
              borderRadius: 12,
              color: "white",
              fontSize: 11,
              fontWeight: 600,
              animation: "pulse 1.5s ease-in-out infinite"
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "white",
              }} />
              REC
            </div>
          )}
        </div>
      )}

      {/* On Hold State */}
      {callState === "onHold" && (
        <div style={{
          padding: "16px",
          borderRadius: 8,
          background: "var(--warning-50)",
          border: "1px solid var(--warning-300)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div style={{ fontWeight: 600, color: "var(--warning-700)", marginBottom: 4 }}>
            Please Hold
          </div>
          <div style={{ fontSize: 13, color: "var(--warning-600)" }}>
            Your question has been sent to a supervisor for review
          </div>
        </div>
      )}

      {/* Transcript */}
      {connected && transcript.length > 0 && (
        <div style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          padding: 12,
          maxHeight: 200,
          overflowY: "auto"
        }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: "var(--text-secondary)", 
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            Call Transcript
          </div>
          {transcript.map((entry, idx) => (
            <div 
              key={idx} 
              style={{ 
                fontSize: 13, 
                marginBottom: 6,
                paddingBottom: 6,
                borderBottom: idx < transcript.length - 1 ? "1px solid var(--border-color)" : "none"
              }}
            >
              <span style={{ 
                fontWeight: 600, 
                color: entry.speaker === "System" ? "var(--text-secondary)" :
                       entry.speaker === "AI Agent" ? "var(--primary-600)" : 
                       "var(--success-600)"
              }}>
                {entry.speaker}:
              </span>{" "}
              <span style={{ color: "var(--text-primary)" }}>
                {entry.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Instructions for idle state */}
      {!connected && callState === "idle" && (
        <div style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          padding: 12,
          background: "var(--bg-secondary)",
          borderRadius: 8,
          border: "1px solid var(--border-color)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--text-primary)" }}>
            How it works:
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Click "Start Voice Call" to connect</li>
            <li>Allow microphone permission when prompted</li>
            <li>Wait for AI Agent to join</li>
            <li>Speak your question naturally</li>
            <li>AI will answer or escalate to supervisor if needed</li>
          </ol>
        </div>
      )}

      {/* Troubleshooting panel when not connected */}
      {!connected && callState === "error" && (
        <div style={{
          fontSize: 13,
          color: "var(--error-700)",
          padding: 12,
          background: "var(--error-50)",
          borderRadius: 8,
          border: "1px solid var(--error-300)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Connection Error
          </div>
          <p style={{ marginBottom: 8 }}>Check these:</p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Backend is running: <code style={{ background: "white", padding: "2px 4px", borderRadius: 3 }}>uvicorn main:app --reload</code></li>
            <li>LiveKit token endpoint works: <code style={{ background: "white", padding: "2px 4px", borderRadius: 3 }}>curl localhost:8000/livekit/token</code></li>
            <li>Microphone permission granted in browser</li>
          </ul>
        </div>
      )}

      {/* Backend status check when idle */}
      {!connected && callState === "idle" && (
        <div style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          padding: 10,
          background: "var(--bg-tertiary)",
          borderRadius: 6,
          border: "1px dashed var(--border-color)"
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Before starting:</div>
          <div>1. Backend running: <code>http://localhost:8000/health</code></div>
          <div>2. AI Agent bot connected to room: <code>{roomName}</code></div>
          <div>3. LiveKit server accessible</div>
        </div>
      )}
    </div>
  );
}
