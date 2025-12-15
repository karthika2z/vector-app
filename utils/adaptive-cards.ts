// Adaptive card generation guided by the tri-layer analysis framework

import { 
  VECTOR_SYSTEM_PROMPT, 
  createCardGenerationUserPrompt, 
  createAnalysisUserPrompt 
} from '../prompts';

export interface AdaptiveCard {
  id: number;
  context: string;
  scenario: string;
  optionA: string;
  optionB: string;
  targetDimension: string;
  targetAspect: string;
}

export interface CardChoice {
  cardId: number;
  choice: 'A' | 'B';
  reactionTimeMs: number;
  card: AdaptiveCard;
}

// The framework dimensions we need to cover
export const FRAMEWORK_DIMENSIONS = {
  innateDirection: {
    name: "Innate Direction",
    aspects: [
      "analytical_investigative",
      "creative_expressive", 
      "social_supportive",
      "practical_handson",
      "enterprising_vision",
      "structural_organizational"
    ],
    description: "Natural cognitive affinities and intrinsic interests"
  },
  behavioralOS: {
    name: "Behavioral Operating System",
    aspects: [
      "decision_making_style",
      "ambiguity_tolerance",
      "planning_vs_improvisation",
      "energy_rhythms",
      "focus_patterns",
      "collaboration_style",
      "confidence_calibration",
      "persistence_vs_adaptability"
    ],
    description: "How they actually move through life"
  },
  lifeTexture: {
    name: "Life Texture & Adjacent Forensics",
    aspects: [
      "risk_appetite",
      "motivation_drivers",
      "social_bandwidth",
      "stress_response",
      "reward_sensitivity",
      "autonomy_needs"
    ],
    description: "Contextual preferences and constraints"
  }
};

// Scenario themes to track for diversity
export const SCENARIO_THEMES = [
  "school_project", "social_event", "hobby_activity", "part_time_job",
  "creative_pursuit", "sports_activity", "volunteer_work", "family_situation",
  "friend_group", "personal_decision", "club_activity", "travel_plans"
] as const;

function formatPreviousChoices(choices: CardChoice[]): string {
  if (choices.length === 0) return "";

  return choices.map((c, i) => {
    const chose = c.choice === 'A' ? c.card.optionA : c.card.optionB;
    const time = (c.reactionTimeMs / 1000).toFixed(1);
    return `${i + 1}. "${c.card.context}: ${c.card.scenario}" → Chose: "${chose}" (${time}s) [Probed: ${c.card.targetAspect}]`;
  }).join('\n');
}

function extractUsedThemes(choices: CardChoice[]): string[] {
  // Extract keywords from previous scenarios to avoid repetition
  const themes: string[] = [];
  const keywords = [
    'study', 'project', 'party', 'trip', 'event', 'festival', 'game',
    'job', 'work', 'team', 'group', 'friend', 'family', 'class',
    'club', 'sport', 'volunteer', 'creative', 'art', 'music', 'plan'
  ];

  choices.forEach(c => {
    const text = `${c.card.context} ${c.card.scenario}`.toLowerCase();
    keywords.forEach(kw => {
      if (text.includes(kw) && !themes.includes(kw)) {
        themes.push(kw);
      }
    });
  });

  return themes;
}

function getAdaptationNotes(choices: CardChoice[], coveredAspects: Set<string>): string {
  if (choices.length === 0) {
    return "Start with an accessible, universally relatable scenario to ease them in.";
  }

  const recentChoices = choices.slice(-3);
  const avgTime = recentChoices.reduce((sum, c) => sum + c.reactionTimeMs, 0) / recentChoices.length;

  const notes: string[] = [];

  // Track used themes to avoid repetition
  const usedThemes = extractUsedThemes(choices);
  if (usedThemes.length > 0) {
    notes.push(`AVOID these themes/contexts already used: ${usedThemes.join(', ')}. Pick a COMPLETELY DIFFERENT scenario type.`);
  }

  if (avgTime < 3000) {
    notes.push("User decides quickly - they may be confident or impulsive. Consider a more nuanced scenario.");
  } else if (avgTime > 8000) {
    notes.push("User takes time to decide - they're thoughtful. Keep scenarios clear but substantive.");
  }

  const lastThree = choices.slice(-3);
  const allA = lastThree.every(c => c.choice === 'A');
  const allB = lastThree.every(c => c.choice === 'B');
  if (allA || allB) {
    notes.push("User has chosen the same option pattern recently. Create a scenario where the opposite choice might appeal to them.");
  }

  if (coveredAspects.size > 10) {
    notes.push("We've covered many aspects. Focus on areas with less clarity or potential contradictions.");
  }

  return notes.length > 0 ? notes.join(' ') : "Continue with natural flow.";
}

