import React, { useRef, useState } from 'react';
import { VectorProfile, CardTraitScores } from '../types';
import { 
  Download, 
  RefreshCcw, 
  Sparkles, 
  Twitter, 
  Copy, 
  Check,
  Target,
  Compass,
  Brain,
  Layers,
  Users,
  Mic,
  Heart,
  Zap,
  DollarSign,
  Timer
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  RadarChart 
} from 'recharts';

interface ProfileResultProps {
  profile: VectorProfile;
  traitScores?: CardTraitScores | null;
  onRestart: () => void;
  onGoDeeper?: () => void;
}

export const ProfileResult: React.FC<ProfileResultProps> = ({ 
  profile, 
  traitScores,
  onRestart, 
  onGoDeeper,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const downloadPlayerCard = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `careercompass-${profile.archetype.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
      downloadJSON();
    }
    setGenerating(false);
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `careercompass_profile_${new Date().toISOString()}.json`;
    link.click();
  };

  const copyShareLink = async () => {
    const topRoles = profile.potential_roles_or_paths.slice(0, 3).join(', ');
    const shareText = `I'm "${profile.archetype}" 🧭\n\nPotential paths: ${topRoles}\n\nDiscover yours with CareerCompass`;
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`I'm "${profile.archetype}" 🧭\n\nJust discovered my career archetype with CareerCompass!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const riasecData = [
    { subject: 'R', fullName: 'Realistic', value: profile.riasec_inferences.realistic },
    { subject: 'I', fullName: 'Investigative', value: profile.riasec_inferences.investigative },
    { subject: 'A', fullName: 'Artistic', value: profile.riasec_inferences.artistic },
    { subject: 'S', fullName: 'Social', value: profile.riasec_inferences.social },
    { subject: 'E', fullName: 'Enterprising', value: profile.riasec_inferences.enterprising },
    { subject: 'C', fullName: 'Conventional', value: profile.riasec_inferences.conventional },
  ];

  const sortedRiasec = [...riasecData].sort((a, b) => b.value - a.value);
  const topRiasecCode = sortedRiasec.slice(0, 3).map(r => r.subject).join('');

  // Core trait display data
  const coreTraits = traitScores ? [
    { label: 'Risk Tolerance', value: traitScores.riskTolerance, icon: Target, low: 'Conservative', high: 'Aggressive', color: 'vector' },
    { label: 'Empathy', value: traitScores.empathy, icon: Heart, low: 'Mission-first', high: 'People-first', color: 'pink' },
    { label: 'Execution', value: traitScores.execution, icon: Zap, low: 'Strategic', high: 'Action-oriented', color: 'amber' },
    { label: 'Cognitive Style', value: traitScores.cognitiveStyle, icon: Brain, low: 'Deep Focus', high: 'Rapid Switch', color: 'indigo' },
    { label: 'Motivation', value: traitScores.motivation, icon: DollarSign, low: 'Impact/Passion', high: 'Money/Status', color: 'green' },
  ] : [];

  return (
    <div className="w-full min-h-full overflow-y-auto px-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-8 pt-8">
        
        {/* ===== SHAREABLE PLAYER CARD ===== */}
        <div 
          ref={cardRef}
          className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-vector-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-vector-500/20 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-vector-400" />
                </div>
                <span className="text-xs font-mono text-vector-400 uppercase tracking-widest">CareerCompass</span>
              </div>
              <span className="text-xs font-mono text-slate-500">Assessment Results</span>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                {profile.archetype}
              </h1>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-vector-950/50 border border-vector-800 rounded-full">
                <span className="text-vector-300 font-mono text-sm">Holland Code:</span>
                <span className="text-white font-bold">{topRiasecCode}</span>
              </div>
            </div>

            {/* Core Trait Scores (from card assessment) */}
            {traitScores && (
              <div className="grid grid-cols-5 gap-2 mb-6">
                {coreTraits.map((trait, i) => (
                  <div key={i} className="text-center">
                    <div className="relative w-full aspect-square mb-2 max-w-[50px] mx-auto">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="16"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="3"
                          strokeDasharray={`${trait.value} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{trait.value}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wide block">{trait.label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Decisiveness Score */}
            {traitScores && (
              <div className="flex items-center justify-center gap-4 mb-6 py-3 border-t border-b border-slate-700/50">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">
                  Decisiveness: <span className="text-white font-bold">{traitScores.decisivenessScore}</span>
                  <span className="text-slate-500 ml-2">
                    (avg {(traitScores.avgReactionTime / 1000).toFixed(1)}s per choice)
                  </span>
                </span>
              </div>
            )}

            {/* Top Drivers */}
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Core Drivers</h3>
              <div className="flex flex-wrap gap-2">
                {profile.top_drivers.slice(0, 4).map((driver, i) => (
                  <span key={i} className="px-3 py-1.5 bg-vector-900/50 border border-vector-700 text-vector-200 rounded-full text-sm font-medium">
                    {driver}
                  </span>
                ))}
              </div>
            </div>

            {/* Potential Paths */}
            <div className="text-center">
              <h3 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-3">Potential Paths</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.potential_roles_or_paths.slice(0, 3).map((role, i) => (
                  <span key={i} className="px-4 py-2 border border-slate-700 text-slate-200 rounded-lg text-sm">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Share & Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={downloadPlayerCard}
            disabled={generating}
            className="flex items-center space-x-2 px-5 py-2.5 bg-vector-600 hover:bg-vector-500 text-white rounded-full transition-all shadow-lg shadow-vector-900/30 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{generating ? 'Generating...' : 'Save Card'}</span>
          </button>
          
          <button
            onClick={shareToTwitter}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all"
          >
            <Twitter className="w-4 h-4" />
            <span>Share</span>
          </button>
          
          <button
            onClick={copyShareLink}
            className="flex items-center space-x-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-full transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>
        </div>

        {/* ===== GO DEEPER WITH VECTOR ===== */}
        {onGoDeeper && (
          <div className="bg-gradient-to-r from-vector-950 to-indigo-950 border border-vector-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-full bg-vector-600/20 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-vector-400" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-white mb-1">Go Deeper with Vector</h3>
                <p className="text-slate-400 text-sm">
                  Have a voice conversation to explore nuances the cards couldn't capture. 
                  Vector will probe your motivations, surface contradictions, and refine your profile.
                </p>
              </div>
              <button
                onClick={onGoDeeper}
                className="shrink-0 flex items-center gap-2 px-6 py-3 bg-vector-600 hover:bg-vector-500 text-white font-medium rounded-xl transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Voice Session</span>
              </button>
            </div>
          </div>
        )}

        {/* ===== DETAILED ANALYSIS ===== */}
        <div className="border-t border-slate-800 pt-8">
          <h2 className="text-center text-sm font-mono text-slate-500 uppercase tracking-widest mb-8">
            Full Analysis
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* RIASEC Chart */}
            <Section title="Holland Code (RIASEC)" icon={<Compass className="w-5 h-5" />}>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={riasecData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Radar dataKey="value" stroke="#0ea5e9" strokeWidth={2} fill="#0ea5e9" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {riasecData.map((item, i) => (
                  <div key={i} className="text-center">
                    <span className="text-xs text-slate-500">{item.fullName}</span>
                    <span className="block text-white font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Core Traits Breakdown */}
            {traitScores && (
              <Section title="Psychometric Scores" icon={<Brain className="w-5 h-5" />}>
                <div className="space-y-4">
                  {coreTraits.map((trait, i) => {
                    const Icon = trait.icon;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Icon className="w-4 h-4 text-vector-400" />
                            <span>{trait.label}</span>
                          </div>
                          <span className="text-white font-bold">{trait.value}</span>
                        </div>
                        <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-gradient-to-r from-vector-600 to-vector-400 rounded-full"
                            style={{ width: `${trait.value}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>{trait.low}</span>
                          <span>{trait.high}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Strength Signals */}
            <Section title="Strength Signals" icon={<Sparkles className="w-5 h-5" />}>
              <ul className="space-y-2">
                {profile.strength_signals.map((strength, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-vector-400 rounded-full shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Behavioral Tendencies */}
            <Section title="Behavioral Tendencies" icon={<Layers className="w-5 h-5" />}>
              <ul className="space-y-2">
                {profile.behavioral_tendencies.map((item, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Motivational Patterns */}
            <Section title="Motivational Patterns" icon={<Target className="w-5 h-5" />}>
              <ul className="space-y-2">
                {profile.motivational_patterns.map((pattern, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                    {pattern}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Environmental Needs */}
            <Section title="Environmental Needs" icon={<Users className="w-5 h-5" />}>
              <ul className="space-y-2">
                {profile.environmental_needs.map((need, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
                    {need}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* All Potential Roles */}
          <div className="mt-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">All Potential Paths</h3>
            <div className="flex flex-wrap gap-2">
              {profile.potential_roles_or_paths.map((role, i) => (
                <span key={i} className="px-4 py-2 bg-vector-950 border border-vector-800 text-vector-200 rounded-lg text-sm font-medium">
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Conflicts/Unknowns */}
          {profile.conflicts_or_unknowns.length > 0 && (
            <div className="mt-6 bg-amber-950/20 border border-amber-900/30 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Areas to Explore</h3>
              <ul className="space-y-2">
                {profile.conflicts_or_unknowns.map((item, i) => (
                  <li key={i} className="flex items-start text-sm text-amber-200/70">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Disclaimers */}
        <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-lg">
          {profile.disclaimers.map((d, i) => (
            <p key={i} className="text-slate-500 text-xs text-center">{d}</p>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-center gap-4 pb-8">
          <button 
            onClick={downloadJSON}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          <button 
            onClick={onRestart}
            className="flex items-center space-x-2 px-6 py-3 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-full transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
    <div className="flex items-center space-x-2 mb-4">
      <div className="text-vector-400">{icon}</div>
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);
