import Papa from 'papaparse';
import {
  RawPlayerCSV,
  Player,
  BattingRatings,
  PitchingRatings,
  PitchArsenal,
  DefenseRatings,
  SpeedRatings,
  PITCHER_POSITIONS,
} from '@/types';

// Parse a rating value, returning null for non-numeric values
function parseRating(value: string | undefined): number | null {
  if (!value || value === '-' || value === '') return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
}

// Parse the CSV file
export function parseCSV(file: File): Promise<RawPlayerCSV[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawPlayerCSV>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

// Convert raw CSV data to our Player type
export function convertCSVToPlayer(raw: RawPlayerCSV): Omit<Player, 'id' | 'compositeScore' | 'tier' | 'isSleeper' | 'sleeperScore' | 'archetypes' | 'redFlags' | 'greenFlags' | 'hasSplitsIssues' | 'isTwoWay' | 'scoreBreakdown' | 'similarPlayers'> {
  const isPitcher = PITCHER_POSITIONS.includes(raw.POS as any);
  
  // Parse batting ratings
  const battingRatings: BattingRatings = {
    contact: parseRating(raw.CON),
    babip: parseRating(raw.BABIP),
    gap: parseRating(raw.GAP),
    power: parseRating(raw.POW),
    eye: parseRating(raw.EYE),
    avoidK: parseRating(raw["K's"]),
    // vs Left
    contactVsL: parseRating(raw["CON vL"]),
    gapVsL: parseRating(raw["GAP vL"]),
    powerVsL: parseRating(raw["POW vL"]),
    eyeVsL: parseRating(raw["EYE vL"]),
    avoidKVsL: parseRating(raw["K vL"]),
    // vs Right
    contactVsR: parseRating(raw["CON vR"]),
    gapVsR: parseRating(raw["GAP vR"]),
    powerVsR: parseRating(raw["POW vR"]),
    eyeVsR: parseRating(raw["EYE vR"]),
    avoidKVsR: parseRating(raw["K vR"]),
    // Potential
    babipPot: parseRating(raw["HT P"]), // HT P is BABIP Potential
    contactPot: parseRating(raw["CON P"]),
    gapPot: parseRating(raw["GAP P"]),
    powerPot: parseRating(raw["POW P"]),
    eyePot: parseRating(raw["EYE P"]),
    avoidKPot: parseRating(raw["K P"]),
    // Tendencies
    battedBallType: raw.BBT || null,
    groundBallTendency: raw.GBT || null,
    flyBallTendency: raw.FBT || null,
  };

  // For pitching ratings, we need to handle the duplicate CON column
  // The pitching control is in a different position in the CSV
  // We'll use context to determine which CON to use
  const pitchingRatings: PitchingRatings = {
    stuff: parseRating(raw.STU),
    movement: parseRating(raw.MOV),
    control: parseRating(raw.CON), // This will be the pitching control for pitchers
    pBabip: parseRating(raw.PBABIP),
    hrRate: parseRating(raw.HRR),
    // vs Left
    stuffVsL: parseRating(raw["STU vL"]),
    movementVsL: parseRating(raw["MOV vL"]),
    controlVsL: parseRating(raw["CON vL"]),
    pBabipVsL: parseRating(raw["PBABIP vL"]),
    hrRateVsL: parseRating(raw["HRR vL"]),
    // vs Right
    stuffVsR: parseRating(raw["STU vR"]),
    movementVsR: parseRating(raw["MOV vR"]),
    controlVsR: parseRating(raw["CON vR"]),
    pBabipVsR: parseRating(raw["PBABIP vR"]),
    hrRateVsR: parseRating(raw["HRR vR"]),
    // Potential
    stuffPot: parseRating(raw["STU P"]),
    movementPot: parseRating(raw["MOV P"]),
    controlPot: parseRating(raw["CON P"]),
    pBabipPot: parseRating(raw["PBABIP P"]),
    hrRatePot: parseRating(raw["HRR P"]),
    // Attributes
    groundFlyRatio: raw["G/F"] || null,
    velocity: raw.VELO || null,
    velocityPotential: raw.VT || null,
    armSlot: raw.Slot || null,
    pitcherType: raw.PT || null,
    stamina: parseRating(raw.STM),
    holdRunners: parseRating(raw.HLD),
  };

  // Pitch arsenal
  const pitchArsenal: PitchArsenal = {
    fastball: parseRating(raw.FB),
    fastballPot: parseRating(raw.FBP),
    changeup: parseRating(raw.CH),
    changeupPot: parseRating(raw.CHP),
    curveball: parseRating(raw.CB),
    curveballPot: parseRating(raw.CBP),
    slider: parseRating(raw.SL),
    sliderPot: parseRating(raw.SLP),
    sinker: parseRating(raw.SI),
    sinkerPot: parseRating(raw.SIP),
    splitter: parseRating(raw.SP),
    splitterPot: parseRating(raw.SPP),
    cutter: parseRating(raw.CT),
    cutterPot: parseRating(raw.CTP),
    forkball: parseRating(raw.FO),
    forkballPot: parseRating(raw.FOP),
    circleChange: parseRating(raw.CC),
    circleChangePot: parseRating(raw.CCP),
    screwball: parseRating(raw.SC),
    screwballPot: parseRating(raw.SCP),
    knuckleCurve: parseRating(raw.KC),
    knucleCurvePot: parseRating(raw.KCP),
    knuckleball: parseRating(raw.KN),
    knuckleballPot: parseRating(raw.KNP),
  };

  // Defense ratings
  const defenseRatings: DefenseRatings = {
    catcherAbility: parseRating(raw["C ABI"]),
    catcherFraming: parseRating(raw["C FRM"]),
    catcherArm: parseRating(raw["C ARM"]),
    infieldRange: parseRating(raw["IF RNG"]),
    infieldError: parseRating(raw["IF ERR"]),
    infieldArm: parseRating(raw["IF ARM"]),
    turnDoublePlay: parseRating(raw.TDP),
    outfieldRange: parseRating(raw["OF RNG"]),
    outfieldError: parseRating(raw["OF ERR"]),
    outfieldArm: parseRating(raw["OF ARM"]),
    catcher: parseRating(raw.C),
    firstBase: parseRating(raw["1B"]),
    secondBase: parseRating(raw["2B"]),
    thirdBase: parseRating(raw["3B"]),
    shortstop: parseRating(raw.SS),
    leftField: parseRating(raw.LF),
    centerField: parseRating(raw.CF),
    rightField: parseRating(raw.RF),
    catcherPot: parseRating(raw["C Pot"]),
    firstBasePot: parseRating(raw["1B Pot"]),
    secondBasePot: parseRating(raw["2B Pot"]),
    thirdBasePot: parseRating(raw["3B Pot"]),
    shortstopPot: parseRating(raw["SS Pot"]),
    leftFieldPot: parseRating(raw["LF Pot"]),
    centerFieldPot: parseRating(raw["CF Pot"]),
    rightFieldPot: parseRating(raw["RF Pot"]),
  };

  // Speed ratings
  const speedRatings: SpeedRatings = {
    speed: parseRating(raw.SPE),
    stealingAggression: parseRating(raw.SR),
    stealingAbility: parseRating(raw.STE),
    baserunning: parseRating(raw.RUN),
  };

  return {
    odraftId: raw.ID,
    position: raw.POS,
    name: raw.Name,
    nickname: raw.Nickname || null,
    age: parseInt(raw.Age, 10) || 0,
    height: raw.HT,
    weight: raw.WT,
    bats: raw.B,
    throws: raw.T,
    overall: parseInt(raw.OVR, 10) || 0,
    potential: parseInt(raw.POT, 10) || 0,
    
    leadership: raw.LEA || null,
    loyalty: raw.LOY || null,
    adaptability: raw.AD || null,
    financialAmbition: raw.FIN || null,
    workEthic: raw.WE || null,
    intelligence: raw.INT || null,
    injuryProne: raw.Prone || null,
    
    school: raw.Schl || null,
    committedSchool: raw.CommSch || null,
    competitionLevel: raw.COMP || null,
    highSchoolClass: raw.HSC || null,
    
    battingRatings: isPitcher ? null : battingRatings,
    pitchingRatings: isPitcher ? pitchingRatings : null,
    pitchArsenal: isPitcher ? pitchArsenal : null,
    defenseRatings,
    speedRatings,
    
    demandAmount: raw.DEM || null,
    signability: raw.Sign || null,
    scoutAccuracy: raw.SctAcc || null,
    risk: raw.Risk || null,
    
    isDrafted: false,
    draftRound: null,
    draftPick: null,
    draftTeam: null,
  };
}

// Get all column headers from a CSV for mapping UI
export function getCSVHeaders(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      preview: 1,
      complete: (results) => {
        if (results.data.length > 0) {
          resolve(results.data[0] as string[]);
        } else {
          resolve([]);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

// Expected headers for validation
export const EXPECTED_HEADERS = [
  'ID', 'POS', 'Name', 'Nickname', 'Age', 'HT', 'WT', 'B', 'T',
  'OVR', 'POT', 'LEA', 'LOY', 'AD', 'FIN', 'WE', 'INT', 'Prone',
  'Schl', 'CommSch', 'COMP', 'HSC',
  'CON', 'BABIP', 'GAP', 'POW', 'EYE', "K's",
  'BA vL', 'CON vL', 'GAP vL', 'POW vL', 'EYE vL', 'K vL',
  'BA vR', 'CON vR', 'GAP vR', 'POW vR', 'EYE vR', 'K vR',
  'HT P', 'CON P', 'GAP P', 'POW P', 'EYE P', 'K P',
  'BBT', 'GBT', 'FBT',
  'STU', 'MOV', 'PBABIP', 'HRR',
  'STU vL', 'MOV vL', 'PBABIP vL', 'HRR vL',
  'STU vR', 'MOV vR', 'PBABIP vR', 'HRR vR',
  'STU P', 'MOV P', 'PBABIP P', 'HRR P',
  'FB', 'FBP', 'CH', 'CHP', 'CB', 'CBP', 'SL', 'SLP',
  'SI', 'SIP', 'SP', 'SPP', 'CT', 'CTP', 'FO', 'FOP',
  'CC', 'CCP', 'SC', 'SCP', 'KC', 'KCP', 'KN', 'KNP',
  'G/F', 'VELO', 'VT', 'Slot', 'PT', 'STM', 'HLD',
  'C ABI', 'C FRM', 'C ARM',
  'IF RNG', 'IF ERR', 'IF ARM', 'TDP',
  'OF RNG', 'OF ERR', 'OF ARM',
  'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF',
  'C Pot', '1B Pot', '2B Pot', '3B Pot', 'SS Pot', 'LF Pot', 'CF Pot', 'RF Pot',
  'SPE', 'SR', 'STE', 'RUN',
  'DEM', 'Sign', 'SctAcc', 'Risk',
];

// Validate CSV headers
export function validateHeaders(headers: string[]): { valid: boolean; missing: string[]; extra: string[] } {
  const headerSet = new Set(headers);
  const expectedSet = new Set(EXPECTED_HEADERS);
  
  const missing = EXPECTED_HEADERS.filter(h => !headerSet.has(h));
  const extra = headers.filter(h => !expectedSet.has(h));
  
  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
}
