export interface VectorProfile {
  archetype: string;
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
  adjacent_forensics: {
    insights: string[];
    inferred_traits: string[];
  };
  potential_roles_or_paths: string[];
  conflicts_or_unknowns: string[];
  disclaimers: string[];
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
