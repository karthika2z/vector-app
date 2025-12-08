import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { VectorInterface } from './VectorInterface';
import { VectorProfile } from '../types';
import { OpenAIRealtimeClient } from '../utils/realtime-client';
import { 
  VECTOR_SYSTEM_PROMPT, 
  VOICE_MODE_ADDITIONS, 
  createDeepDiveUserPrompt 
} from '../prompts';
import { Play, Loader2 } from 'lucide-react';

interface ActiveSessionProps {
  url: string;
  token: string;
  openaiApiKey: string;
  onDisconnect: () => void;
  existingProfile?: VectorProfile | null;
  onProfileUpdated?: (profile: VectorProfile) => void;
}

// Voice system prompt combines base + voice additions
const VOICE_SYSTEM_PROMPT = VECTOR_SYSTEM_PROMPT + VOICE_MODE_ADDITIONS;

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'event';
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({ url, token, openaiApiKey, onDisconnect, existingProfile, onProfileUpdated }) => {
  const [profileData, setProfileData] = useState<VectorProfile | null>(null);

  // When profile is received, also notify parent
  const handleProfileReceived = (profile: VectorProfile) => {
    setProfileData(profile);
    if (onProfileUpdated) {
      onProfileUpdated(profile);
    }
  };

  return (
    <LiveKitRoom
      serverUrl={url}
      token={token}
      connect={true}
      audio={false}
      video={false}
      onDisconnected={onDisconnect}
      className="flex flex-col flex-1 h-full w-full relative"
    >
      <RoomAudioRenderer />
      <BrowserSessionManager 
        onProfileReceived={handleProfileReceived} 
        profileData={profileData} 
        onDisconnect={onDisconnect}
        openaiApiKey={openaiApiKey}
        existingProfile={existingProfile}
      />
    </LiveKitRoom>
  );
};

interface BrowserSessionManagerProps {
  onProfileReceived: (data: VectorProfile) => void;
  profileData: VectorProfile | null;
  onDisconnect: () => void;
  openaiApiKey: string;
  existingProfile?: VectorProfile | null;
}

const BrowserSessionManager: React.FC<BrowserSessionManagerProps> = ({
  onProfileReceived,
  profileData,
  onDisconnect,
  openaiApiKey,
  existingProfile
}) => {
  const connectionState = useConnectionState();

  const [agentStatus, setAgentStatus] = useState<'idle' | 'connecting' | 'connected' | 'speaking' | 'listening'>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const realtimeClientRef = useRef<OpenAIRealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const isInitialized = useRef(false);

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    realtimeClientRef.current?.setMuted(newMuted);
    if (newMuted) {
      setIsUserSpeaking(false);
    }
  };

  const addLog = (message: string, type: 'info' | 'error' | 'event' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-49), { timestamp, message, type }]);
  };

  const initAudioAndAgent = async () => {
    if (realtimeClientRef.current) return;

    addLog("Initializing Audio Engine...", 'info');

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    nextStartTimeRef.current = ctx.currentTime;

    if (ctx.state === 'suspended') {
      addLog("Audio Context suspended. Waiting for gesture.", 'event');
      setNeedsGesture(true);
      return;
    }

    setNeedsGesture(false);
    await startOpenAIConnection(ctx);
  };

  const handleGestureStart = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
      addLog("Audio Context Resumed.", 'info');
    }
    setNeedsGesture(false);
    if (!realtimeClientRef.current && audioContextRef.current) {
      await startOpenAIConnection(audioContextRef.current);
    }
  };

  const startOpenAIConnection = async (ctx: AudioContext) => {
    addLog("Connecting to OpenAI...", 'info');
    setAgentStatus('connecting');

    // Build instructions: base voice prompt + deep dive context if available
    let instructions = VOICE_SYSTEM_PROMPT;
    if (existingProfile) {
      // Append the deep dive context as additional instructions
      instructions += '\n\n---\n\n' + createDeepDiveUserPrompt(existingProfile);
    }

    const client = new OpenAIRealtimeClient({
      apiKey: openaiApiKey,
      instructions,
      audioContext: ctx,
      onLog: addLog,
      onUserSpeaking: setIsUserSpeaking,
      onStatusChange: (status) => {
        if (status === 'connected') setAgentStatus('listening');
        else if (status === 'connecting') setAgentStatus('connecting');
        else if (status === 'error') setAgentStatus('idle');
      },
      onAudioOutput: async (int16Data) => {
        setAgentStatus('speaking');
        
        const float32 = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
          float32[i] = int16Data[i] / 32768.0;
        }
        
        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);
        
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
        
        source.onended = () => {
          if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
            setAgentStatus('listening');
          }
        };
      },
      onJsonOutput: (json) => {
        addLog("Received JSON Profile!", 'event');
        onProfileReceived(json);
      }
    });

    realtimeClientRef.current = client;
    await client.connect();
  };

  useEffect(() => {
    if (!isInitialized.current && connectionState === ConnectionState.Connected) {
      isInitialized.current = true;
      initAudioAndAgent();
    }
    return () => {
      realtimeClientRef.current?.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [connectionState]);

  if (connectionState !== ConnectionState.Connected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-pulse">
        <Loader2 className="w-10 h-10 text-vector-400 animate-spin" />
        <span className="text-slate-400 text-sm tracking-widest uppercase">Connecting to Room...</span>
      </div>
    );
  }

  if (profileData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-600/20 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Updated!</h2>
            <p className="text-slate-400">
              Vector has refined your analysis based on the conversation. 
              You're now <span className="text-vector-300 font-medium">{profileData.archetype}</span>.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onDisconnect}
              className="w-full py-3 px-6 bg-vector-600 hover:bg-vector-500 text-white font-medium rounded-xl transition-all"
            >
              View Updated Results
            </button>
            <p className="text-xs text-slate-500">
              Your new profile will be shown when you exit.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <VectorInterface
        onDisconnect={onDisconnect}
        isLiveKitAgentConnected={agentStatus !== 'idle'}
        onStartBrowserAgent={() => {}}
        useBrowserAgent={true}
        browserAgentStatus={agentStatus}
        logs={logs}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isUserSpeaking={isUserSpeaking}
      />

      {needsGesture && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <button
            onClick={handleGestureStart}
            className="group relative flex items-center justify-center w-32 h-32 bg-vector-600 rounded-full shadow-[0_0_40px_-10px_rgba(14,165,233,0.5)] hover:scale-105 transition-all duration-300"
          >
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
            <Play className="w-12 h-12 text-white fill-white ml-2" />
          </button>
          <p className="mt-8 text-slate-300 font-medium tracking-wide">Tap to Start Session</p>
        </div>
      )}
    </>
  );
};
