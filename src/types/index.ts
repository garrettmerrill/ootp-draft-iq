// Player types matching the CSV structure

export interface RawPlayerCSV {
  ID: string;
  POS: string;
  Name: string;
  Nickname: string;
  Age: string;
  HT: string;
  WT: string;
  B: string;
  T: string;
  OVR: string;
  POT: string;
  LEA: string;
  LOY: string;
  AD: string;
  FIN: string;
  WE: string;
  INT: string;
  Prone: string;
  Schl: string;
  CommSch: string;
  COMP: string;
  HSC: string;
  // Batting ratings
  CON: string;
  BABIP: string;
  GAP: string;
  POW: string;
  EYE: string;
  "K's": string;
  // Batting vs L
  "BA vL": string;
  "CON vL": string;
  "GAP vL": string;
  "POW vL": string;
  "EYE vL": string;
  "K vL": string;
  // Batting vs R
  "BA vR": string;
  "CON vR": string;
  "GAP vR": string;
  "POW vR": string;
  "EYE vR": string;
  "K vR": string;
  // Batting Potential
  "HT P": string;
  "CON P": string;
  "GAP P": string;
  "POW P": string;
  "EYE P": string;
  "K P": string;
  // Batting tendencies
  BBT: string;
  GBT: string;
  FBT: string;
  // Pitching ratings
  STU: string;
  MOV: string;
  PBABIP: string;
  HRR: string;
  // Pitching vs L
  "STU vL": string;
  "MOV vL": string;
  "PBABIP vL": string;
  "HRR vL": string;
  // Pitching vs R
  "STU vR": string;
  "MOV vR": string;
  "PBABIP vR": string;
  "HRR vR": string;
  // Pitching Potential
  "STU P": string;
  "MOV P": string;
  "PBABIP P": string;
  "HRR P": string;
  // Pitch Arsenal
  FB: string;
  FBP: string;
  CH: string;
  CHP: string;
  CB: string;
  CBP: string;
  SL: string;
  SLP: string;
  SI: string;
  SIP: string;
  SP: string;
  SPP: string;
  CT: string;
  CTP: string;
  FO: string;
  FOP: string;
  CC: string;
  CCP: string;
  SC: string;
  SCP: string;
  KC: string;
  KCP: string;
  KN: string;
  KNP: string;
  // Pitching attributes
  "G/F": string;
  VELO: string;
  VT: string;
  Slot: string;
  PT: string;
  STM: string;
  HLD: string;
  // Defense
  "C ABI": string;
  "C FRM": string;
  "C ARM": string;
  "IF RNG": string;
  "IF ERR": string;
  "IF ARM": string;
  TDP: string;
  "OF RNG": string;
  "OF ERR": string;
  "OF ARM": string;
  // Position ratings
  C: string;
  "1B": string;
  "2B": string;
  "3B": string;
  SS: string;
  LF: string;
  CF: string;
  RF: string;
  // Position potential
  "C Pot": string;
  "1B Pot": string;
  "2B Pot": string;
  "3B Pot": string;
  "SS Pot": string;
  "LF Pot": string;
  "CF Pot": string;
  "RF Pot": string;
  // Speed
  SPE: string;
  SR: string;
  STE: string;
  RUN: string;
  // Signing
  DEM: string;
  Sign: string;
  SctAcc: string;
  Risk: string;
}

export interface BattingRatings {
  contact: number | null;
  babip: number | null;
  gap: number | null;
  power: number | null;
  eye: number | null;
  avoidK: number | null;
  contactVsL: number | null;
  gapVsL: number | null;
  powerVsL: number | null;
  eyeVsL: number | null;
  avoidKVsL: number | null;
  contactVsR: number | null;
  gapVsR: number | null;
  powerVsR: number | null;
  eyeVsR: number | null;
  avoidKVsR: number | null;
  babipPot: number | null;
  contactPot: number | null;
  gapPot: number | null;
  powerPot: number | null;
  eyePot: number | null;
  avoidKPot: number | null;
  battedBallType: string | null;
  groundBallTendency: string | null;
  flyBallTendency: string | null;
}

