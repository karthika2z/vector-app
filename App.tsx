import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CardAssessment } from './components/CardAssessment';
import { ProfileResult } from './components/ProfileResult';
import { ActiveSession } from './components/ActiveSession';
import { AppState, VectorProfile } from './types';
import type { CardChoice } from './utils/adaptive-cards';
import { CONFIG } from './config';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [profile, setProfile] = useState<VectorProfile | null>(null);
  const [cardChoices, setCardChoices] = useState<CardChoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use config values directly
  const apiKey = CONFIG.openai.apiKey;

  const handleStart = () => {
    setAppState(AppState.CARD_ASSESSMENT);
  };

  const handleAssessmentComplete = (choices: CardChoice[], generatedProfile: VectorProfile) => {
    setCardChoices(choices);
    setProfile(generatedProfile);
    setAppState(AppState.RESULTS);
  };

  const handleGoDeeper = () => {
    setAppState(AppState.VOICE_DEEP_DIVE);
  };

  const handleRestart = () => {
    setProfile(null);
    setCardChoices([]);
    setError(null);
    setAppState(AppState.WELCOME);
  };

  const handleVoiceDisconnect = () => {
    setAppState(AppState.RESULTS);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-100 selection:bg-vector-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-vector-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        
        {appState === AppState.WELCOME && (
          <WelcomeScreen onStart={handleStart} />
        )}

        {appState === AppState.CARD_ASSESSMENT && (
          <div className="flex-1 flex flex-col">
            <header className="p-4 flex items-center justify-center border-b border-slate-800/50">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">CareerCompass Assessment</span>
            </header>
            <div className="flex-1">
              <CardAssessment apiKey={apiKey} onComplete={handleAssessmentComplete} />
            </div>
          </div>
        )}

        {/* ANALYZING state is now handled inside CardAssessment */}

        {appState === AppState.RESULTS && profile && (
          <div className="flex-1 flex flex-col">
            <ProfileResult
              profile={profile}
              onRestart={handleRestart}
              onGoDeeper={handleGoDeeper}
            />
          </div>
        )}

        {appState === AppState.VOICE_DEEP_DIVE && (
          <VoiceDeepDive 
            existingProfile={profile}
            onBack={() => setAppState(AppState.RESULTS)}
            onProfileUpdated={(updatedProfile) => {
              setProfile(updatedProfile);
            }}
          />
        )}

      </div>
    </div>
  );
};

// Voice Deep Dive component - auto-connects using config
interface VoiceDeepDiveProps {
  existingProfile: VectorProfile | null;
  onBack: () => void;
  onProfileUpdated: (profile: VectorProfile) => void;
}

const VoiceDeepDive: React.FC<VoiceDeepDiveProps> = ({ existingProfile, onBack, onProfileUpdated }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-connect on mount
  React.useEffect(() => {
    const connect = async () => {
      try {
        const { SignJWT } = await import('jose');
        const encoder = new TextEncoder();
        const secret = encoder.encode(CONFIG.livekit.apiSecret);
        const roomName = `vector-deep-dive-${Math.random().toString(36).substring(7)}`;
        const participantIdentity = `user-${Math.random().toString(36).substring(7)}`;

        const jwt = await new SignJWT({
          iss: CONFIG.livekit.apiKey,
          sub: participantIdentity,
          video: {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
          },
        })
          .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
          .setExpirationTime('2h')
          .sign(secret);

        setToken(jwt);
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to connect:', err);
        setError('Failed to connect to voice service');
      }
      setIsConnecting(false);
    };

    connect();
  }, []);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-vector-400 animate-spin mx-auto" />
          <p className="text-slate-400">Connecting to Vector...</p>
        </div>
      </div>
    );
  }

  if (isConnected && token) {
    return (
      <ActiveSession
        url={CONFIG.livekit.url}
        token={token}
        openaiApiKey={CONFIG.openai.apiKey}
        onDisconnect={onBack}
        existingProfile={existingProfile}
        onProfileUpdated={onProfileUpdated}
      />
    );
  }

  return null;
};

export default App;