// Shuffle array using Fisher-Yates algorithm (seeded for consistency per session)
function shuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let m = shuffled.length;
  while (m) {
    const i = Math.floor((seed = (seed * 9301 + 49297) % 233280) / 233280 * m--);
    [shuffled[m], shuffled[i]] = [shuffled[i], shuffled[m]];
  }
  return shuffled;
}

// Generate a session seed once (persists for the assessment)
const sessionSeed = Date.now();

function selectNextTarget(choices: CardChoice[], coveredAspects: Set<string>): { dimension: string; aspect: string } {
  // Collect all uncovered aspects from all dimensions
  const uncovered: { dimKey: string; dimName: string; aspect: string }[] = [];

  for (const [dimKey, dim] of Object.entries(FRAMEWORK_DIMENSIONS)) {
    for (const aspect of dim.aspects) {
      const key = `${dimKey}.${aspect}`;
      if (!coveredAspects.has(key)) {
        uncovered.push({ dimKey, dimName: dim.name, aspect });
      }
    }
  }

  if (uncovered.length > 0) {
    // Shuffle uncovered aspects to get variety instead of always starting with analytical
    const shuffled = shuffleArray(uncovered, sessionSeed + choices.length);
    const selected = shuffled[0];
    return { dimension: selected.dimName, aspect: selected.aspect.replace(/_/g, ' ') };
  }

  // Fallback if all aspects covered
  const behavioralAspects = FRAMEWORK_DIMENSIONS.behavioralOS.aspects;
  const aspect = behavioralAspects[choices.length % behavioralAspects.length];
  return { dimension: "Behavioral Operating System", aspect: aspect.replace(/_/g, ' ') };
}

export async function generateNextCard(
  choices: CardChoice[],
  coveredAspects: Set<string>,
  apiKey: string
): Promise<AdaptiveCard> {
  const cardNumber = choices.length + 1;
  const target = selectNextTarget(choices, coveredAspects);
  
  const userPrompt = createCardGenerationUserPrompt(
    formatPreviousChoices(choices),
    target.dimension,
    target.aspect,
    cardNumber,
    getAdaptationNotes(choices, coveredAspects)
  );

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: VECTOR_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate card');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  let jsonStr = content;
  const jsonMatch = content.match(/```json?\n?([\s\S]*?)\n?```/);
  if (jsonMatch) jsonStr = jsonMatch[1];
  
  const parsed = JSON.parse(jsonStr);
  
  return {
    id: cardNumber,
    context: parsed.context,
    scenario: parsed.scenario,
    optionA: parsed.optionA,
    optionB: parsed.optionB,
    targetDimension: target.dimension,
    targetAspect: target.aspect,
  };
}

// Helper to format choices for analysis
export function formatChoicesForAnalysis(choices: CardChoice[]): { summary: string; timing: string } {
  const choicesSummary = choices.map((c, i) => {
    const chose = c.choice === 'A' ? c.card.optionA : c.card.optionB;
    const notChosen = c.choice === 'A' ? c.card.optionB : c.card.optionA;
    const time = (c.reactionTimeMs / 1000).toFixed(1);
    return `Card ${i + 1} [${c.card.targetDimension} → ${c.card.targetAspect}]:
  Situation: "${c.card.context}: ${c.card.scenario}"
  CHOSE: "${chose}" (${time}s)
  Rejected: "${notChosen}"`;
  }).join('\n\n');

  const fastDecisions = choices.filter(c => c.reactionTimeMs < 3000);
  const slowDecisions = choices.filter(c => c.reactionTimeMs > 7000);
  const avgTime = choices.reduce((sum, c) => sum + c.reactionTimeMs, 0) / choices.length;

  const timingPatterns = `- Average decision time: ${(avgTime / 1000).toFixed(1)}s
- Fast decisions (<3s): ${fastDecisions.length} cards${fastDecisions.length > 0 ? ` - Quick on: ${fastDecisions.map(c => c.card.targetAspect).join(', ')}` : ''}
- Slow decisions (>7s): ${slowDecisions.length} cards${slowDecisions.length > 0 ? ` - Deliberated on: ${slowDecisions.map(c => c.card.targetAspect).join(', ')}` : ''}`;

  return { summary: choicesSummary, timing: timingPatterns };
}