export interface PitchingRatings {
  stuff: number | null;
  movement: number | null;
  control: number | null;
  pBabip: number | null;
  hrRate: number | null;
  stuffVsL: number | null;
  movementVsL: number | null;
  controlVsL: number | null;
  pBabipVsL: number | null;
  hrRateVsL: number | null;
  stuffVsR: number | null;
  movementVsR: number | null;
  controlVsR: number | null;
  pBabipVsR: number | null;
  hrRateVsR: number | null;
  stuffPot: number | null;
  movementPot: number | null;
  controlPot: number | null;
  pBabipPot: number | null;
  hrRatePot: number | null;
  groundFlyRatio: string | null;
  velocity: string | null;
  velocityPotential: string | null;
  armSlot: string | null;
  pitcherType: string | null;
  stamina: number | null;
  holdRunners: number | null;
}

export interface PitchArsenal {
  fastball: number | null;
  fastballPot: number | null;
  changeup: number | null;
  changeupPot: number | null;
  curveball: number | null;
  curveballPot: number | null;
  slider: number | null;
  sliderPot: number | null;
  sinker: number | null;
  sinkerPot: number | null;
  splitter: number | null;
  splitterPot: number | null;
  cutter: number | null;
  cutterPot: number | null;
  forkball: number | null;
  forkballPot: number | null;
  circleChange: number | null;
  circleChangePot: number | null;
  screwball: number | null;
  screwballPot: number | null;
  knuckleCurve: number | null;
  knucleCurvePot: number | null;
  knuckleball: number | null;
  knuckleballPot: number | null;
}

export interface DefenseRatings {
  catcherAbility: number | null;
  catcherFraming: number | null;
  catcherArm: number | null;
  infieldRange: number | null;
  infieldError: number | null;
  infieldArm: number | null;
  turnDoublePlay: number | null;
  outfieldRange: number | null;
  outfieldError: number | null;
  outfieldArm: number | null;
  catcher: number | null;
  firstBase: number | null;
  secondBase: number | null;
  thirdBase: number | null;
  shortstop: number | null;
  leftField: number | null;
  centerField: number | null;
  rightField: number | null;
  catcherPot: number | null;
  firstBasePot: number | null;
  secondBasePot: number | null;
  thirdBasePot: number | null;
  shortstopPot: number | null;
  leftFieldPot: number | null;
  centerFieldPot: number | null;
  rightFieldPot: number | null;
}

export interface SpeedRatings {
  speed: number | null;
  stealingAggression: number | null;
  stealingAbility: number | null;
  baserunning: number | null;
}

export interface Player {
  id: string;
  odraftId: string;
  position: string;
  name: string;
  nickname: string | null;
  age: number;
  height: string;
  weight: string;
  bats: string;
  throws: string;
  overall: number;
  potential: number;
  
  // Personality
  leadership: string | null;
  loyalty: string | null;
  adaptability: string | null;
  financialAmbition: string | null;
  workEthic: string | null;
  intelligence: string | null;
  injuryProne: string | null;
  
  // Background
  school: string | null;
  committedSchool: string | null;
  competitionLevel: string | null;
  highSchoolClass: string | null;
  
  // Ratings
  battingRatings: BattingRatings | null;
  pitchingRatings: PitchingRatings | null;
  pitchArsenal: PitchArsenal | null;
  defenseRatings: DefenseRatings | null;
  speedRatings: SpeedRatings | null;
  
  // Signing
  demandAmount: string | null;
  signability: string | null;
  scoutAccuracy: string | null;
  risk: string | null;
  
  // Calculated
  compositeScore: number | null;
  tier: Tier | null;
  isSleeper: boolean;
  sleeperScore: number | null;
  archetypes: string[];
  redFlags: string[];
  greenFlags: string[];
  hasSplitsIssues: boolean;
  isTwoWay: boolean;
  
  // User preferences
  isNotInterested: boolean;
  
  // Draft status
  isDrafted: boolean;
  draftRound: number | null;
  draftPick: number | null;
  draftTeam: string | null;
  
  // Rankings info
  ranking?: {
    id: string;
    tier: number;
    rankInTier: number;
  } | null;
  
  // Explanation
  scoreBreakdown?: ScoreBreakdown;
  similarPlayers?: string[];
}

// Ranking types
export interface UserRanking {
  id: string;
  odraftId: string;
  playerId: string;
  tier: number;
  rankInTier: number;
  player: Player;
}

export interface TierNames {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}

export const DEFAULT_TIER_NAMES: TierNames = {
  1: 'Must Have',
  2: 'Priority',
  3: 'Target',
  4: 'Value',
  5: 'Flier',
};

export type Tier = 'Elite' | 'Very Good' | 'Good' | 'Average' | 'Filler';

