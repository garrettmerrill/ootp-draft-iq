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
  "HT P": string; // BABIP Potential
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
  // Note: CON appears twice (batting and pitching control)
  PBABIP: string;
  HRR: string;
  // Pitching vs L
  "STU vL": string;
  "MOV vL": string;
  // "CON vL" is shared with batting contact vs L
  "PBABIP vL": string;
  "HRR vL": string;
  // Pitching vs R
  "STU vR": string;
  "MOV vR": string;
  // "CON vR" is shared with batting contact vs R
  "PBABIP vR": string;
  "HRR vR": string;
  // Pitching Potential
  "STU P": string;
  "MOV P": string;
  // "CON P" is shared with batting contact potential (context dependent)
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
  VT: string; // Velocity Potential
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
  // vs Left
  contactVsL: number | null;
  gapVsL: number | null;
  powerVsL: number | null;
  eyeVsL: number | null;
  avoidKVsL: number | null;
  // vs Right
  contactVsR: number | null;
  gapVsR: number | null;
  powerVsR: number | null;
  eyeVsR: number | null;
  avoidKVsR: number | null;
  // Potential
  babipPot: number | null;
  contactPot: number | null;
  gapPot: number | null;
  powerPot: number | null;
  eyePot: number | null;
  avoidKPot: number | null;
  // Tendencies
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
  // vs Left
  stuffVsL: number | null;
  movementVsL: number | null;
  controlVsL: number | null;
  pBabipVsL: number | null;
  hrRateVsL: number | null;
  // vs Right
  stuffVsR: number | null;
  movementVsR: number | null;
  controlVsR: number | null;
  pBabipVsR: number | null;
  hrRateVsR: number | null;
  // Potential
  stuffPot: number | null;
  movementPot: number | null;
  controlPot: number | null;
  pBabipPot: number | null;
  hrRatePot: number | null;
  // Attributes
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
  // Catcher
  catcherAbility: number | null;
  catcherFraming: number | null;
  catcherArm: number | null;
  // Infield
  infieldRange: number | null;
  infieldError: number | null;
  infieldArm: number | null;
  turnDoublePlay: number | null;
  // Outfield
  outfieldRange: number | null;
  outfieldError: number | null;
  outfieldArm: number | null;
  // Position ratings
  catcher: number | null;
  firstBase: number | null;
  secondBase: number | null;
  thirdBase: number | null;
  shortstop: number | null;
  leftField: number | null;
  centerField: number | null;
  rightField: number | null;
  // Position potential
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
  
  // Draft status
  isDrafted: boolean;
  draftRound: number | null;
  draftPick: number | null;
  draftTeam: string | null;
  
  // Explanation
  scoreBreakdown?: ScoreBreakdown;
  similarPlayers?: string[];
}

export type Tier = 'Elite' | 'Very Good' | 'Good' | 'Average' | 'Filler';

export interface ScoreBreakdown {
  potentialContribution: number;
  overallContribution: number;
  riskPenalty: number;
  signabilityBonus: number;
  positionBonus: number;
  ratingContributions: Record<string, number>;
  total: number;
}

// CORRECTED DRAFT PHILOSOPHY TYPES
// Replace the existing DraftPhilosophy interface, DEFAULT_PHILOSOPHY, and PHILOSOPHY_PRESETS
// with this code in your src/types/index.ts file

export interface DraftPhilosophy {
  id?: string; // Optional for new philosophies
  name: string;
  description?: string;
  isActive: boolean;
  isPreset: boolean; // True for built-in presets
  
  // Global weights (must sum to 100)
  potentialWeight: number;
  overallWeight: number;
  riskWeight: number;
  signabilityWeight: number;
  
  // Preferences
  collegeVsHS: 'college' | 'hs' | 'neutral';
  collegeHSBonus: number; // Single bonus field
  
  // Batter batted ball types (multi-select)
  preferredBatterTypes: string[]; // ['Flyball', 'Line Drive', 'Normal', 'Groundball']
  batterTypeBonus: number;
  
  // Pitcher ground/fly types (multi-select)
  preferredPitcherTypes: string[]; // ['EX GB', 'GB', 'NEU', 'FB', 'EX FB']
  pitcherTypeBonus: number;
  
  // Position priority (multi-select)
  priorityPositions: string[];
  positionBonus: number;
  
  // Contact vs BABIP+K choice
  useBabipKs: boolean;
  
  // Batter rating weights (must sum to 100)
  batterWeights: {
    power: number;
    contact: number; // Used when useBabipKs = false
    babip: number;    // Used when useBabipKs = true
    avoidK: number;   // Used when useBabipKs = true
    eye: number;
    gap: number;
    speed: number;    // Split from speedDefense
    defense: number;  // Split from speedDefense
  };
  
