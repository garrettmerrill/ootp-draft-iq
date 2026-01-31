import {
  Player,
  DraftPhilosophy,
  Tier,
  ScoreBreakdown,
  PitchArsenal,
  DefenseRatings,
  SpeedRatings,
  PITCHER_POSITIONS,
  PREMIUM_POSITIONS,
} from '@/types';

// ==================== ARCHETYPE DETECTION ====================

export function detectBatterArchetypes(player: Player): string[] {
  const archetypes: string[] = [];
  const batting = player.battingRatings;
  const defense = player.defenseRatings;
  const speed = player.speedRatings;
  
  if (!batting || !defense || !speed) return archetypes;

  // Power Bat
  if (
    batting.powerPot && batting.powerPot >= 60 &&
    batting.contactPot && batting.powerPot > batting.contactPot &&
    (batting.battedBallType === 'Flyball' || batting.flyBallTendency === 'Pull' || batting.flyBallTendency === 'Ex. Pull')
  ) {
    archetypes.push('Power Bat');
  }

  // Contact Hitter
  if (
    batting.contactPot && batting.contactPot >= 60 &&
    batting.powerPot && batting.contactPot > batting.powerPot &&
    (batting.battedBallType === 'Line Drive' || batting.battedBallType === 'Groundball') &&
    (batting.groundBallTendency === 'Spray' || batting.flyBallTendency === 'Spray')
  ) {
    archetypes.push('Contact Hitter');
  }

  // Five-Tool Player
  if (
    batting.powerPot && batting.powerPot >= 50 &&
    batting.contactPot && batting.contactPot >= 50 &&
    speed.speed && speed.speed >= 50 &&
    defense.infieldRange && defense.infieldRange >= 60 &&
    ((defense.infieldArm && defense.infieldArm >= 50) || (defense.outfieldArm && defense.outfieldArm >= 50))
  ) {
    archetypes.push('Five-Tool Player');
  }

  // Toolsy OF
  if (['LF', 'CF', 'RF'].includes(player.position)) {
    let toolCount = 0;
    if (batting.powerPot && batting.powerPot >= 50) toolCount++;
    if (batting.contactPot && batting.contactPot >= 50) toolCount++;
    if (speed.speed && speed.speed >= 55) toolCount++;
    if (defense.outfieldRange && defense.outfieldRange >= 55) toolCount++;
    if (defense.outfieldArm && defense.outfieldArm >= 55) toolCount++;
    if (toolCount >= 4) {
      archetypes.push('Toolsy OF');
    }
  }

  // Defensive SS
  if (
    player.position === 'SS' &&
    defense.infieldRange && defense.infieldRange >= 65 &&
    defense.infieldArm && defense.infieldArm >= 60 &&
    defense.turnDoublePlay && defense.turnDoublePlay >= 60
  ) {
    archetypes.push('Defensive SS');
  }

  // Defensive C
  if (
    player.position === 'C' &&
    defense.catcherAbility && defense.catcherAbility >= 60 &&
    defense.catcherFraming && defense.catcherFraming >= 60 &&
    defense.catcherArm && defense.catcherArm >= 50
  ) {
    archetypes.push('Defensive C');
  }

  // Speed Threat
  if (
    speed.speed && speed.speed >= 65 &&
    speed.stealingAbility && speed.stealingAbility >= 60 &&
    speed.stealingAggression && speed.stealingAggression >= 50 &&
    speed.baserunning && speed.baserunning >= 50
  ) {
    archetypes.push('Speed Threat');
  }

  // Patient Hitter
  if (batting.eyePot && batting.eyePot >= 65) {
    archetypes.push('Patient Hitter');
  }

  // Raw Power
  if (
    batting.powerPot && batting.powerPot >= 70 &&
    batting.contactPot && batting.contactPot <= 45
  ) {
    archetypes.push('Raw Power');
  }

  // Utility Player
  const positionRatings = [
    defense.catcher, defense.firstBase, defense.secondBase,
    defense.thirdBase, defense.shortstop, defense.leftField,
    defense.centerField, defense.rightField,
  ].filter(r => r !== null && r >= 45);
  
  const hasIF = [defense.secondBase, defense.thirdBase, defense.shortstop].some(r => r !== null && r >= 45);
  const hasOF = [defense.leftField, defense.centerField, defense.rightField].some(r => r !== null && r >= 45);
  
  if (positionRatings.length >= 3 && hasIF && hasOF) {
    archetypes.push('Utility Player');
  }

  // Glove-First
  if (
    ((defense.infieldRange && defense.infieldRange >= 55 && defense.infieldArm && defense.infieldArm >= 55) ||
     (defense.outfieldRange && defense.outfieldRange >= 55 && defense.outfieldArm && defense.outfieldArm >= 55)) &&
    batting.powerPot && batting.powerPot <= 45 &&
    batting.contactPot && batting.contactPot <= 50
  ) {
    archetypes.push('Glove-First');
  }

  // Balanced Hitter
  if (
    batting.contactPot && batting.contactPot >= 45 && batting.contactPot <= 59 &&
    batting.powerPot && batting.powerPot >= 45 && batting.powerPot <= 59 &&
    batting.gapPot && batting.gapPot >= 45 && batting.gapPot <= 59 &&
    batting.eyePot && batting.eyePot >= 45 && batting.eyePot <= 59
  ) {
    archetypes.push('Balanced Hitter');
  }

  return archetypes;
}