export interface ScoreBreakdown {
  potentialContribution: number;
  overallContribution: number;
  skillsContribution: number;
  riskPenalty: number;
  positionBonus: number;
  personalityAdjustment: number;
  otherBonuses: number;
  ratingContributions: Record<string, number>;
  total: number;
}

// ==================== CUTOFFS ====================
// Cutoffs are hard minimums - players failing ANY cutoff get score = 0

export interface PhilosophyCutoffs {
  // Batter rating minimums (applied to potential ratings)
  batterCutoffs: {
    contact: number | null;
    power: number | null;
    eye: number | null;
    gap: number | null;
    speed: number | null;
    defense: number | null;
  };
  
  // Pitcher rating minimums (applied to potential ratings)
  pitcherCutoffs: {
    stuff: number | null;
    movement: number | null;
    control: number | null;
    stamina: number | null;
  };
  
  // Personality cutoffs (true = exclude players with this trait)
  personalityCutoffs: {
    noLowWorkEthic: boolean;
    noLowIntelligence: boolean;
    noLowAdaptability: boolean;
    noInjuryProne: boolean;
  };
  
  // Risk cutoff - max acceptable risk level (null = no cutoff)
  // 'Normal' = only normal risk, 'Medium' = normal or medium, etc.
  maxRisk: 'Normal' | 'Medium' | 'High' | null;
  
  // Overall/Potential minimums
  minPotential: number | null;
  minOverall: number | null;
}

export const DEFAULT_CUTOFFS: PhilosophyCutoffs = {
  batterCutoffs: {
    contact: null,
    power: null,
    eye: null,
    gap: null,
    speed: null,
    defense: null,
  },
  pitcherCutoffs: {
    stuff: null,
    movement: null,
    control: null,
    stamina: null,
  },
  personalityCutoffs: {
    noLowWorkEthic: false,
    noLowIntelligence: false,
    noLowAdaptability: false,
    noInjuryProne: false,
  },
  maxRisk: null,
  minPotential: null,
  minOverall: null,
};

// ==================== DRAFT PHILOSOPHY ====================
// 
// HOW PLAYER SCORES ARE CALCULATED:
// 
// The composite score (0-100+) comes from three parts:
// 
// 1. BASE SCORE (POT + OVR weights, should sum to ~60-80%):
//    - POT Weight: What % of score comes from potential rating (20-80 → 0-100)
//    - OVR Weight: What % of score comes from overall rating
//    - The remaining % comes from individual skill ratings
// 
// 2. SKILLS (the leftover % after POT + OVR):
//    - Batters: Weighted average of Power, Contact, Eye, Gap, Speed, Defense potentials
//    - Pitchers: Weighted average of Stuff, Movement/PBABIP, Control, Stamina, Arsenal
// 
// 3. ADJUSTMENTS (flat bonuses/penalties added to the score):
//    - Risk: High/Very High risk players lose points
//    - Position: Priority positions get bonus points
//    - Personality: Work ethic, intelligence, durability, etc.
//    - Preferences: College/HS, batter type, pitcher type bonuses
// 
// EXAMPLE: 70 POT / 35 OVR SS with High Work Ethic, default weights:
//   POT (40%): 70 → 83.3 normalized × 40% = 33.3 pts
//   OVR (20%): 35 → 25.0 normalized × 20% = 5.0 pts  
//   Skills (40%): Weighted avg of tools × 40% = ~30 pts
//   Adjustments: +5 High Work Ethic, +5 SS position = +10 pts
//   TOTAL: ~78 points → "Elite" tier

export interface DraftPhilosophy {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  isPreset: boolean;
  
  // Hard cutoffs - players failing ANY cutoff get score = 0
  cutoffs: PhilosophyCutoffs;
  
  // Base weights (POT + OVR should sum to 60-80, remainder goes to skills)
  potentialWeight: number;  // % of score from POT rating
  overallWeight: number;    // % of score from OVR rating
  // Skills automatically get (100 - potentialWeight - overallWeight)%
  
  // Risk penalties (flat points subtracted)
  riskPenalties: {
    veryHigh: number;
    high: number;
    medium: number;
  };
  
  // Personality bonuses (flat points added)
  personalityBonuses: {
    highWorkEthic: number;
    highIntelligence: number;
    leadership: number;
    highAdaptability: number;
    durable: number;
  };
  
