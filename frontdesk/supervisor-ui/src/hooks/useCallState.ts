import { useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { getLivekitToken } from '@/api/livekit';

interface CallState {
  isActive: boolean;
  isConnected: boolean;
  isMuted: boolean;
  callDuration: number;
  customerId: string;
  roomName: string;
  room: Room | null;
  statusMessage: string;
  agentConnected: boolean;
  agentSpeaking: boolean;
  transcript: Array<{ speaker: string; message: string }>;
}

const initialState: CallState = {
  isActive: false,
  isConnected: false,
  isMuted: false,
  callDuration: 0,
  customerId: '',
  roomName: '',
  room: null,
  statusMessage: '',
  agentConnected: false,
  agentSpeaking: false,
  transcript: []
};

let globalCallState = initialState;
let callStateListeners: Array<(state: CallState) => void> = [];

export function useCallState() {
  const [callState, setCallState] = useState<CallState>(globalCallState);

  useEffect(() => {
    const listener = (state: CallState) => setCallState(state);
    callStateListeners.push(listener);
    
    return () => {
      callStateListeners = callStateListeners.filter(l => l !== listener);
    };
  }, []);

  const updateCallState = useCallback((updates: Partial<CallState>) => {
    globalCallState = { ...globalCallState, ...updates };
    callStateListeners.forEach(listener => listener(globalCallState));
  }, []);

  const startCall = useCallback(async (customerId: string, roomName: string = 'frontdesk-demo') => {
    try {
      updateCallState({
        isActive: true,
        isConnected: false,
        customerId,
        roomName,
        statusMessage: 'Connecting to call...',
        transcript: []
      });

      // Get token from backend
      const tokenData = await getLivekitToken({ identity: customerId, room: roomName });
      
      // Create LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        updateCallState({
          isConnected: true,
          statusMessage: 'Connected - Speak to AI Agent',
          room
        });
      });

      room.on(RoomEvent.Disconnected, () => {
        updateCallState({
          isActive: false,
          isConnected: false,
          statusMessage: '',
          agentConnected: false,
          agentSpeaking: false,
          room: null
        });
      });

      room.on(RoomEvent.ParticipantConnected, (participant) => {
        if (participant.identity.includes('agent')) {
          updateCallState({
            agentConnected: true,
            statusMessage: 'AI Agent joined - Start speaking!'
          });
        }
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        if (participant.identity.includes('agent')) {
          updateCallState({
            agentConnected: false,
            statusMessage: 'AI Agent disconnected'
          });
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
          console.log('🎵 Agent audio track subscribed, setting up playback...');
          
          // Create audio element for playback
          const audioElement = track.attach();
          audioElement.volume = 1.0;
          audioElement.autoplay = true;
          audioElement.play().catch(e => console.log('Audio autoplay prevented:', e));
          
          // Add to DOM for playback
          document.body.appendChild(audioElement);
          
          updateCallState({ 
            agentSpeaking: true,
            statusMessage: 'AI Agent is speaking - you should hear audio now'
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
          console.log('🔇 Agent audio track unsubscribed');
          
          // Detach and remove audio element
          track.detach().forEach(element => {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          });
          
          updateCallState({ 
            agentSpeaking: false,
            statusMessage: 'AI Agent stopped speaking'
          });
        }
      });

      // Connect to room
      // Connecting to LiveKit room with received token
      console.log('Connecting to LiveKit room:', tokenData.url);
      await room.connect(tokenData.url, tokenData.token);
      // Successfully connected to LiveKit room
      console.log('Connected to LiveKit room successfully');
      
      await room.localParticipant.setMicrophoneEnabled(true);
      // Microphone enabled for voice communication
      console.log('Microphone enabled');
      
      updateCallState({ room });

    } catch (error) {
      console.error('Failed to start call:', error);
      updateCallState({
        isActive: false,
        isConnected: false,
        statusMessage: `Error: ${error instanceof Error ? error.message : 'Failed to start call'}`
      });
    }
  }, [updateCallState]);

  const endCall = useCallback(() => {
    if (globalCallState.room) {
      globalCallState.room.disconnect();
    }
    updateCallState({
      isActive: false,
      isConnected: false,
      isMuted: false,
      callDuration: 0,
      statusMessage: '',
      agentConnected: false,
      agentSpeaking: false,
      room: null,
      transcript: []
    });
  }, [updateCallState]);

  const toggleMute = useCallback(async () => {
    if (globalCallState.room) {
      const newMutedState = !globalCallState.isMuted;
      await globalCallState.room.localParticipant.setMicrophoneEnabled(!newMutedState);
      updateCallState({ isMuted: newMutedState });
    }
  }, [updateCallState]);

  // Update call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.isActive && callState.isConnected) {
      interval = setInterval(() => {
        updateCallState({
          callDuration: callState.callDuration + 1
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.isActive, callState.isConnected, callState.callDuration, updateCallState]);

  return {
    callState,
    startCall,
    endCall,
    toggleMute
  };
}