export function detectPitcherArchetypes(player: Player): string[] {
  const archetypes: string[] = [];
  const pitching = player.pitchingRatings;
  const arsenal = player.pitchArsenal;
  
  if (!pitching || !arsenal) return archetypes;

  const countPitchesWithPotential = (threshold: number): number => {
    const potentials = [
      arsenal.fastballPot, arsenal.changeupPot, arsenal.curveballPot,
      arsenal.sliderPot, arsenal.sinkerPot, arsenal.splitterPot,
      arsenal.cutterPot, arsenal.forkballPot, arsenal.circleChangePot,
      arsenal.screwballPot, arsenal.knucleCurvePot, arsenal.knuckleballPot,
    ];
    return potentials.filter(p => p !== null && p >= threshold).length;
  };

  const parseVelo = (velo: string | null): number => {
    if (!velo) return 0;
    const match = velo.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const currentVelo = parseVelo(pitching.velocity);
  const potentialVelo = parseVelo(pitching.velocityPotential);

  // Ace Potential
  if (
    player.position === 'SP' &&
    pitching.stuffPot && pitching.stuffPot >= 65 &&
    pitching.movementPot && pitching.movementPot >= 60 &&
    pitching.controlPot && pitching.controlPot >= 50 &&
    pitching.stamina && pitching.stamina >= 50
  ) {
    archetypes.push('Ace Potential');
  }

  // Mid-Rotation Starter
  if (
    player.position === 'SP' &&
    pitching.stuffPot && pitching.stuffPot >= 55 && pitching.stuffPot <= 64 &&
    pitching.controlPot && pitching.controlPot >= 50 &&
    pitching.stamina && pitching.stamina >= 45
  ) {
    archetypes.push('Mid-Rotation Starter');
  }

  // Back-End Starter
  if (
    player.position === 'SP' &&
    pitching.stuffPot && pitching.stuffPot >= 45 && pitching.stuffPot <= 54 &&
    pitching.controlPot && pitching.controlPot >= 55
  ) {
    archetypes.push('Back-End Starter');
  }

  // Power Arm
  if (currentVelo >= 95 || potentialVelo >= 98) {
    archetypes.push('Power Arm');
  }

  // Groundball Specialist
  if (
    (pitching.groundFlyRatio === 'GB' || pitching.groundFlyRatio === 'EX GB') &&
    pitching.pitcherType === "GB'er"
  ) {
    archetypes.push('Groundball Specialist');
  }

  // Strikeout Artist
  if (
    pitching.stuffPot && pitching.stuffPot >= 60 &&
    ((arsenal.curveballPot && arsenal.curveballPot >= 55) ||
     (arsenal.sliderPot && arsenal.sliderPot >= 55) ||
     (arsenal.changeupPot && arsenal.changeupPot >= 55))
  ) {
    archetypes.push('Strikeout Artist');
  }

  // Control Pitcher
  if (
    pitching.stuffPot && pitching.stuffPot >= 45 &&
    pitching.pBabipPot && pitching.pBabipPot >= 55 &&
    pitching.controlPot && pitching.controlPot >= 65
  ) {
    archetypes.push('Control Pitcher');
  }

  // Closer Material
  if (
    (player.position === 'CL' || player.position === 'RP') &&
    pitching.stuffPot && pitching.stuffPot >= 60 &&
    currentVelo >= 93
  ) {
    archetypes.push('Closer Material');
  }

  // Fastball-Only
  const nonFBPitches = [
    arsenal.changeupPot, arsenal.curveballPot, arsenal.sliderPot,
    arsenal.sinkerPot, arsenal.splitterPot, arsenal.cutterPot,
    arsenal.forkballPot, arsenal.circleChangePot, arsenal.screwballPot,
    arsenal.knucleCurvePot, arsenal.knuckleballPot,
  ];
  if (
    arsenal.fastballPot && arsenal.fastballPot >= 60 &&
    !nonFBPitches.some(p => p !== null && p >= 40)
  ) {
    archetypes.push('Fastball-Only');
  }

  // Elite Arsenal
  if (countPitchesWithPotential(55) >= 3) {
    archetypes.push('Elite Arsenal');
  }

  // Sidearmer
  if (pitching.armSlot === 'SIDE') {
    archetypes.push('Sidearmer');
  }

  return archetypes;
}

export function detectArchetypes(player: Player): string[] {
  const isPitcher = PITCHER_POSITIONS.includes(player.position as any);
  return isPitcher ? detectPitcherArchetypes(player) : detectBatterArchetypes(player);
}

// ==================== FLAG DETECTION ====================

export function detectRedFlags(player: Player): string[] {
  const flags: string[] = [];

  if (player.risk === 'High' || player.risk === 'Very High') flags.push('High Risk');
  if (player.injuryProne === 'Fragile') flags.push('Injury Prone');
  if (player.workEthic === 'L') flags.push('Low Work Ethic');
  if (player.scoutAccuracy === 'Low' || player.scoutAccuracy === 'Very Low') flags.push('Hard to Scout');
  if (player.intelligence === 'L') flags.push('Low Intelligence');
  if (player.adaptability === 'L') flags.push('Low Adaptability');
  
  if (player.demandAmount) {
    const amount = parseDemandAmount(player.demandAmount);
    if (amount >= 4000000) flags.push('High Demand');
  }

  return flags;
}

export function detectGreenFlags(player: Player): string[] {
  const flags: string[] = [];

  if (player.risk === 'Low') flags.push('Low Risk');
  if (player.injuryProne === 'Durable') flags.push('Durable');
  if (player.workEthic === 'H') flags.push('High Work Ethic');
  if (player.intelligence === 'H') flags.push('High Intelligence');
  if (player.leadership === 'H') flags.push('Leader');
  if (player.adaptability === 'H') flags.push('High Adaptability');

  return flags;
}

// ==================== SPLITS & TWO-WAY DETECTION ====================

export function detectSplitsIssues(player: Player): boolean {
  const isPitcher = PITCHER_POSITIONS.includes(player.position as any);
  
  if (isPitcher && player.pitchingRatings) {
    const p = player.pitchingRatings;
    const diffs = [
      Math.abs((p.stuffVsL || 0) - (p.stuffVsR || 0)),
      Math.abs((p.movementVsL || 0) - (p.movementVsR || 0)),
      Math.abs((p.controlVsL || 0) - (p.controlVsR || 0)),
      Math.abs((p.pBabipVsL || 0) - (p.pBabipVsR || 0)),
      Math.abs((p.hrRateVsL || 0) - (p.hrRateVsR || 0)),
    ];
    
    const hasDeveloped = [p.stuff, p.movement, p.control, p.pBabip, p.hrRate].some(r => r !== null && r >= 40);
    if (!hasDeveloped) return false;
    
    return diffs.filter(d => d >= 10).length >= 2;
  } else if (player.battingRatings) {
    const b = player.battingRatings;
    const diffs = [
      Math.abs((b.contactVsL || 0) - (b.contactVsR || 0)),
      Math.abs((b.gapVsL || 0) - (b.gapVsR || 0)),
      Math.abs((b.powerVsL || 0) - (b.powerVsR || 0)),
      Math.abs((b.eyeVsL || 0) - (b.eyeVsR || 0)),
      Math.abs((b.avoidKVsL || 0) - (b.avoidKVsR || 0)),
    ];
    
    const hasDeveloped = [b.contact, b.gap, b.power, b.eye, b.avoidK].some(r => r !== null && r >= 40);
    if (!hasDeveloped) return false;
    
    return diffs.filter(d => d >= 10).length >= 2;
  }
  
  return false;
}

export function detectTwoWay(player: Player): boolean {
  const isPitcher = PITCHER_POSITIONS.includes(player.position as any);
  
  if (isPitcher && player.battingRatings) {
    const pots = [
      player.battingRatings.contactPot,
      player.battingRatings.gapPot,
      player.battingRatings.powerPot,
      player.battingRatings.eyePot,
    ];
    return pots.filter(p => p !== null && p >= 50).length >= 2;
  } else if (!isPitcher && player.pitchingRatings) {
    const pots = [
      player.pitchingRatings.stuffPot,
      player.pitchingRatings.movementPot,
      player.pitchingRatings.controlPot,
    ];
    return pots.filter(p => p !== null && p >= 50).length >= 2;
  }
  
  return false;
}

// ==================== HELPER FUNCTIONS ====================

function parseDemandAmount(demand: string): number {
  if (!demand || demand === 'Slot') return 500000;
  const match = demand.match(/\$?([\d.]+)(k|m)?/i);
  if (!match) return 0;
  let amount = parseFloat(match[1]);
  if (match[2]?.toLowerCase() === 'm') amount *= 1000000;
  else if (match[2]?.toLowerCase() === 'k') amount *= 1000;
  return amount;
}

// Convert a 20-80 scale rating to 0-100
function normalize(val: number | null): number {
  if (val === null || val === undefined) return 0;
  // 20 = 0, 50 = 50, 80 = 100
  return Math.max(0, Math.min(100, ((val - 20) / 60) * 100));
}

// ==================== DEVELOPMENT FACTOR ====================
/*
 * Development Factor rewards players who are closer to their ceiling.
 * 
 * Formula: effectiveRating = potential × (0.7 + 0.3 × (current / potential))
 * 
 * Examples:
 *   - 70 POT, 35 current → devFactor = 0.5 → effective = 70 × 0.85 = 59.5
 *   - 70 POT, 60 current → devFactor = 0.86 → effective = 70 × 0.96 = 67.2
 *   - 70 POT, 70 current → devFactor = 1.0 → effective = 70 × 1.0 = 70.0
 * 
 * The minimum floor is 20, so minimum devFactor = 20/80 = 0.25 → effective = potential × 0.775
 */
function calculateEffectiveRating(current: number | null, potential: number | null): number {
  if (potential === null || potential === 0) return 0;
  if (current === null) current = 20; // Floor
  
  const developmentFactor = current / potential;
  const effectiveRating = potential * (0.7 + 0.3 * developmentFactor);
  
  return effectiveRating;
}

// ==================== SPEED CALCULATION ====================
/*
 * Speed Score is a weighted composite of all speed-related attributes:
 *   - Speed: 55%
 *   - Baserunning: 20%
 *   - Stealing Ability: 15%
 *   - Stealing Aggression: 10%
 */
function calculateSpeedScore(speedRatings: SpeedRatings | null): number {
  if (!speedRatings) return 0;
  
  const speed = speedRatings.speed || 0;
  const baserunning = speedRatings.baserunning || 0;
  const stealingAbility = speedRatings.stealingAbility || 0;
  const stealingAggression = speedRatings.stealingAggression || 0;
  
  return (
    speed * 0.55 +
    baserunning * 0.20 +
    stealingAbility * 0.15 +
    stealingAggression * 0.10
  );
}

// ==================== DEFENSE CALCULATION ====================
/*
 * Defense Score uses position-specific weights derived from OOTP's position rating calculations.
 * 
 * Position Weights (from regression analysis):
 *   C:  Blocking 40%, Framing 35%, Arm 25%
 *   1B: Error 60%, Range 40%
 *   2B: Error 45%, Turn DP 35%, Range 20%
 *   3B: Error 45%, Arm 40%, Range 15%
 *   SS: Range 40%, Error 25%, Turn DP 20%, Arm 15%
 *   LF: Error 50%, Range 30%, Arm 20%
 *   CF: Range 75%, Error 15%, Arm 10%
 *   RF: Arm 35%, Range 35%, Error 30%
 */
function calculateDefenseScore(defenseRatings: DefenseRatings | null, position: string): number {
  if (!defenseRatings) return 0;
  
  const d = defenseRatings;
  
  switch (position) {
    case 'C':
      return (
        (d.catcherAbility || 0) * 0.40 +
        (d.catcherFraming || 0) * 0.35 +
        (d.catcherArm || 0) * 0.25
      );
    
    case '1B':
      return (
        (d.infieldError || 0) * 0.60 +
        (d.infieldRange || 0) * 0.40
      );
    
    case '2B':
      return (
        (d.infieldError || 0) * 0.45 +
        (d.turnDoublePlay || 0) * 0.35 +
        (d.infieldRange || 0) * 0.20
      );
    
    case '3B':
      return (
        (d.infieldError || 0) * 0.45 +
        (d.infieldArm || 0) * 0.40 +
        (d.infieldRange || 0) * 0.15
      );
    
    case 'SS':
      return (
        (d.infieldRange || 0) * 0.40 +
        (d.infieldError || 0) * 0.25 +
        (d.turnDoublePlay || 0) * 0.20 +
        (d.infieldArm || 0) * 0.15
      );
    
    case 'LF':
      return (
        (d.outfieldError || 0) * 0.50 +
        (d.outfieldRange || 0) * 0.30 +
        (d.outfieldArm || 0) * 0.20
      );
    
    case 'CF':
      return (
        (d.outfieldRange || 0) * 0.75 +
        (d.outfieldError || 0) * 0.15 +
        (d.outfieldArm || 0) * 0.10
      );
    
    case 'RF':
      return (
        (d.outfieldArm || 0) * 0.35 +
        (d.outfieldRange || 0) * 0.35 +
        (d.outfieldError || 0) * 0.30
      );
    
    default:
      // Fallback for unknown positions - use best available
      if (d.catcherAbility) {
        return (d.catcherAbility + (d.catcherFraming || 0) + (d.catcherArm || 0)) / 3;
      } else if (d.infieldRange) {
        return (d.infieldRange + (d.infieldError || 0) + (d.infieldArm || 0)) / 3;
      } else if (d.outfieldRange) {
        return (d.outfieldRange + (d.outfieldError || 0) + (d.outfieldArm || 0)) / 3;
      }
      return 0;
  }
}

// ==================== COMPOSITE SCORE ====================
/*
 * HOW SCORING WORKS:
 * 
 * The composite score has 3 main parts that add together:
 * 
 * 1. BASE SCORE (from POT/OVR weights, default 35%):
 *    - POT Weight (default 25%): Player's potential rating (20-80 scale → 0-100)
 *    - OVR Weight (default 10%): Player's overall rating
 * 
 * 2. SKILLS SCORE (default 65% of score):
 *    - Uses EFFECTIVE RATINGS with Development Factor
 *    - effectiveRating = potential × (0.7 + 0.3 × (current / potential))
 *    - Rewards players closer to their ceiling
 *    - For batters: Power, Contact, Eye, Gap, Speed (weighted composite), Defense (position-specific)
 *    - For pitchers: Stuff, Movement/PBABIP, Control, Stamina, Arsenal
 * 
 * 3. ADJUSTMENTS (flat bonuses and penalties):
 *    - Risk penalty: High/Very High risk players lose points
 *    - Position bonus: Priority positions get extra points
 *    - College/HS bonus: If you prefer one over the other
 *    - Personality bonuses: High work ethic, intelligence, etc. add points
 *    - Personality penalties: Low work ethic, injury prone, etc. subtract points
 *    - Batter/Pitcher type bonuses: Flyball hitters, groundball pitchers, etc.
 * 
 * SPEED CALCULATION:
 *    Speed 55% + Baserunning 20% + Stealing Ability 15% + Stealing Aggression 10%
 * 
 * DEFENSE CALCULATION (position-specific weights):
 *    C:  Blocking 40%, Framing 35%, Arm 25%
 *    1B: Error 60%, Range 40%
 *    2B: Error 45%, Turn DP 35%, Range 20%
 *    3B: Error 45%, Arm 40%, Range 15%
 *    SS: Range 40%, Error 25%, Turn DP 20%, Arm 15%
 *    LF: Error 50%, Range 30%, Arm 20%
 *    CF: Range 75%, Error 15%, Arm 10%
 *    RF: Arm 35%, Range 35%, Error 30%
 * 
 * EXAMPLE for a 70 POT / 35 OVR SS with 50% developed skills, default weights:
 *   Base: (70 POT → 83.3 × 25%) + (35 OVR → 25 × 10%) = 20.8 + 2.5 = 23.3 pts
 *   Skills: 65% × weighted avg of effective ratings = ~45 pts
 *   Adjustments: +5 High Work Ethic, -10 High Risk = -5 pts
 *   TOTAL: ~63 points → "Very Good" tier
 */

export function calculateCompositeScore(player: Player, philosophy: DraftPhilosophy): { score: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    potentialContribution: 0,
    overallContribution: 0,
    skillsContribution: 0,
    riskPenalty: 0,
    positionBonus: 0,
    personalityAdjustment: 0,
    otherBonuses: 0,
    ratingContributions: {},
    total: 0,
  };

  const isPitcher = PITCHER_POSITIONS.includes(player.position as any);
  const isStarter = player.position === 'SP';

  // Calculate what percentage of score comes from skills
  const skillsWeight = Math.max(0, 100 - philosophy.potentialWeight - philosophy.overallWeight);

  // 1. BASE SCORE: Potential contribution
  const potNormalized = normalize(player.potential);
  breakdown.potentialContribution = (potNormalized * philosophy.potentialWeight) / 100;

  // 2. BASE SCORE: Overall contribution  
  const ovrNormalized = normalize(player.overall);
  breakdown.overallContribution = (ovrNormalized * philosophy.overallWeight) / 100;

  // 3. SKILLS SCORE: Calculate weighted average of individual ratings with development factor
  // We accumulate normalized ratings (0-100) weighted by their importance (0-100 weight)
  // Then compute a weighted average and scale it by skillsWeight
  let weightedRatingSum = 0;
  let totalSkillWeight = 0;

  if (isPitcher && player.pitchingRatings && player.pitchArsenal) {
    const p = player.pitchingRatings;
    const a = player.pitchArsenal;
    const w = isStarter ? philosophy.spWeights : philosophy.rpWeights;

    // Stuff (with development factor)
    if (p.stuffPot !== null) {
      const effectiveStuff = calculateEffectiveRating(p.stuff, p.stuffPot);
      const normalizedRating = normalize(effectiveStuff);
      breakdown.ratingContributions['Stuff'] = normalizedRating;
      weightedRatingSum += normalizedRating * w.stuff;
      totalSkillWeight += w.stuff;
    }

    // Movement vs PBABIP+HR toggle
    const useMovement = isStarter ? philosophy.useMovementSP : philosophy.useMovementRP;
    
    if (useMovement) {
      if (p.movementPot !== null) {
        const effectiveMovement = calculateEffectiveRating(p.movement, p.movementPot);
        const normalizedRating = normalize(effectiveMovement);
        breakdown.ratingContributions['Movement'] = normalizedRating;
        weightedRatingSum += normalizedRating * w.movement;
        totalSkillWeight += w.movement;
      }
    } else {
      if (p.pBabipPot !== null) {
        const effectivePBabip = calculateEffectiveRating(p.pBabip, p.pBabipPot);
        const normalizedRating = normalize(effectivePBabip);
        breakdown.ratingContributions['PBABIP'] = normalizedRating;
        weightedRatingSum += normalizedRating * w.pBabip;
        totalSkillWeight += w.pBabip;
      }
      if (p.hrRatePot !== null) {
        const effectiveHrRate = calculateEffectiveRating(p.hrRate, p.hrRatePot);
        const normalizedRating = normalize(effectiveHrRate);
        breakdown.ratingContributions['HR Rate'] = normalizedRating;
        weightedRatingSum += normalizedRating * w.hrRate;
        totalSkillWeight += w.hrRate;
      }
    }

    // Control (with development factor)
    if (p.controlPot !== null) {
      const effectiveControl = calculateEffectiveRating(p.control, p.controlPot);
      const normalizedRating = normalize(effectiveControl);
      breakdown.ratingContributions['Control'] = normalizedRating;
      weightedRatingSum += normalizedRating * w.control;
      totalSkillWeight += w.control;
    }

    // Stamina (SP only - no development factor, it's a static rating)
    if (isStarter && p.stamina !== null) {
      const staminaWeight = philosophy.spWeights.stamina;
      const normalizedRating = normalize(p.stamina);
      breakdown.ratingContributions['Stamina'] = normalizedRating;
      weightedRatingSum += normalizedRating * staminaWeight;
      totalSkillWeight += staminaWeight;
    }

    // Arsenal quality (count of 55+ potential pitches, max 3 for full credit)
    // Use development factor for arsenal by comparing current vs potential pitch grades
    const pitchPots = [
      { current: a.fastball, pot: a.fastballPot },
      { current: a.changeup, pot: a.changeupPot },
      { current: a.curveball, pot: a.curveballPot },
      { current: a.slider, pot: a.sliderPot },
      { current: a.sinker, pot: a.sinkerPot },
      { current: a.splitter, pot: a.splitterPot },
      { current: a.cutter, pot: a.cutterPot },
      { current: a.circleChange, pot: a.circleChangePot },
      { current: a.forkball, pot: a.forkballPot },
    ].filter(pt => pt.pot !== null && pt.pot >= 55);
    
    // Calculate average development factor for arsenal
    let arsenalDevFactor = 1;
    if (pitchPots.length > 0) {
      const devFactors = pitchPots.map(pt => {
        if (pt.pot && pt.pot > 0) {
          return (pt.current || 20) / pt.pot;
        }
        return 1;
      });
      arsenalDevFactor = devFactors.reduce((a, b) => a + b, 0) / devFactors.length;
    }
    
    // Arsenal score: 0-100 based on number of quality pitches (max 3 for full credit)
    const arsenalPotentialScore = Math.min(pitchPots.length / 3, 1) * 100;
    const effectiveArsenal = arsenalPotentialScore * (0.7 + 0.3 * arsenalDevFactor);
    breakdown.ratingContributions['Arsenal'] = effectiveArsenal;
    weightedRatingSum += effectiveArsenal * w.arsenal;
    totalSkillWeight += w.arsenal;

  } else if (player.battingRatings && player.speedRatings && player.defenseRatings) {
    const b = player.battingRatings;
    const s = player.speedRatings;
    const d = player.defenseRatings;
    const w = philosophy.batterWeights;

    // Power (with development factor)
    if (b.powerPot !== null) {
      const effectivePower = calculateEffectiveRating(b.power, b.powerPot);
      const normalizedRating = normalize(effectivePower);
      breakdown.ratingContributions['Power'] = normalizedRating;
      weightedRatingSum += normalizedRating * w.power;
      totalSkillWeight += w.power;
    }

    // Contact vs BABIP+AvoidK toggle
    if (philosophy.useBabipKs) {
      if (b.babipPot !== null) {
        const effectiveBabip = calculateEffectiveRating(b.babip, b.babipPot);
        const normalizedRating = normalize(effectiveBabip);
        breakdown.ratingContributions['BABIP'] = normalizedRating;
        weightedRatingSum += normalizedRating * w.babip;
        totalSkillWeight += w.babip;
      }
      if (b.avoidKPot !== null) {
        const effectiveAvoidK = calculateEffectiveRating(b.avoidK, b.avoidKPot);
        const normalizedRating = normalize(effectiveAvoidK);
        breakdown.ratingContributions['Avoid K'] = normalizedRating;
        weightedRatingSum += normalizedRating * w.avoidK;
        totalSkillWeight += w.avoidK;
      }
    } else {
      if (b.contactPot !== null) {
        const effectiveContact = calculateEffectiveRating(b.contact, b.contactPot);
        const normalizedRating = normalize(effectiveContact);
        breakdown.ratingContributions['Contact'] = normalizedRating;
        weightedRatingSum += normalizedRating * w.contact;
        totalSkillWeight += w.contact;
      }
    }

    // Eye (with development factor)
    if (b.eyePot !== null) {
      const effectiveEye = calculateEffectiveRating(b.eye, b.eyePot);
      const normalizedRating = normalize(effectiveEye);
      breakdown.ratingContributions['Eye'] = normalizedRating;
      weightedRatingSum += normalizedRating * w.eye;
      totalSkillWeight += w.eye;
    }

    // Gap (with development factor)
    if (b.gapPot !== null) {
      const effectiveGap = calculateEffectiveRating(b.gap, b.gapPot);
      const normalizedRating = normalize(effectiveGap);
      breakdown.ratingContributions['Gap'] = normalizedRating;
      weightedRatingSum += normalizedRating * w.gap;
      totalSkillWeight += w.gap;
    }

    // Speed (weighted composite - no development factor, these are static)
    const speedScore = calculateSpeedScore(s);
    if (speedScore > 0) {
      const normalizedRating = normalize(speedScore);
      breakdown.ratingContributions['Speed'] = normalizedRating;
      weightedRatingSum += normalizedRating * w.speed;
      totalSkillWeight += w.speed;
    }

    // Defense (position-specific weighted composite - no development factor)
    const defenseScore = calculateDefenseScore(d, player.position);
    if (defenseScore > 0) {
      const normalizedRating = normalize(defenseScore);
      breakdown.ratingContributions['Defense'] = normalizedRating;
      weightedRatingSum += normalizedRating * w.defense;
      totalSkillWeight += w.defense;
    }
  }

  // Calculate weighted average of skills (0-100), then apply skillsWeight percentage
  if (totalSkillWeight > 0) {
    const weightedAvgSkills = weightedRatingSum / totalSkillWeight;  // 0-100
    breakdown.skillsContribution = (weightedAvgSkills * skillsWeight) / 100;  // scaled by skillsWeight%
  }

  // 4. ADJUSTMENTS

  // Risk penalty
  let riskPenalty = 0;
  if (player.risk === 'Very High') riskPenalty = philosophy.riskPenalties.veryHigh;
  else if (player.risk === 'High') riskPenalty = philosophy.riskPenalties.high;
  else if (player.risk === 'Medium') riskPenalty = philosophy.riskPenalties.medium;
  breakdown.riskPenalty = -riskPenalty;

  // Position bonus
  if (philosophy.priorityPositions.includes(player.position)) {
    breakdown.positionBonus = philosophy.positionBonus;
  }

  // College/HS preference bonus
  const isCollege = player.highSchoolClass?.includes('CO');
  const isHS = player.highSchoolClass?.includes('HS');
  if (philosophy.collegeVsHS === 'college' && isCollege) {
    breakdown.otherBonuses += philosophy.collegeHSBonus;
    breakdown.ratingContributions['College Bonus'] = philosophy.collegeHSBonus;
  } else if (philosophy.collegeVsHS === 'hs' && isHS) {
    breakdown.otherBonuses += philosophy.collegeHSBonus;
    breakdown.ratingContributions['HS Bonus'] = philosophy.collegeHSBonus;
  }

  // Batter batted ball type bonus
  if (!isPitcher && player.battingRatings?.battedBallType) {
    if (philosophy.preferredBatterTypes.includes(player.battingRatings.battedBallType)) {
      breakdown.otherBonuses += philosophy.batterTypeBonus;
      breakdown.ratingContributions['Batter Type Bonus'] = philosophy.batterTypeBonus;
    }
  }

  // Pitcher ground/fly type bonus  
  if (isPitcher && player.pitchingRatings?.groundFlyRatio) {
    if (philosophy.preferredPitcherTypes.includes(player.pitchingRatings.groundFlyRatio)) {
      breakdown.otherBonuses += philosophy.pitcherTypeBonus;
      breakdown.ratingContributions['Pitcher Type Bonus'] = philosophy.pitcherTypeBonus;
    }
  }

  // Personality adjustments
  let personalityAdj = 0;
  
  // Positive traits
  if (player.workEthic === 'H') {
    personalityAdj += philosophy.personalityBonuses.highWorkEthic;
    if (philosophy.personalityBonuses.highWorkEthic !== 0) {
      breakdown.ratingContributions['High Work Ethic'] = philosophy.personalityBonuses.highWorkEthic;
    }
  }
  if (player.intelligence === 'H') {
    personalityAdj += philosophy.personalityBonuses.highIntelligence;
    if (philosophy.personalityBonuses.highIntelligence !== 0) {
      breakdown.ratingContributions['High Intelligence'] = philosophy.personalityBonuses.highIntelligence;
    }
  }
  if (player.leadership === 'H') {
    personalityAdj += philosophy.personalityBonuses.leadership;
    if (philosophy.personalityBonuses.leadership !== 0) {
      breakdown.ratingContributions['Leadership'] = philosophy.personalityBonuses.leadership;
    }
  }
  if (player.adaptability === 'H') {
    personalityAdj += philosophy.personalityBonuses.highAdaptability;
    if (philosophy.personalityBonuses.highAdaptability !== 0) {
      breakdown.ratingContributions['High Adaptability'] = philosophy.personalityBonuses.highAdaptability;
    }
  }
  if (player.injuryProne === 'Durable') {
    personalityAdj += philosophy.personalityBonuses.durable;
    if (philosophy.personalityBonuses.durable !== 0) {
      breakdown.ratingContributions['Durable'] = philosophy.personalityBonuses.durable;
    }
  }
  
  // Negative traits (these are penalties, so subtract)
  if (player.workEthic === 'L') {
    personalityAdj -= philosophy.personalityPenalties.lowWorkEthic;
    if (philosophy.personalityPenalties.lowWorkEthic !== 0) {
      breakdown.ratingContributions['Low Work Ethic'] = -philosophy.personalityPenalties.lowWorkEthic;
    }
  }
  if (player.intelligence === 'L') {
    personalityAdj -= philosophy.personalityPenalties.lowIntelligence;
    if (philosophy.personalityPenalties.lowIntelligence !== 0) {
      breakdown.ratingContributions['Low Intelligence'] = -philosophy.personalityPenalties.lowIntelligence;
    }
  }
  if (player.adaptability === 'L') {
    personalityAdj -= philosophy.personalityPenalties.lowAdaptability;
    if (philosophy.personalityPenalties.lowAdaptability !== 0) {
      breakdown.ratingContributions['Low Adaptability'] = -philosophy.personalityPenalties.lowAdaptability;
    }
  }
  if (player.injuryProne === 'Fragile') {
    personalityAdj -= philosophy.personalityPenalties.injuryProne;
    if (philosophy.personalityPenalties.injuryProne !== 0) {
      breakdown.ratingContributions['Injury Prone'] = -philosophy.personalityPenalties.injuryProne;
    }
  }
  
  breakdown.personalityAdjustment = personalityAdj;

  // Calculate total
  breakdown.total = 
    breakdown.potentialContribution + 
    breakdown.overallContribution + 
    breakdown.skillsContribution +
    breakdown.riskPenalty + 
    breakdown.positionBonus + 
    breakdown.personalityAdjustment +
    breakdown.otherBonuses;
  
  // Floor at 0
  breakdown.total = Math.max(0, breakdown.total);

  return { score: breakdown.total, breakdown };
}

