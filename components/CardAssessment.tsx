import React, { useState, useRef, useEffect } from 'react';
import { AdaptiveCard, CardChoice, generateNextCard, formatChoicesForAnalysis } from '../utils/adaptive-cards';
import { VECTOR_SYSTEM_PROMPT, createAnalysisUserPrompt } from '../prompts';
import { VectorProfile } from '../types';
import { ChevronLeft, ChevronRight, Clock, Zap, Loader2 } from 'lucide-react';

interface CardAssessmentProps {
  apiKey: string;
  onComplete: (choices: CardChoice[], profile: VectorProfile) => void;
}

const TOTAL_CARDS = 15;

const LOADING_MESSAGES = [
  "Crafting your next scenario...",
  "Analyzing your patterns...",
  "Building something interesting...",
  "Tailoring to your responses...",
  "Preparing a new perspective...",
];

export const CardAssessment: React.FC<CardAssessmentProps> = ({ apiKey, onComplete }) => {
  const [currentCard, setCurrentCard] = useState<AdaptiveCard | null>(null);
  const [choices, setChoices] = useState<CardChoice[]>([]);
  const [coveredAspects, setCoveredAspects] = useState<Set<string>>(new Set());
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [cardKey, setCardKey] = useState(0);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);

  const progress = (choices.length / TOTAL_CARDS) * 100;

  // Load first card on mount
  useEffect(() => {
    loadNextCard();
  }, []);

  // Rotate loading messages
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = LOADING_MESSAGES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const loadNextCard = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

    try {
      const card = await generateNextCard(choices, coveredAspects, apiKey);
      setCurrentCard(card);
      setCardStartTime(Date.now());
      setCardKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Failed to generate card:', err);
      setError(err.message || 'Failed to generate card');
    }

    setIsLoading(false);
  };

  const analyzeAndComplete = async (allChoices: CardChoice[]) => {
    setIsAnalyzing(true);
    
    try {
      const { summary, timing } = formatChoicesForAnalysis(allChoices);
      const userPrompt = createAnalysisUserPrompt(summary, timing);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: VECTOR_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      let content = data.choices[0]?.message?.content || '';
      
      // Parse JSON
      const jsonMatch = content.match(/```json?\n?([\s\S]*?)\n?```/);
      if (jsonMatch) content = jsonMatch[1];
      
      const profile = JSON.parse(content) as VectorProfile;
      onComplete(allChoices, profile);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again.');
      setIsAnalyzing(false);
    }
  };

  const handleChoice = async (choice: 'A' | 'B') => {
    if (isAnimating || !currentCard) return;

    const reactionTimeMs = Date.now() - cardStartTime;
    const newChoice: CardChoice = {
      cardId: currentCard.id,
      choice,
      reactionTimeMs,
      card: currentCard,
    };

    const newChoices = [...choices, newChoice];
    setChoices(newChoices);

    // Track covered aspect
    const aspectKey = `${currentCard.targetDimension}.${currentCard.targetAspect}`;
    const newCovered = new Set(coveredAspects);
    newCovered.add(aspectKey);
    setCoveredAspects(newCovered);

    // Animate out
    setSwipeDirection(choice === 'A' ? 'left' : 'right');
    setIsAnimating(true);

    setTimeout(async () => {
      setSwipeDirection(null);
      setIsAnimating(false);
      setDragX(0);

      if (newChoices.length >= TOTAL_CARDS) {
        // Done - analyze
        await analyzeAndComplete(newChoices);
      } else {
        // Load next card
        await loadNextCard();
      }
    }, 300);
  };

  // Touch/Mouse drag handlers
  const handleDragStart = (clientX: number) => {
    if (isAnimating || isLoading) return;
    setIsDragging(true);
    dragStartX.current = clientX;
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || isAnimating) return;
    const diff = clientX - dragStartX.current;
    setDragX(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragX < -100) {
      handleChoice('A');
    } else if (dragX > 100) {
      handleChoice('B');
    } else {
      setDragX(0);
    }
  };

  const getCardStyle = () => {
    if (swipeDirection === 'left') {
      return { transform: 'translateX(-150%) rotate(-20deg)', opacity: 0 };
    }
    if (swipeDirection === 'right') {
      return { transform: 'translateX(150%) rotate(20deg)', opacity: 0 };
    }
    if (isDragging) {
      const rotation = dragX * 0.05;
      return { transform: `translateX(${dragX}px) rotate(${rotation}deg)` };
    }
    return {};
  };

  const getSwipeIndicatorOpacity = (direction: 'left' | 'right') => {
    if (direction === 'left' && dragX < -30) {
      return Math.min(1, Math.abs(dragX) / 100);
    }
    if (direction === 'right' && dragX > 30) {
      return Math.min(1, dragX / 100);
    }
    return 0;
  };

  // Analyzing state
  if (isAnalyzing) {
    return (
      <div className="flex flex-col h-full items-center justify-center py-6 px-4">
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-vector-600/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-vector-600 to-indigo-600 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Analyzing Your Patterns</h2>
            <p className="text-slate-400">Vector is building your career profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-between py-6 px-4 max-w-lg mx-auto">
      
      {/* Progress Bar */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>Question {choices.length + 1} of {TOTAL_CARDS}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Take your time</span>
          </div>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-vector-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {currentCard && (
          <div className="mt-2 text-xs text-slate-600 text-center">
            Exploring: {currentCard.targetAspect}
          </div>
        )}
      </div>

      {/* Card Area */}
      <div className="flex-1 w-full flex items-center justify-center relative">
        {/* Swipe Indicators */}
        <div 
          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-vector-400 transition-opacity"
          style={{ opacity: getSwipeIndicatorOpacity('left') }}
        >
          <ChevronLeft className="w-8 h-8" />
          <span className="text-sm font-medium">Option A</span>
        </div>
        <div 
          className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-indigo-400 transition-opacity"
          style={{ opacity: getSwipeIndicatorOpacity('right') }}
        >
          <span className="text-sm font-medium">Option B</span>
          <ChevronRight className="w-8 h-8" />
        </div>

        {/* Loading State - Skeleton Card */}
        {isLoading && (
          <div className="w-full max-w-sm">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              {/* Shimmer overlay */}
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />

              {/* Context Badge Skeleton */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full mb-4">
                <div className="w-3 h-3 bg-slate-700 rounded animate-pulse-slow" />
                <div className="w-20 h-3 bg-slate-700 rounded animate-pulse-slow" />
              </div>

              {/* Scenario Skeleton */}
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-slate-700 rounded w-full animate-pulse-slow" />
                <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse-slow" />
                <div className="h-4 bg-slate-700 rounded w-4/6 animate-pulse-slow" />
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-700 my-4" />

              {/* Options Skeleton */}
              <div className="space-y-3">
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700 animate-pulse-slow" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-700 rounded w-full animate-pulse-slow" />
                      <div className="h-3 bg-slate-700 rounded w-3/4 animate-pulse-slow" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700 animate-pulse-slow" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-700 rounded w-full animate-pulse-slow" />
                      <div className="h-3 bg-slate-700 rounded w-2/3 animate-pulse-slow" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading Message */}
              <p className="text-center text-vector-400 text-sm mt-6 animate-pulse">
                {loadingMessage}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="w-full max-w-sm">
            <div className="bg-red-950/30 border border-red-800 rounded-2xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={loadNextCard}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg transition-all"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Current Card */}
        {currentCard && !isLoading && !error && (
          <div
            key={cardKey}
            ref={cardRef}
            className="relative w-full max-w-sm cursor-grab active:cursor-grabbing touch-none select-none transition-transform duration-300 animate-card-enter"
            style={getCardStyle()}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
              {/* Context Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-vector-950 border border-vector-800 rounded-full text-vector-300 text-xs font-mono mb-4">
                <Zap className="w-3 h-3" />
                {currentCard.context}
              </div>

              {/* Scenario */}
              <p className="text-white text-lg font-medium leading-relaxed mb-6">
                {currentCard.scenario}
              </p>

              {/* Divider */}
              <div className="h-px bg-slate-700 my-4" />

              {/* Swipe hint */}
              <p className="text-center text-slate-500 text-xs mb-4">
                Swipe or tap to choose
              </p>

              {/* Options */}
              <div className="space-y-3">
                <button
                  onClick={() => handleChoice('A')}
                  disabled={isAnimating}
                  className="w-full text-left p-4 bg-slate-800/50 hover:bg-vector-900/30 border border-slate-700 hover:border-vector-600 rounded-xl transition-all group disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 text-xs font-bold group-hover:bg-vector-700 group-hover:border-vector-600 group-hover:text-white transition-all">
                      A
                    </span>
                    <span className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                      {currentCard.optionA}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleChoice('B')}
                  disabled={isAnimating}
                  className="w-full text-left p-4 bg-slate-800/50 hover:bg-indigo-900/30 border border-slate-700 hover:border-indigo-600 rounded-xl transition-all group disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400 text-xs font-bold group-hover:bg-indigo-700 group-hover:border-indigo-600 group-hover:text-white transition-all">
                      B
                    </span>
                    <span className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                      {currentCard.optionB}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="mt-6 text-center">
        <p className="text-slate-600 text-xs">
          There are no right or wrong answers. Go with your gut.
        </p>
      </div>
    </div>
  );
};