  // Personality penalties (flat points subtracted)
  personalityPenalties: {
    lowWorkEthic: number;
    lowIntelligence: number;
    lowAdaptability: number;
    injuryProne: number;
  };
  
  // Preferences
  collegeVsHS: 'college' | 'hs' | 'neutral';
  collegeHSBonus: number;
  
  preferredBatterTypes: string[];
  batterTypeBonus: number;
  
  preferredPitcherTypes: string[];
  pitcherTypeBonus: number;
  
  priorityPositions: string[];
  positionBonus: number;
  
  // Batter rating weights (should sum to 100)
  useBabipKs: boolean;
  batterWeights: {
    power: number;
    contact: number;
    babip: number;
    avoidK: number;
    eye: number;
    gap: number;
    speed: number;
    defense: number;
  };
  
  // SP rating weights (should sum to 100)
  useMovementSP: boolean;
  spWeights: {
    stuff: number;
    movement: number;
    control: number;
    pBabip: number;
    hrRate: number;
    stamina: number;
    arsenal: number;
  };
  
  // RP/CL rating weights (should sum to 100)
  useMovementRP: boolean;
  rpWeights: {
    stuff: number;
    movement: number;
    control: number;
    pBabip: number;
    hrRate: number;
    arsenal: number;
  };
  
  // Tier thresholds (score needed for each tier)
  tierThresholds: {
    elite: number;
    veryGood: number;
    good: number;
    average: number;
  };
}

export const DEFAULT_PHILOSOPHY: DraftPhilosophy = {
  name: 'Default',
  description: 'Balanced approach emphasizing individual tools with development factor',
  isActive: true,
  isPreset: false,
  
  cutoffs: DEFAULT_CUTOFFS,
  
  potentialWeight: 25,
  overallWeight: 10,
  
  riskPenalties: {
    veryHigh: 15,
    high: 10,
    medium: 5,
  },
  
  personalityBonuses: {
    highWorkEthic: 5,
    highIntelligence: 3,
    leadership: 2,
    highAdaptability: 2,
    durable: 3,
  },
  
  personalityPenalties: {
    lowWorkEthic: 8,
    lowIntelligence: 3,
    lowAdaptability: 2,
    injuryProne: 5,
  },
  
  collegeVsHS: 'neutral',
  collegeHSBonus: 5,
  
  preferredBatterTypes: [],
  batterTypeBonus: 3,
  
  preferredPitcherTypes: [],
  pitcherTypeBonus: 3,
  
  priorityPositions: [],
  positionBonus: 5,
  
  useBabipKs: false,
  batterWeights: {
    power: 25,
    contact: 25,
    babip: 15,
    avoidK: 10,
    eye: 15,
    gap: 10,
    speed: 10,
    defense: 15,
  },
  
  useMovementSP: true,
  spWeights: {
    stuff: 30,
    movement: 25,
    control: 20,
    pBabip: 15,
    hrRate: 10,
    stamina: 15,
    arsenal: 10,
  },
  
  useMovementRP: true,
  rpWeights: {
    stuff: 35,
    movement: 25,
    control: 20,
    pBabip: 15,
    hrRate: 10,
    arsenal: 15,
  },
  
  tierThresholds: {
    elite: 75,
    veryGood: 60,
    good: 45,
    average: 30,
  },
};