// ==================== TIER & SLEEPER ====================

export function assignTier(score: number, thresholds: DraftPhilosophy['tierThresholds']): Tier {
  if (score >= thresholds.elite) return 'Elite';
  if (score >= thresholds.veryGood) return 'Very Good';
  if (score >= thresholds.good) return 'Good';
  if (score >= thresholds.average) return 'Average';
  return 'Filler';
}

export function calculateSleeperScore(player: Player, philosophy: DraftPhilosophy): number {
  const { score } = calculateCompositeScore(player, philosophy);
  const avgOvrPot = (player.overall + player.potential) / 2;
  const normalizedAvg = normalize(avgOvrPot);
  
  // Sleeper score = how much better the composite score is vs just OVR/POT average
  let sleeperScore = score - normalizedAvg;
  
  // Bonus for lower risk
  if (player.risk === 'Low') sleeperScore += 2;
  else if (player.risk === 'Medium') sleeperScore += 1;
  
  // Bonus for premium positions
  if (PREMIUM_POSITIONS.includes(player.position as any)) sleeperScore += 2;
  
  return sleeperScore;
}

// ==================== ARSENAL & ROLE ====================

export function gradeArsenal(arsenal: PitchArsenal | null): { grade: string; description: string } {
  if (!arsenal) return { grade: 'N/A', description: 'No arsenal data' };
  
  const pitches = [
    { name: 'Fastball', pot: arsenal.fastballPot },
    { name: 'Changeup', pot: arsenal.changeupPot },
    { name: 'Curveball', pot: arsenal.curveballPot },
    { name: 'Slider', pot: arsenal.sliderPot },
    { name: 'Sinker', pot: arsenal.sinkerPot },
    { name: 'Splitter', pot: arsenal.splitterPot },
    { name: 'Cutter', pot: arsenal.cutterPot },
    { name: 'Circle Change', pot: arsenal.circleChangePot },
  ].filter(p => p.pot !== null && p.pot > 0);
  
  const elitePitches = pitches.filter(p => p.pot! >= 70).length;
  const plusPitches = pitches.filter(p => p.pot! >= 55).length;
  const avgPitches = pitches.filter(p => p.pot! >= 45).length;
  
  if (elitePitches >= 2 && plusPitches >= 3) return { grade: 'Elite', description: `${elitePitches} elite, ${plusPitches} plus pitches` };
  if (plusPitches >= 3) return { grade: 'Plus', description: `${plusPitches} plus pitches` };
  if (plusPitches >= 2) return { grade: 'Above Average', description: `${plusPitches} plus pitches` };
  if (avgPitches >= 3) return { grade: 'Average', description: `${avgPitches} average+ pitches` };
  if (avgPitches >= 2) return { grade: 'Below Average', description: `Limited (${avgPitches} pitches)` };
  return { grade: 'Poor', description: 'Very limited arsenal' };
}

