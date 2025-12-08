import React, { useRef, useState } from 'react';
import { VectorProfile } from '../types';
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
  Mic,
  TrendingUp,
  Shield,
  AlertTriangle,
  Rocket,
  GraduationCap,
  Briefcase,
  ChevronRight,
  Zap,
  Heart,
  Scale,
  Lightbulb,
  Clock,
  Share2
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
  onRestart: () => void;
  onGoDeeper?: () => void;
}

const AIOutlookBadge: React.FC<{ outlook: string }> = ({ outlook }) => {
  const config = {
    thriving: { bg: 'bg-green-900/50', border: 'border-green-700', text: 'text-green-300', icon: TrendingUp, label: 'AI Thriving' },
    evolving: { bg: 'bg-amber-900/50', border: 'border-amber-700', text: 'text-amber-300', icon: Shield, label: 'AI Evolving' },
    at_risk: { bg: 'bg-red-900/50', border: 'border-red-700', text: 'text-red-300', icon: AlertTriangle, label: 'AI Risk' },
  }[outlook] || { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400', icon: Shield, label: outlook };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.bg} border ${config.border} ${config.text} rounded-full text-xs font-medium`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const GrowthBadge: React.FC<{ growth: string }> = ({ growth }) => {
  const colors = {
    high: 'text-green-400',
    medium: 'text-amber-400',
    low: 'text-slate-400',
  }[growth] || 'text-slate-400';

  return <span className={`text-xs ${colors} font-medium`}>{growth.charAt(0).toUpperCase() + growth.slice(1)} Growth</span>;
};

export const ProfileResult: React.FC<ProfileResultProps> = ({
  profile,
  onRestart,
  onGoDeeper,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Safely access new fields with fallbacks
  const emoji = profile.archetype_emoji || '🎯';
  const tagline = profile.tagline || 'Your unique career profile';
  const psychScores = profile.psychometric_scores || {
    risk_tolerance: 50,
    empathy_orientation: 50,
    execution_bias: 50,
    cognitive_flexibility: 50,
    intrinsic_vs_extrinsic: 50,
    decisiveness: 50,
  };
  const careerGuidance = profile.career_guidance || {
    ai_resilient_strengths: [],
    recommended_majors: [],
    career_paths: [],
    skills_to_develop: [],
    avoid_these: [],
    one_year_action: '',
    five_year_vision: '',
  };

  const downloadReport = async () => {
    if (!reportRef.current) return;
    setGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        windowHeight: reportRef.current.scrollHeight,
        height: reportRef.current.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `careercompass-${profile.archetype.toLowerCase().replace(/\s+/g, '-')}-report.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    }
    setGenerating(false);
  };

  const copyShareLink = async () => {
    const topCareers = careerGuidance.career_paths?.slice(0, 2).map(c => c.title).join(', ') || profile.potential_roles_or_paths.slice(0, 2).join(', ');
    const shareText = `${emoji} I'm "${profile.archetype}"!\n\n${tagline}\n\nTop career matches: ${topCareers}\n\nDiscover yours at CareerCompass`;
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${emoji} I'm "${profile.archetype}"!\n\n${tagline}\n\nJust discovered my AI-era career profile with CareerCompass!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const riasecData = [
    { subject: 'R', fullName: 'Realistic', value: profile.riasec_inferences?.realistic || 0 },
    { subject: 'I', fullName: 'Investigative', value: profile.riasec_inferences?.investigative || 0 },
    { subject: 'A', fullName: 'Artistic', value: profile.riasec_inferences?.artistic || 0 },
    { subject: 'S', fullName: 'Social', value: profile.riasec_inferences?.social || 0 },
    { subject: 'E', fullName: 'Enterprising', value: profile.riasec_inferences?.enterprising || 0 },
    { subject: 'C', fullName: 'Conventional', value: profile.riasec_inferences?.conventional || 0 },
  ];

  const sortedRiasec = [...riasecData].sort((a, b) => b.value - a.value);
  const topRiasecCode = sortedRiasec.slice(0, 3).map(r => r.subject).join('');

  const psychometricTraits = [
    { key: 'risk_tolerance', label: 'Risk Tolerance', icon: Target, low: 'Conservative', high: 'Bold', color: 'from-blue-500 to-cyan-400' },
    { key: 'empathy_orientation', label: 'Empathy', icon: Heart, low: 'Task-first', high: 'People-first', color: 'from-pink-500 to-rose-400' },
    { key: 'execution_bias', label: 'Execution', icon: Zap, low: 'Strategic', high: 'Action', color: 'from-amber-500 to-yellow-400' },
    { key: 'cognitive_flexibility', label: 'Flexibility', icon: Lightbulb, low: 'Deep Focus', high: 'Multi-task', color: 'from-purple-500 to-indigo-400' },
    { key: 'intrinsic_vs_extrinsic', label: 'Motivation', icon: Scale, low: 'Impact', high: 'Status', color: 'from-green-500 to-emerald-400' },
    { key: 'decisiveness', label: 'Decisiveness', icon: Clock, low: 'Deliberate', high: 'Quick', color: 'from-orange-500 to-red-400' },
  ];

  return (
    <div className="w-full min-h-full overflow-y-auto px-4 pb-32">
      {/* Full Report Container - This is what gets captured for sharing */}
      <div ref={reportRef} className="max-w-4xl mx-auto space-y-8 pt-6 bg-slate-950">

        {/* ===== HERO SECTION ===== */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-vector-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-vector-500/20 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-vector-400" />
                </div>
                <span className="text-xs font-mono text-vector-400 uppercase tracking-widest">CareerCompass</span>
              </div>
              <span className="text-xs font-mono text-slate-500">AI-Era Profile</span>
            </div>

            {/* Archetype Hero */}
            <div className="text-center py-6">
              <div className="text-6xl mb-4">{emoji}</div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                {profile.archetype}
              </h1>
              <p className="text-lg text-slate-300 max-w-md mx-auto italic">
                "{tagline}"
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-vector-950/50 border border-vector-800 rounded-full">
                <span className="text-vector-300 font-mono text-sm">Holland Code:</span>
                <span className="text-white font-bold text-lg">{topRiasecCode}</span>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {psychometricTraits.slice(0, 3).map((trait) => {
                const value = psychScores[trait.key as keyof typeof psychScores] || 50;
                return (
                  <div key={trait.key} className="text-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="text-2xl font-bold text-white">{value}</div>
                    <div className="text-xs text-slate-400 mt-1">{trait.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Top Career Match Preview */}
            {careerGuidance.career_paths && careerGuidance.career_paths.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-vector-950/80 to-indigo-950/80 border border-vector-800/50 rounded-xl">
                <div className="text-xs text-vector-400 uppercase tracking-wider mb-2">Top Career Match</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-white">{careerGuidance.career_paths[0].title}</div>
                    <div className="text-sm text-slate-400">{careerGuidance.career_paths[0].salary_range}</div>
                  </div>
                  <AIOutlookBadge outlook={careerGuidance.career_paths[0].ai_outlook} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Go Deeper CTA */}
        {onGoDeeper && (
          <div className="bg-gradient-to-r from-vector-950 to-indigo-950 border border-vector-800 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="shrink-0 w-14 h-14 rounded-full bg-vector-600/20 flex items-center justify-center">
                <Mic className="w-7 h-7 text-vector-400" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-white mb-1">Go Deeper with Vector</h3>
                <p className="text-slate-400 text-sm">
                  Have a voice conversation to explore nuances and refine your career guidance.
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

        {/* ===== PSYCHOMETRIC PROFILE ===== */}
        <Section title="Your Psychometric Profile" icon={<Brain className="w-5 h-5" />}>
          <div className="grid gap-4">
            {psychometricTraits.map((trait) => {
              const Icon = trait.icon;
              const value = psychScores[trait.key as keyof typeof psychScores] || 50;
              return (
                <div key={trait.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-vector-400" />
                      <span className="text-sm text-slate-300">{trait.label}</span>
                    </div>
                    <span className="text-lg font-bold text-white">{value}</span>
                  </div>
                  <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full bg-gradient-to-r ${trait.color} rounded-full transition-all duration-500`}
                      style={{ width: `${value}%` }}
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

        {/* ===== AI-RESILIENT STRENGTHS ===== */}
        {careerGuidance.ai_resilient_strengths && careerGuidance.ai_resilient_strengths.length > 0 && (
          <Section title="Your AI-Proof Superpowers" icon={<Shield className="w-5 h-5" />}>
            <div className="grid gap-3">
              {careerGuidance.ai_resilient_strengths.map((strength, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-green-950/30 border border-green-900/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center text-green-400 font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="text-green-200">{strength}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== HOLLAND CODE / RIASEC ===== */}
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
              <div key={i} className="text-center p-2 bg-slate-800/50 rounded-lg">
                <span className="text-xs text-slate-500">{item.fullName}</span>
                <span className="block text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ===== RECOMMENDED MAJORS ===== */}
        {careerGuidance.recommended_majors && careerGuidance.recommended_majors.length > 0 && (
          <Section title="Recommended Majors" icon={<GraduationCap className="w-5 h-5" />}>
            <div className="grid gap-4">
              {careerGuidance.recommended_majors.map((major, i) => (
                <div key={i} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-vector-600 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-lg font-bold text-white">{major.name}</h4>
                    <AIOutlookBadge outlook={major.ai_outlook} />
                  </div>
                  <p className="text-sm text-slate-400">{major.fit_reason}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== CAREER PATHS ===== */}
        {careerGuidance.career_paths && careerGuidance.career_paths.length > 0 && (
          <Section title="Career Paths for You" icon={<Briefcase className="w-5 h-5" />}>
            <div className="grid gap-4">
              {careerGuidance.career_paths.map((career, i) => (
                <div key={i} className="p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 rounded-xl hover:border-vector-600 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-vector-300 transition-colors">
                        {career.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-green-400 font-medium">{career.salary_range}</span>
                        <GrowthBadge growth={career.growth_potential} />
                      </div>
                    </div>
                    <AIOutlookBadge outlook={career.ai_outlook} />
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{career.description}</p>
                  <div className="p-3 bg-vector-950/50 border border-vector-900 rounded-lg">
                    <div className="text-xs text-vector-400 uppercase tracking-wider mb-1">Why You'd Excel</div>
                    <p className="text-vector-200 text-sm">{career.why_you}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== SKILLS TO DEVELOP ===== */}
        {careerGuidance.skills_to_develop && careerGuidance.skills_to_develop.length > 0 && (
          <Section title="Skills to Develop Now" icon={<Rocket className="w-5 h-5" />}>
            <div className="flex flex-wrap gap-2">
              {careerGuidance.skills_to_develop.map((skill, i) => (
                <span key={i} className="px-4 py-2 bg-vector-900/50 border border-vector-700 text-vector-200 rounded-lg text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ===== PATHS TO AVOID ===== */}
        {careerGuidance.avoid_these && careerGuidance.avoid_these.length > 0 && (
          <Section title="Paths That May Drain You" icon={<AlertTriangle className="w-5 h-5" />}>
            <div className="space-y-2">
              {careerGuidance.avoid_these.map((path, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-200/80 text-sm">{path}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== ACTION PLAN ===== */}
        {(careerGuidance.one_year_action || careerGuidance.five_year_vision) && (
          <div className="grid md:grid-cols-2 gap-4">
            {careerGuidance.one_year_action && (
              <div className="p-5 bg-gradient-to-br from-amber-950/30 to-orange-950/30 border border-amber-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">1-Year Action</h4>
                </div>
                <p className="text-amber-100">{careerGuidance.one_year_action}</p>
              </div>
            )}
            {careerGuidance.five_year_vision && (
              <div className="p-5 bg-gradient-to-br from-vector-950/30 to-indigo-950/30 border border-vector-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-5 h-5 text-vector-400" />
                  <h4 className="text-sm font-bold text-vector-300 uppercase tracking-wider">5-Year Vision</h4>
                </div>
                <p className="text-vector-100">{careerGuidance.five_year_vision}</p>
              </div>
            )}
          </div>
        )}

        {/* ===== DEEP ANALYSIS SECTION ===== */}
        <div className="border-t border-slate-800 pt-8 mt-8">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Deep Analysis</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Core Drivers */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-4 h-4 text-vector-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Core Drivers</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.top_drivers.map((driver, i) => (
                  <span key={i} className="px-3 py-1.5 bg-vector-900/50 border border-vector-700 text-vector-200 rounded-full text-sm">
                    {driver}
                  </span>
                ))}
              </div>
            </div>

            {/* Strength Signals */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-vector-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Strength Signals</h3>
              </div>
              <ul className="space-y-1.5">
                {profile.strength_signals.map((strength, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-vector-400 rounded-full shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Behavioral Tendencies */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <Brain className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Behavioral Tendencies</h3>
              </div>
              <ul className="space-y-1.5">
                {profile.behavioral_tendencies.map((item, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Motivational Patterns */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center space-x-2 mb-3">
                <Heart className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Motivational Patterns</h3>
              </div>
              <ul className="space-y-1.5">
                {profile.motivational_patterns.map((pattern, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-pink-400 rounded-full shrink-0" />
                    {pattern}
                  </li>
                ))}
              </ul>
            </div>

            {/* Environmental Needs */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 md:col-span-2">
              <div className="flex items-center space-x-2 mb-3">
                <Compass className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Environmental Needs</h3>
              </div>
              <ul className="grid md:grid-cols-2 gap-2">
                {profile.environmental_needs.map((need, i) => (
                  <li key={i} className="flex items-start text-sm text-slate-300">
                    <span className="mr-2 mt-1.5 w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
                    {need}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Areas to Explore */}
          {profile.conflicts_or_unknowns && profile.conflicts_or_unknowns.length > 0 && (
            <div className="mt-6 bg-amber-950/20 border border-amber-900/30 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4">Areas to Explore Further</h3>
              <ul className="space-y-2">
                {profile.conflicts_or_unknowns.map((item, i) => (
                  <li key={i} className="flex items-start text-sm text-amber-200/70">
                    <ChevronRight className="w-4 h-4 text-amber-500 mr-2 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Disclaimers */}
        <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-lg">
          {profile.disclaimers?.map((d, i) => (
            <p key={i} className="text-slate-500 text-xs text-center">{d}</p>
          ))}
        </div>
      </div>

      {/* ===== STICKY BOTTOM BAR ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 p-4 z-50">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={downloadReport}
            disabled={generating}
            className="flex items-center space-x-2 px-5 py-2.5 bg-vector-600 hover:bg-vector-500 text-white rounded-full transition-all shadow-lg shadow-vector-900/30 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{generating ? 'Generating...' : 'Save Report'}</span>
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
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center space-x-2 px-5 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-400 rounded-full transition-all"
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
