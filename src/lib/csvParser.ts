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

// Find all indices of a column name in the headers (for handling duplicates)
function findAllColumnIndices(headers: string[], columnName: string): number[] {
  const indices: number[] = [];
  headers.forEach((header, idx) => {
    if (header === columnName) {
      indices.push(idx);
    }
  });
  return indices;
}

// Parse the CSV file handling duplicate columns dynamically
export async function parseCSV(file: File): Promise<RawPlayerCSV[]> {
  const text = await file.text();
  
  return new Promise((resolve, reject) => {
    // Parse without headers to get raw arrays
    Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        const rows = results.data as string[][];
        if (rows.length < 2) {
          resolve([]);
          return;
        }
        
        // Get headers from first row
        const headers = rows[0];
        
        // Find indices of duplicate columns
        // For columns that appear twice, first occurrence is batting, second is pitching
        const conIndices = findAllColumnIndices(headers, 'CON');
        const conVlIndices = findAllColumnIndices(headers, 'CON vL');
        const conVrIndices = findAllColumnIndices(headers, 'CON vR');
        const conPIndices = findAllColumnIndices(headers, 'CON P');
        
        // Batting versions are first occurrence, pitching versions are second
        const battingConIndex = conIndices[0];
        const pitchingConIndex = conIndices.length > 1 ? conIndices[1] : -1;
        
        const battingConVlIndex = conVlIndices[0];
        const pitchingConVlIndex = conVlIndices.length > 1 ? conVlIndices[1] : -1;
        
        const battingConVrIndex = conVrIndices[0];
        const pitchingConVrIndex = conVrIndices.length > 1 ? conVrIndices[1] : -1;
        
        const battingConPIndex = conPIndices[0];
        const pitchingConPIndex = conPIndices.length > 1 ? conPIndices[1] : -1;
        
        // Build a header-to-index map for non-duplicate columns
        const headerToIndex: Record<string, number> = {};
        headers.forEach((header, idx) => {
          // For duplicate columns, only store the first occurrence in the main map
          if (!(header in headerToIndex)) {
            headerToIndex[header] = idx;
          }
        });
        
        // Convert each data row to RawPlayerCSV
        const players: RawPlayerCSV[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length < 10) continue; // Skip incomplete rows
          
          // Build object from headers
          const obj: Record<string, string> = {};
          headers.forEach((header, idx) => {
            // For the first occurrence of each header, use the standard name
            if (headerToIndex[header] === idx) {
              obj[header] = row[idx] || '';
            }
          });
          
          // Add pitching-specific duplicate columns with special keys
          if (pitchingConIndex >= 0) {
            obj['_P_CON'] = row[pitchingConIndex] || '';
          }
          if (pitchingConVlIndex >= 0) {
            obj['_P_CON_VL'] = row[pitchingConVlIndex] || '';
          }
          if (pitchingConVrIndex >= 0) {
            obj['_P_CON_VR'] = row[pitchingConVrIndex] || '';
          }
          if (pitchingConPIndex >= 0) {
            obj['_P_CON_P'] = row[pitchingConPIndex] || '';
          }
          
          players.push(obj as unknown as RawPlayerCSV);
        }
        
        resolve(players);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

// Extended interface for the raw data with pitching control fields
interface RawPlayerCSVExtended extends RawPlayerCSV {
  _P_CON?: string;
  _P_CON_VL?: string;
  _P_CON_VR?: string;
  _P_CON_P?: string;
}

// Convert raw CSV data to our Player type
export function convertCSVToPlayer(raw: RawPlayerCSV): Omit<Player, 'id' | 'compositeScore' | 'tier' | 'isSleeper' | 'sleeperScore' | 'archetypes' | 'redFlags' | 'greenFlags' | 'hasSplitsIssues' | 'isTwoWay' | 'scoreBreakdown' | 'similarPlayers' | 'ranking'> {
  const isPitcher = PITCHER_POSITIONS.includes(raw.POS as any);
  const extRaw = raw as RawPlayerCSVExtended;
  
  // Parse batting ratings (use the standard columns - first occurrence)
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
    babipPot: parseRating(raw["HT P"]),
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

  // For pitching ratings, use the special _P_ prefixed columns for control
  // These come from the second occurrence of CON columns in the CSV
  const pitchingRatings: PitchingRatings = {
    stuff: parseRating(raw.STU),
    movement: parseRating(raw.MOV),
    control: parseRating(extRaw._P_CON), // Use pitching-specific control (2nd CON column)
    pBabip: parseRating(raw.PBABIP),
    hrRate: parseRating(raw.HRR),
    // vs Left
    stuffVsL: parseRating(raw["STU vL"]),
    movementVsL: parseRating(raw["MOV vL"]),
    controlVsL: parseRating(extRaw._P_CON_VL), // Use pitching-specific (2nd CON vL column)
    pBabipVsL: parseRating(raw["PBABIP vL"]),
    hrRateVsL: parseRating(raw["HRR vL"]),
    // vs Right
    stuffVsR: parseRating(raw["STU vR"]),
    movementVsR: parseRating(raw["MOV vR"]),
    controlVsR: parseRating(extRaw._P_CON_VR), // Use pitching-specific (2nd CON vR column)
    pBabipVsR: parseRating(raw["PBABIP vR"]),
    hrRateVsR: parseRating(raw["HRR vR"]),
    // Potential
    stuffPot: parseRating(raw["STU P"]),
    movementPot: parseRating(raw["MOV P"]),
    controlPot: parseRating(extRaw._P_CON_P), // Use pitching-specific (2nd CON P column)
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
    
    isNotInterested: false,
    
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