export function projectRole(player: Player): { role: 'Starter' | 'Reliever' | 'Swingman'; confidence: string; reason: string } {
  if (!player.pitchingRatings || !player.pitchArsenal) {
    return { role: 'Reliever', confidence: 'Low', reason: 'No pitching data' };
  }
  
  const p = player.pitchingRatings;
  const a = player.pitchArsenal;
  const { grade } = gradeArsenal(a);
  
  const stamina = p.stamina || 0;
  const pitchCount = [a.fastballPot, a.changeupPot, a.curveballPot, a.sliderPot, a.sinkerPot, a.splitterPot, a.cutterPot, a.circleChangePot]
    .filter(pt => pt !== null && pt >= 45).length;
  
  if (stamina >= 55 && pitchCount >= 3 && ['Elite', 'Plus', 'Above Average'].includes(grade)) {
    return { role: 'Starter', confidence: 'High', reason: `STM ${stamina}, ${pitchCount} pitches, ${grade} arsenal` };
  }
  if (stamina <= 35 || pitchCount <= 2) {
    return { role: 'Reliever', confidence: 'High', reason: stamina <= 35 ? `Low STM (${stamina})` : `Limited arsenal (${pitchCount})` };
  }
  if (stamina >= 45 && pitchCount >= 3) {
    return { role: 'Swingman', confidence: 'Medium', reason: `Moderate STM (${stamina})` };
  }
  return { role: 'Reliever', confidence: 'Medium', reason: 'Profile leans reliever' };
}