export const PHILOSOPHY_PRESETS: Record<string, DraftPhilosophy> = {
  balanced: {
    ...DEFAULT_PHILOSOPHY,
    name: 'Balanced',
    description: 'Balanced approach with development factor',
    isActive: false,
    isPreset: true,
  },
  highCeiling: {
    ...DEFAULT_PHILOSOPHY,
    name: 'High Ceiling',
    description: 'Chase upside, accept risk',
    isActive: false,
    isPreset: true,
    potentialWeight: 35,
    overallWeight: 5,
    riskPenalties: { veryHigh: 8, high: 5, medium: 2 },
    collegeVsHS: 'hs',
    collegeHSBonus: 5,
    batterWeights: {
      power: 30, contact: 20, babip: 15, avoidK: 10,
      eye: 10, gap: 10, speed: 15, defense: 5,
    },
    spWeights: {
      stuff: 35, movement: 25, control: 15,
      pBabip: 15, hrRate: 10, stamina: 15, arsenal: 10,
    },
  },
  safePicks: {
    ...DEFAULT_PHILOSOPHY,
    name: 'Safe Picks',
    description: 'Polished players, minimize bust risk',
    isActive: false,
    isPreset: true,
    potentialWeight: 20,
    overallWeight: 25,
    riskPenalties: { veryHigh: 20, high: 15, medium: 8 },
    personalityBonuses: {
      highWorkEthic: 8, highIntelligence: 5,
      leadership: 3, highAdaptability: 3, durable: 5,
    },
    collegeVsHS: 'college',
    collegeHSBonus: 8,
  },
  toolsFirst: {
    ...DEFAULT_PHILOSOPHY,
    name: 'Tools First',
    description: 'Raw athleticism over polish',
    isActive: false,
    isPreset: true,
    potentialWeight: 20,
    overallWeight: 5,
    batterWeights: {
      power: 25, contact: 15, babip: 10, avoidK: 10,
      eye: 10, gap: 10, speed: 25, defense: 20,
    },
  },
  premiumPositions: {
    ...DEFAULT_PHILOSOPHY,
    name: 'Premium Positions',
    description: 'Up-the-middle and SP focus',
    isActive: false,
    isPreset: true,
    priorityPositions: ['C', 'SS', '2B', 'CF', 'SP'],
    positionBonus: 10,
  },
  pitchingFirst: {
    ...DEFAULT_PHILOSOPHY,
    name: 'Pitching First',
    description: 'Build from the mound',
    isActive: false,
    isPreset: true,
    priorityPositions: ['SP', 'RP', 'CL'],
    positionBonus: 8,
    preferredPitcherTypes: ['GB', 'EX GB'],
    pitcherTypeBonus: 5,
  },
};

// Archetype definitions
export const BATTER_ARCHETYPES = [
  'Power Bat',
  'Contact Hitter',
  'Five-Tool Player',
  'Toolsy OF',
  'Defensive SS',
  'Defensive C',
  'Speed Threat',
  'Patient Hitter',
  'Raw Power',
  'Utility Player',
  'Glove-First',
  'Balanced Hitter',
] as const;

export const PITCHER_ARCHETYPES = [
  'Ace Potential',
  'Mid-Rotation Starter',
  'Back-End Starter',
  'Power Arm',
  'Groundball Specialist',
  'Strikeout Artist',
  'Control Pitcher',
  'Closer Material',
  'Fastball-Only',
  'Elite Arsenal',
  'Sidearmer',
] as const;

export type BatterArchetype = typeof BATTER_ARCHETYPES[number];
export type PitcherArchetype = typeof PITCHER_ARCHETYPES[number];

// Flag types
export const RED_FLAGS = [
  'High Risk',
  'Injury Prone',
  'Low Work Ethic',
  'Hard to Scout',
  'Low Intelligence',
  'Low Adaptability',
  'High Demand',
] as const;

export const GREEN_FLAGS = [
  'Low Risk',
  'Durable',
  'High Work Ethic',
  'High Intelligence',
  'Leader',
  'High Adaptability',
] as const;

export type RedFlag = typeof RED_FLAGS[number];
export type GreenFlag = typeof GREEN_FLAGS[number];

// Position constants
export const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SP', 'RP', 'CL'] as const;
export const PREMIUM_POSITIONS = ['C', '2B', 'SS', '3B', 'CF'] as const;
export const PITCHER_POSITIONS = ['SP', 'RP', 'CL'] as const;
export const BATTER_POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'] as const;

export type Position = typeof POSITIONS[number];

// Stats Plus API types
export interface StatsPlusDraftPick {
  round: number;
  pick: number;
  overall: number;
  team: string;
  player: string;
  playerId?: string;
}

// Filter types
export interface PlayerFilters {
  positions: string[];
  minPotential: number | null;
  maxPotential: number | null;
  minOverall: number | null;
  maxOverall: number | null;
  tiers: Tier[];
  archetypes: string[];
  showDrafted: boolean;
  showSleepersOnly: boolean;
  showTwoWayOnly: boolean;
  showNotInterested: boolean;
  collegeOnly: boolean;
  hsOnly: boolean;
  maxDemand: number | null;
  searchQuery: string;
}

export const DEFAULT_FILTERS: PlayerFilters = {
  positions: [],
  minPotential: null,
  maxPotential: null,
  minOverall: null,
  maxOverall: null,
  tiers: [],
  archetypes: [],
  showDrafted: false,
  showSleepersOnly: false,
  showTwoWayOnly: false,
  showNotInterested: false,
  collegeOnly: false,
  hsOnly: false,
  maxDemand: null,
  searchQuery: '',
};
