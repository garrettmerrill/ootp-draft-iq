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
  "CON vL": string;
  "PBABIP vL": string;
  "HRR vL": string;
  // Pitching vs R
  "STU vR": string;
  "MOV vR": string;
  "CON vR": string;
  "PBABIP vR": string;
  "HRR vR": string;
  // Pitching Potential
  "STU P": string;
  "MOV P": string;
  "CON P": string; // Control potential (context dependent)
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
  scoutAccuracyBonus: number;
  signabilityBonus: number;
  ageClassBonus: number;
  positionBonus: number;
  ratingContributions: Record<string, number>;
  total: number;
}

// Draft Philosophy types

export interface DraftPhilosophy {
  // Global weights (must sum to 100)
  potentialWeight: number;
  overallWeight: number;
  riskWeight: number;
  scoutAccuracyWeight: number;
  signabilityWeight: number;
  ageClassWeight: number;
  
  // Preferences
  collegeVsHS: 'college' | 'hs' | 'neutral';
  collegeBonus: number;
  hsBonus: number;
  
  groundballVsFlyball: 'groundball' | 'flyball' | 'neutral';
  groundballBonus: number;
  flyballBonus: number;
  
  // Position priority (checkboxes)
  priorityPositions: string[];
  positionBonus: number;
  
  // Contact vs BABIP+K choice
  useBabipKs: boolean;
  
  // Batter rating weights (must sum to 100)
  batterWeights: {
    power: number;
    contact: number; // or babip+k combined
    babip: number;
    avoidK: number;
    eye: number;
    gap: number;
    speedDefense: number;
  };
  
  // SP rating weights (must sum to 100)
  spWeights: {
    stuff: number;
    movement: number;
    control: number;
    pBabip: number;
    hrRate: number;
    stamina: number;
    arsenal: number;
  };
  
  // RP/CL rating weights (must sum to 100)
  rpWeights: {
    stuff: number;
    movement: number;
    control: number;
    pBabip: number;
    hrRate: number;
    arsenal: number;
  };
  
  // Tier thresholds
  tierThresholds: {
    elite: number;      // 80+
    veryGood: number;   // 65+
    good: number;       // 50+
    average: number;    // 35+
    // Below average = filler
  };
}

export const DEFAULT_PHILOSOPHY: DraftPhilosophy = {
  potentialWeight: 40,
  overallWeight: 15,
  riskWeight: 15,
  scoutAccuracyWeight: 10,
  signabilityWeight: 10,
  ageClassWeight: 10,
  
  collegeVsHS: 'neutral',
  collegeBonus: 0,
  hsBonus: 0,
  
  groundballVsFlyball: 'neutral',
  groundballBonus: 0,
  flyballBonus: 0,
  
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
    speedDefense: 15,
  },
  
  spWeights: {
    stuff: 25,
    movement: 20,
    control: 20,
    pBabip: 10,
    hrRate: 10,
    stamina: 10,
    arsenal: 5,
  },
  
  rpWeights: {
    stuff: 30,
    movement: 25,
    control: 20,
    pBabip: 10,
    hrRate: 10,
    arsenal: 5,
  },
  
  tierThresholds: {
    elite: 80,
    veryGood: 65,
    good: 50,
    average: 35,
  },
};

// Presets
export const PHILOSOPHY_PRESETS: Record<string, Partial<DraftPhilosophy> & { name: string; description: string }> = {
  balanced: {
    name: 'Balanced',
    description: 'A well-rounded approach that values potential while managing risk.',
    ...DEFAULT_PHILOSOPHY,
  },
  highCeiling: {
    name: 'High Ceiling Gambler',
    description: 'Swing for the fences. Maximize upside, accept the risk.',
    potentialWeight: 60,
    overallWeight: 5,
    riskWeight: 5,
    scoutAccuracyWeight: 10,
    signabilityWeight: 10,
    ageClassWeight: 10,
    collegeVsHS: 'hs',
    hsBonus: 10,
    batterWeights: {
      power: 30,
      contact: 20,
      babip: 0,
      avoidK: 0,
      eye: 15,
      gap: 15,
      speedDefense: 20,
    },
    spWeights: {
      stuff: 30,
      movement: 20,
      control: 15,
      pBabip: 10,
      hrRate: 10,
      stamina: 10,
      arsenal: 5,
    },
  },
  safeSteady: {
    name: 'Safe & Steady',
    description: 'Minimize risk. Prefer polished, signable, college players.',
    potentialWeight: 25,
    overallWeight: 25,
    riskWeight: 20,
    scoutAccuracyWeight: 15,
    signabilityWeight: 10,
    ageClassWeight: 5,
    collegeVsHS: 'college',
    collegeBonus: 15,
  },
  pitchingHeavy: {
    name: 'Pitching Heavy',
    description: 'Build from the mound. Prioritize arms.',
    groundballVsFlyball: 'groundball',
    groundballBonus: 5,
    priorityPositions: ['SP', 'RP', 'CL'],
    spWeights: {
      stuff: 25,
      movement: 20,
      control: 20,
      pBabip: 10,
      hrRate: 10,
      stamina: 15,
      arsenal: 0,
    },
  },
  positionPlayerFocus: {
    name: 'Position Player Focus',
    description: 'Bats win championships. Prioritize hitting.',
    priorityPositions: ['C', 'SS', 'CF'],
    batterWeights: {
      power: 30,
      contact: 30,
      babip: 0,
      avoidK: 0,
      eye: 15,
      gap: 15,
      speedDefense: 10,
    },
  },
  premiumPositions: {
    name: 'Premium Positions',
    description: 'Focus on the positions that are hardest to fill.',
    priorityPositions: ['C', '2B', 'SS', '3B', 'CF', 'SP'],
    positionBonus: 15,
  },
  toolsOverProduction: {
    name: 'Tools Over Production',
    description: 'Raw athleticism and projectability over current polish.',
    potentialWeight: 50,
    overallWeight: 5,
    riskWeight: 10,
    scoutAccuracyWeight: 10,
    signabilityWeight: 10,
    ageClassWeight: 15,
    collegeVsHS: 'hs',
    hsBonus: 10,
    batterWeights: {
      power: 20,
      contact: 20,
      babip: 0,
      avoidK: 0,
      eye: 15,
      gap: 15,
      speedDefense: 30,
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
