import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Waves, Key, Lock, Radio } from 'lucide-react';
import { SignJWT } from 'jose';

interface ConnectScreenProps {
  onConnect: (url: string, token: string, apiKey: string) => void;
  error: string | null;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onConnect, error }) => {
  const [url, setUrl] = useState('');
  const [livekitApiKey, setLivekitApiKey] = useState('');
  const [livekitApiSecret, setLivekitApiSecret] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const generateToken = async () => {
    try {
      const encoder = new TextEncoder();
      const secret = encoder.encode(livekitApiSecret);
      const roomName = `vector-session-${Math.random().toString(36).substring(7)}`;
      const participantIdentity = `user-${Math.random().toString(36).substring(7)}`;

      const jwt = await new SignJWT({
        iss: livekitApiKey,
        sub: participantIdentity,
        video: {
          room: roomName,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
          canUpdateOwnMetadata: true,
        },
      })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setExpirationTime('2h')
        .sign(secret);

      return jwt;
    } catch (err) {
      console.error(err);
      throw new Error("Failed to generate token. Please check your API Secret.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);
    
    if (url && livekitApiKey && livekitApiSecret && openaiApiKey) {
      setIsGenerating(true);
      try {
        const token = await generateToken();
        onConnect(url, token, openaiApiKey);
      } catch (err: any) {
        setGenError(err.message);
        setIsGenerating(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md mx-auto">
      <div className="mb-8 flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-2xl shadow-vector-900/50 mb-2 animate-float">
          <Waves className="w-10 h-10 text-vector-400" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Vector
        </h1>
        <p className="text-lg text-slate-400 font-light leading-relaxed">
          A career forensicist that listens to <span className="text-vector-300 font-medium">how you think</span>.
        </p>
      </div>

      <div className="w-full bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
              <Radio className="w-3 h-3" /> LiveKit Server URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="wss://your-project.livekit.cloud"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-vector-500/50 focus:border-vector-500 transition-all placeholder:text-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                <Key className="w-3 h-3" /> API Key
              </label>
              <input
                type="text"
                value={livekitApiKey}
                onChange={(e) => setLivekitApiKey(e.target.value)}
                placeholder="API..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-vector-500/50 focus:border-vector-500 transition-all placeholder:text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> API Secret
              </label>
              <input
                type="password"
                value={livekitApiSecret}
                onChange={(e) => setLivekitApiSecret(e.target.value)}
                placeholder="Secret..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-vector-500/50 focus:border-vector-500 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/20 rounded flex items-center justify-center text-[8px] font-bold text-green-500">AI</div> OpenAI API Key
            </label>
            <input
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-vector-500/50 focus:border-vector-500 transition-all placeholder:text-slate-700"
            />
          </div>

          {(error || genError) && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-xs">
              {error || genError}
            </div>
          )}

          <button
            type="submit"
            disabled={!url || !livekitApiKey || !livekitApiSecret || !openaiApiKey || isGenerating}
            className="w-full group bg-vector-600 hover:bg-vector-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-vector-900/20"
          >
            {isGenerating ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Session</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 flex items-start space-x-3 text-xs text-slate-500 bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
          <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
          <p>
            Keys are processed locally in your browser. Audio streams directly to OpenAI's Realtime API.
          </p>
        </div>
      </div>
    </div>
  );
};
