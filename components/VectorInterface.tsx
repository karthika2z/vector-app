import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Activity, Terminal, ChevronUp, ChevronDown, Radio } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'event';
}

interface VectorInterfaceProps {
  onDisconnect: () => void;
  isLiveKitAgentConnected: boolean;
  onStartBrowserAgent: () => void;
  useBrowserAgent: boolean;
  browserAgentStatus: string;
  logs: LogEntry[];
  isMuted?: boolean;
  onToggleMute?: () => void;
  isUserSpeaking?: boolean;
}

export const VectorInterface: React.FC<VectorInterfaceProps> = ({
  onDisconnect,
  browserAgentStatus,
  logs,
  isMuted = false,
  onToggleMute,
  isUserSpeaking = false
}) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSpeaking = browserAgentStatus === 'speaking';
  const isListening = browserAgentStatus === 'listening';
  const isConnecting = browserAgentStatus === 'connecting';
  const isConnected = browserAgentStatus !== 'idle' && !isConnecting;

  return (
    <div className="flex flex-col h-full items-center justify-between py-6 relative">
      
      {/* Top Status Bar */}
      <div className="w-full flex justify-between items-center px-6">
        <div className="flex items-center space-x-2 text-vector-400/80">
          <Activity className={`w-4 h-4 ${isConnected ? 'text-vector-400' : 'text-amber-500'}`} />
          <span className="text-xs font-mono uppercase tracking-widest">
            {isConnected ? "Neural Link Active" : "Establishing Link..."}
          </span>
        </div>
        <div className="font-mono text-slate-500 text-sm">
          {formatTime(sessionTime)}
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full relative min-h-[300px]">
        
        {/* Agent Visualizer */}
        <div className="relative flex items-center justify-center">
          
          {/* Status Indicator Ring */}
          <div className={`absolute w-64 h-64 rounded-full border transition-all duration-500 
            ${isConnected 
              ? (isSpeaking ? 'border-vector-500/20 scale-110 opacity-100 bg-vector-900/10' : 'border-vector-500/10 scale-100 opacity-20')
              : 'border-amber-500/20 animate-pulse'
            }`} 
          />
          
          {/* Core Visualizer */}
          <div className="w-48 h-16 flex items-center justify-center gap-1 z-10">
             {isConnected ? (
               isSpeaking ? (
                  <div className="flex gap-1.5 items-center justify-center h-full">
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className="w-2 bg-vector-400 rounded-full animate-pulse" 
                            style={{ 
                              height: `${20 + Math.random() * 30}px`, 
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: '0.3s'
                            }} 
                       />
                     ))}
                  </div>
               ) : (
                  <div className="flex gap-2 items-center h-10">
                     <div className="w-1.5 h-1.5 bg-vector-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <div className="w-1.5 h-1.5 bg-vector-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <div className="w-1.5 h-1.5 bg-vector-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
               )
             ) : (
               <div className="flex flex-col items-center text-vector-400/50 gap-2 animate-pulse">
                 <Radio className="w-8 h-8" />
               </div>
             )}
          </div>
        </div>

        {/* State Text */}
        <div className="mt-12 text-center h-24 flex flex-col items-center justify-center gap-3">
          <p className="text-slate-300 font-light text-lg tracking-wide transition-opacity duration-300">
            {isListening && "Listening..."}
            {isConnecting && "Authenticating with Vector..."}
            {isSpeaking && "Vector is speaking"}
            {!isListening && !isSpeaking && !isConnecting && isConnected && "Processing..."}
            {!isConnected && !isConnecting && "Initializing..."}
          </p>
        </div>
      </div>

      {/* User Speaking Indicator */}
      {isUserSpeaking && !isMuted && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-72 h-72 rounded-full border-2 border-green-400/30 animate-ping" />
        </div>
      )}

      {/* Speaking Status Text */}
      {isUserSpeaking && !isMuted && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 text-green-400 text-sm font-medium animate-pulse">
          You're being heard
        </div>
      )}

      {/* Muted Indicator */}
      {isMuted && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 text-amber-400 text-sm font-medium">
          Microphone muted
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4 px-6 py-4 bg-slate-900/80 backdrop-blur-lg rounded-full border border-slate-800 shadow-2xl z-20">
        {onToggleMute && (
          <button
            onClick={onToggleMute}
            className={`p-4 rounded-full transition-all duration-200 ${
              isMuted
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        )}
        <button
          onClick={onDisconnect}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all duration-200"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      {/* Debug Console Toggle */}
      <div className={`fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 transition-all duration-300 z-30 ${showLogs ? 'h-64' : 'h-8'}`}>
        <button 
          onClick={() => setShowLogs(!showLogs)}
          className="w-full h-8 bg-slate-900 flex items-center justify-between px-4 text-xs font-mono text-slate-500 hover:text-slate-300"
        >
          <div className="flex items-center space-x-2">
            <Terminal className="w-3 h-3" />
            <span>DEBUG CONSOLE</span>
          </div>
          {showLogs ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
        
        {showLogs && (
          <div className="h-full overflow-y-auto p-4 font-mono text-xs space-y-1 pb-12">
            {logs.length === 0 && <span className="text-slate-600 italic">No logs yet...</span>}
            {logs.map((log, i) => (
              <div key={i} className="flex space-x-2">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={`${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'event' ? 'text-vector-300' : 'text-slate-400'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

    </div>
  );
};