// ==================== SIMILAR PLAYERS ====================

export function findSimilarPlayers(player: Player, allPlayers: Player[], count: number = 3): string[] {
  const isPitcher = PITCHER_POSITIONS.includes(player.position as any);
  
  const candidates = allPlayers.filter(p => 
    p.id !== player.id && PITCHER_POSITIONS.includes(p.position as any) === isPitcher
  );
  
  const withSim = candidates.map(c => {
    let sim = 0;
    sim -= Math.abs(player.overall - c.overall) * 2;
    sim -= Math.abs(player.potential - c.potential) * 2;
    if (player.position === c.position) sim += 20;
    sim += player.archetypes.filter(a => c.archetypes.includes(a)).length * 10;
    sim -= Math.abs(player.age - c.age) * 3;
    
    if (isPitcher && player.pitchingRatings && c.pitchingRatings) {
      const p1 = player.pitchingRatings, p2 = c.pitchingRatings;
      if (p1.stuffPot && p2.stuffPot) sim -= Math.abs(p1.stuffPot - p2.stuffPot);
      if (p1.movementPot && p2.movementPot) sim -= Math.abs(p1.movementPot - p2.movementPot);
      if (p1.controlPot && p2.controlPot) sim -= Math.abs(p1.controlPot - p2.controlPot);
    } else if (player.battingRatings && c.battingRatings) {
      const b1 = player.battingRatings, b2 = c.battingRatings;
      if (b1.powerPot && b2.powerPot) sim -= Math.abs(b1.powerPot - b2.powerPot);
      if (b1.contactPot && b2.contactPot) sim -= Math.abs(b1.contactPot - b2.contactPot);
      if (b1.eyePot && b2.eyePot) sim -= Math.abs(b1.eyePot - b2.eyePot);
    }
    
    return { player: c, sim };
  });
  
  return withSim.sort((a, b) => b.sim - a.sim).slice(0, count).map(p => p.player.id);
}

