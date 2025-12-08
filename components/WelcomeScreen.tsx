import React from 'react';
import { Compass, Sparkles, ArrowRight, Zap, Clock, Brain } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-vector-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-vector-900/50 animate-float">
              <Compass className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          CareerCompass
        </h1>
        <p className="text-lg text-slate-400 leading-relaxed">
          Discover your career archetype through quick scenario decisions. 
          <span className="text-vector-300"> No tests. No right answers. </span>
          Just choices that reveal who you really are.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 mb-12 max-w-md w-full">
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-vector-900/50 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-vector-400" />
          </div>
          <span className="text-xs text-slate-400">15 Scenarios</span>
        </div>
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-vector-900/50 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-vector-400" />
          </div>
          <span className="text-xs text-slate-400">~5 Minutes</span>
        </div>
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-vector-900/50 flex items-center justify-center mx-auto mb-2">
            <Brain className="w-5 h-5 text-vector-400" />
          </div>
          <span className="text-xs text-slate-400">AI Analysis</span>
        </div>
      </div>

      {/* Start Button */}
      <div className="w-full max-w-sm">
        <button
          onClick={onStart}
          className="w-full group bg-gradient-to-r from-vector-600 to-indigo-600 hover:from-vector-500 hover:to-indigo-500 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-vector-900/30 flex items-center justify-center gap-2"
        >
          <span>Begin Assessment</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Footer Note */}
      <p className="mt-12 text-xs text-slate-600 text-center max-w-sm">
        Neurodivergent-friendly • No time pressure • Your data stays in your browser
      </p>
    </div>
  );
};
