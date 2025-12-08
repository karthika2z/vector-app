export interface VectorProfile {
  archetype: string;
  archetype_emoji: string;
  tagline: string;
  top_drivers: string[];
  strength_signals: string[];
  interest_inclinations: string[];
  behavioral_tendencies: string[];
  motivational_patterns: string[];
  environmental_needs: string[];
  riasec_inferences: {
    realistic: number;
    investigative: number;
    artistic: number;
    social: number;
    enterprising: number;
    conventional: number;
  };
  psychometric_scores: {
    risk_tolerance: number;
    empathy_orientation: number;
    execution_bias: number;
    cognitive_flexibility: number;
    intrinsic_vs_extrinsic: number;
    decisiveness: number;
  };
  adjacent_forensics: {
    insights: string[];
    inferred_traits: string[];
  };
  potential_roles_or_paths: string[];
  conflicts_or_unknowns: string[];
  disclaimers: string[];
  // NEW: Career guidance for AI era
  career_guidance: {
    ai_resilient_strengths: string[];
    recommended_majors: Array<{
      name: string;
      fit_reason: string;
      ai_outlook: 'thriving' | 'evolving' | 'at_risk';
    }>;
    career_paths: Array<{
      title: string;
      description: string;
      why_you: string;
      salary_range: string;
      ai_outlook: 'thriving' | 'evolving' | 'at_risk';
      growth_potential: 'high' | 'medium' | 'low';
    }>;
    skills_to_develop: string[];
    avoid_these: string[];
    one_year_action: string;
    five_year_vision: string;
  };
}

export enum AppState {
  WELCOME = 'WELCOME',
  CARD_ASSESSMENT = 'CARD_ASSESSMENT',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  VOICE_DEEP_DIVE = 'VOICE_DEEP_DIVE',
}

export enum SessionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface ConnectionDetails {
  serverUrl: string;
  token: string;
  openaiApiKey: string;
}

// Card assessment types
export interface CardTraitScores {
  riskTolerance: number;
  empathy: number;
  execution: number;
  cognitiveStyle: number;
  motivation: number;
  avgReactionTime: number;
  decisivenessScore: number;
}