// ==================== SPEED/DEFENSE & SWING SUMMARY ====================

export function calculateSpeedDefenseScore(player: Player): number | null {
  if (!player.speedRatings || !player.defenseRatings) return null;
  const s = player.speedRatings;
  
  const speedScore = calculateSpeedScore(s);
  const defenseScore = calculateDefenseScore(player.defenseRatings, player.position);
  
  return speedScore * 0.4 + defenseScore * 0.6;
}

export function getSwingTendencySummary(player: Player): string {
  const b = player.battingRatings;
  if (!b) return 'N/A';
  
  const parts: string[] = [];
  if (b.battedBallType) parts.push(b.battedBallType);
  if (b.groundBallTendency && b.groundBallTendency !== 'Normal') parts.push(`GB: ${b.groundBallTendency}`);
  if (b.flyBallTendency && b.flyBallTendency !== 'Normal') parts.push(`FB: ${b.flyBallTendency}`);
  
  return parts.length > 0 ? parts.join(', ') : 'Normal approach';
}

// ==================== FULL ANALYSIS ====================

export function analyzePlayer(
  player: Omit<Player, 'compositeScore' | 'tier' | 'isSleeper' | 'sleeperScore' | 'archetypes' | 'redFlags' | 'greenFlags' | 'hasSplitsIssues' | 'isTwoWay' | 'scoreBreakdown' | 'similarPlayers' | 'ranking'>,
  philosophy: DraftPhilosophy
): Player {
  const fullPlayer = player as Player;
  const archetypes = detectArchetypes(fullPlayer);
  const redFlags = detectRedFlags(fullPlayer);
  const greenFlags = detectGreenFlags(fullPlayer);
  const hasSplitsIssues = detectSplitsIssues(fullPlayer);
  const isTwoWay = detectTwoWay(fullPlayer);
  const { score, breakdown } = calculateCompositeScore(fullPlayer, philosophy);
  const tier = assignTier(score, philosophy.tierThresholds);
  const sleeperScore = calculateSleeperScore(fullPlayer, philosophy);
  
  return {
    ...player,
    compositeScore: score,
    tier,
    isSleeper: false,
    sleeperScore,
    archetypes,
    redFlags,
    greenFlags,
    hasSplitsIssues,
    isTwoWay,
    scoreBreakdown: breakdown,
    similarPlayers: [],
  };
}

export function analyzeAllPlayers(
  players: Omit<Player, 'compositeScore' | 'tier' | 'isSleeper' | 'sleeperScore' | 'archetypes' | 'redFlags' | 'greenFlags' | 'hasSplitsIssues' | 'isTwoWay' | 'scoreBreakdown' | 'similarPlayers' | 'ranking'>[],
  philosophy: DraftPhilosophy
): Player[] {
  let analyzed = players.map(p => analyzePlayer(p, philosophy));
  
  const sortedSleepers = [...analyzed].filter(p => (p.sleeperScore || 0) >= 3).sort((a, b) => (b.sleeperScore || 0) - (a.sleeperScore || 0));
  const sleeperIds = new Set(sortedSleepers.slice(0, 15).map(p => p.id));
  
  analyzed = analyzed.map(p => ({
    ...p,
    isSleeper: sleeperIds.has(p.id),
    similarPlayers: findSimilarPlayers(p, analyzed, 3),
  }));
  
  return analyzed;
}