  // SP rating weights (must sum to 100)
  useMovementSP: boolean; // Toggle for SP
  spWeights: {
    stuff: number;
    movement: number; // Used when useMovementSP = true
    control: number;
    pBabip: number;   // Used when useMovementSP = false
    hrRate: number;   // Used when useMovementSP = false
    stamina: number;
    arsenal: number;
  };
  
  // RP/CL rating weights (must sum to 100)
  useMovementRP: boolean; // Toggle for RP
  rpWeights: {
    stuff: number;
    movement: number; // Used when useMovementRP = true
    control: number;
    pBabip: number;   // Used when useMovementRP = false
    hrRate: number;   // Used when useMovementRP = false
    arsenal: number;
  };
  
  // Tier thresholds
  tierThresholds: {
    elite: number;
    veryGood: number;
    good: number;
    average: number;
  };
}

export const DEFAULT_PHILOSOPHY: DraftPhilosophy = {
  name: 'Default',
  description: 'Balanced approach',
  isActive: true,
  isPreset: false,
  
  potentialWeight: 50,
  overallWeight: 20,
  riskWeight: 15,
  signabilityWeight: 15,
  
  collegeVsHS: 'neutral',
  collegeHSBonus: 5,
  
  preferredBatterTypes: [],
  batterTypeBonus: 5,
  
  preferredPitcherTypes: [],
  pitcherTypeBonus: 5,
  
  priorityPositions: [],
  positionBonus: 10,
  
  useBabipKs: false,
  
  batterWeights: {
    power: 25,
    contact: 25,
    babip: 0,
    avoidK: 0,
    eye: 20,
    gap: 15,
    speed: 10,
    defense: 5,
  },
  
  useMovementSP: false,
  spWeights: {
    stuff: 25,
    movement: 0,
    control: 20,
    pBabip: 15,
    hrRate: 15,
    stamina: 20,
    arsenal: 5,
  },
  
  useMovementRP: false,
  rpWeights: {
    stuff: 30,
    movement: 0,
    control: 20,
    pBabip: 20,
    hrRate: 20,
    arsenal: 10,
  },
  
  tierThresholds: {
    elite: 80,
    veryGood: 65,
    good: 50,
    average: 35,
  },
};

// Presets  
type PhilosophyBase = Omit<DraftPhilosophy, 'name' | 'description' | 'isActive' | 'isPreset'>;
const defaultPhilosophyBase: PhilosophyBase = {
  potentialWeight: DEFAULT_PHILOSOPHY.potentialWeight,
  overallWeight: DEFAULT_PHILOSOPHY.overallWeight,
  riskWeight: DEFAULT_PHILOSOPHY.riskWeight,
  signabilityWeight: DEFAULT_PHILOSOPHY.signabilityWeight,
  collegeVsHS: DEFAULT_PHILOSOPHY.collegeVsHS,
  collegeHSBonus: DEFAULT_PHILOSOPHY.collegeHSBonus,
  preferredBatterTypes: DEFAULT_PHILOSOPHY.preferredBatterTypes,
  batterTypeBonus: DEFAULT_PHILOSOPHY.batterTypeBonus,
  preferredPitcherTypes: DEFAULT_PHILOSOPHY.preferredPitcherTypes,
  pitcherTypeBonus: DEFAULT_PHILOSOPHY.pitcherTypeBonus,
  priorityPositions: DEFAULT_PHILOSOPHY.priorityPositions,
  positionBonus: DEFAULT_PHILOSOPHY.positionBonus,
  useBabipKs: DEFAULT_PHILOSOPHY.useBabipKs,
  batterWeights: DEFAULT_PHILOSOPHY.batterWeights,
  useMovementSP: DEFAULT_PHILOSOPHY.useMovementSP,
  spWeights: DEFAULT_PHILOSOPHY.spWeights,
  useMovementRP: DEFAULT_PHILOSOPHY.useMovementRP,
  rpWeights: DEFAULT_PHILOSOPHY.rpWeights,
  tierThresholds: DEFAULT_PHILOSOPHY.tierThresholds,
};

export const PHILOSOPHY_PRESETS: Record<string, DraftPhilosophy> = {
  balanced: {
    ...defaultPhilosophyBase,
    name: 'Balanced',
    description: 'A well-rounded approach',
    isActive: false,
    isPreset: true,
  },
  highCeiling: {
    ...defaultPhilosophyBase,
    name: 'High Ceiling',
    description: 'Maximize upside, accept risk',
    isActive: false,
    isPreset: true,
    potentialWeight: 60,
    overallWeight: 10,
    riskWeight: 10,
    signabilityWeight: 20,
    collegeVsHS: 'hs',
    collegeHSBonus: 10,
    preferredBatterTypes: [],
    batterTypeBonus: 5,
    preferredPitcherTypes: [],
    pitcherTypeBonus: 5,
    priorityPositions: [],
    positionBonus: 10,
    useBabipKs: false,
    batterWeights: {
      power: 30,
      contact: 20,
      babip: 0,
      avoidK: 0,
      eye: 15,
      gap: 15,
      speed: 15,
      defense: 5,
    },
    useMovementSP: false,
    spWeights: {
      stuff: 30,
      movement: 0,
      control: 15,
      pBabip: 15,
      hrRate: 15,
      stamina: 20,
      arsenal: 5,
    },
    useMovementRP: false,
    rpWeights: {
      stuff: 35,
      movement: 0,
      control: 15,
      pBabip: 20,
      hrRate: 20,
      arsenal: 10,
    },
    tierThresholds: {
      elite: 80,
      veryGood: 65,
      good: 50,
      average: 35,
    },
  },
  safeSteady: {
    ...defaultPhilosophyBase,
    name: 'Safe & Steady',
    description: 'Minimize risk, prefer polished players',
    isActive: false,
    isPreset: true,
    potentialWeight: 25,
    overallWeight: 35,
    riskWeight: 25,
    signabilityWeight: 15,
    collegeVsHS: 'college',
    collegeHSBonus: 15,
    preferredBatterTypes: [],
    batterTypeBonus: 5,
    preferredPitcherTypes: [],
    pitcherTypeBonus: 5,
    priorityPositions: [],
    positionBonus: 10,
    useBabipKs: false,
    batterWeights: {
      power: 20,
      contact: 30,
      babip: 0,
      avoidK: 0,
      eye: 25,
      gap: 15,
      speed: 5,
      defense: 5,
    },
    useMovementSP: false,
    spWeights: {
      stuff: 20,
      movement: 0,
      control: 25,
      pBabip: 20,
      hrRate: 15,
      stamina: 15,
      arsenal: 5,
    },
    useMovementRP: false,
    rpWeights: {
      stuff: 25,
      movement: 0,
      control: 25,
      pBabip: 20,
      hrRate: 20,
      arsenal: 10,
    },
    tierThresholds: {
      elite: 80,
      veryGood: 65,
      good: 50,
      average: 35,
    },
  },
  pitchingHeavy: {
    ...defaultPhilosophyBase,
    name: 'Pitching Heavy',
    description: 'Build from the mound',
    isActive: false,
    isPreset: true,
    preferredPitcherTypes: ['GB', 'EX GB'],
    pitcherTypeBonus: 10,
    priorityPositions: ['SP', 'RP', 'CL'],
    positionBonus: 15,
  },
  positionPlayerFocus: {
    ...defaultPhilosophyBase,
    name: 'Position Player Focus',
    description: 'Bats win championships',
    isActive: false,
    isPreset: true,
    priorityPositions: ['C', 'SS', 'CF'],
    positionBonus: 15,
    batterWeights: {
      power: 30,
      contact: 25,
      babip: 0,
      avoidK: 0,
      eye: 20,
      gap: 15,
      speed: 5,
      defense: 5,
    },
  },
  premiumPositions: {
    ...defaultPhilosophyBase,
    name: 'Premium Positions',
    description: 'Focus on hard-to-fill positions',
    isActive: false,
    isPreset: true,
    priorityPositions: ['C', '2B', 'SS', '3B', 'CF', 'SP'],
    positionBonus: 20,
  },
  toolsOverProduction: {
    ...defaultPhilosophyBase,
    name: 'Tools Over Production',
    description: 'Raw athleticism and projectability',
    isActive: false,
    isPreset: true,
    potentialWeight: 55,
    overallWeight: 10,
    riskWeight: 15,
    signabilityWeight: 20,
    collegeVsHS: 'hs',
    collegeHSBonus: 10,
    preferredBatterTypes: [],
    batterTypeBonus: 5,
    preferredPitcherTypes: [],
    pitcherTypeBonus: 5,
    priorityPositions: [],
    positionBonus: 10,
    useBabipKs: false,
    batterWeights: {
      power: 20,
      contact: 15,
      babip: 0,
      avoidK: 0,
      eye: 15,
      gap: 15,
      speed: 20,
      defense: 15,
    },
    useMovementSP: false,
    spWeights: {
      stuff: 30,
      movement: 0,
      control: 15,
      pBabip: 15,
      hrRate: 15,
      stamina: 20,
      arsenal: 5,
    },
    useMovementRP: false,
    rpWeights: {
      stuff: 35,
      movement: 0,
      control: 15,
      pBabip: 20,
      hrRate: 20,
      arsenal: 10,
    },
    tierThresholds: {
      elite: 80,
      veryGood: 65,
      good: 50,
      average: 35,
    },
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
  'High Demand',
] as const;

export const GREEN_FLAGS = [
  'Low Risk',
  'Durable',
  'High Work Ethic',
  'Easy to Scout',
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
  collegeOnly: false,
  hsOnly: false,
  maxDemand: null,
  searchQuery: '',
};
