import {
  Player,
  DraftPhilosophy,
  Tier,
  ScoreBreakdown,
  PitchArsenal,
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

// ==================== COMPOSITE SCORE ====================
/*
 * HOW SCORING WORKS:
 * 
 * The composite score has 3 main parts that add together:
 * 
 * 1. BASE SCORE (from POT/OVR weights):
 *    - Your POT weight % of the player's potential rating (20-80 scale → 0-100)
 *    - Your OVR weight % of the player's overall rating
 *    - Example: 70 POT with 50% weight = 41.7 points, 35 OVR with 20% weight = 5 points
 * 
 * 2. SKILLS SCORE (from rating weights):
 *    - The remaining % (100 - POT weight - OVR weight) comes from individual skills
 *    - For batters: Power, Contact (or BABIP+AvoidK), Eye, Gap, Speed, Defense
 *    - For pitchers: Stuff, Movement (or PBABIP+HR Rate), Control, Stamina, Arsenal
 *    - Each skill is weighted by your philosophy settings
 * 
 * 3. ADJUSTMENTS (bonuses and penalties):
 *    - Risk penalty: High/Very High risk players lose points
 *    - Position bonus: Priority positions get extra points
 *    - College/HS bonus: If you prefer one over the other
 *    - Personality bonuses: High work ethic, intelligence, etc. add points
 *    - Personality penalties: Low work ethic, injury prone, etc. subtract points
 *    - Batter/Pitcher type bonuses: Flyball hitters, groundball pitchers, etc.
 * 
 * EXAMPLE for a 70 POT / 35 OVR batter with default weights:
 *   Base: (70 POT → 83.3 normalized × 40%) + (35 OVR → 25 normalized × 20%) = 38.3
 *   Skills: 40% of score from weighted average of Power, Contact, Eye, etc.
 *   Adjustments: +5 for High Work Ethic, -10 for High Risk, etc.
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

  // 3. SKILLS SCORE: Calculate weighted average of individual ratings
  let skillsScore = 0;
  let totalSkillWeight = 0;

  if (isPitcher && player.pitchingRatings && player.pitchArsenal) {
    const p = player.pitchingRatings;
    const a = player.pitchArsenal;
    const w = isStarter ? philosophy.spWeights : philosophy.rpWeights;

    // Stuff
    if (p.stuffPot !== null) {
      const contrib = normalize(p.stuffPot) * w.stuff;
      breakdown.ratingContributions['Stuff'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += w.stuff;
    }

    // Movement vs PBABIP+HR toggle
    const useMovement = isStarter ? philosophy.useMovementSP : philosophy.useMovementRP;
    
    if (useMovement) {
      if (p.movementPot !== null) {
        const contrib = normalize(p.movementPot) * w.movement;
        breakdown.ratingContributions['Movement'] = contrib / 100;
        skillsScore += contrib;
        totalSkillWeight += w.movement;
      }
    } else {
      if (p.pBabipPot !== null) {
        const contrib = normalize(p.pBabipPot) * w.pBabip;
        breakdown.ratingContributions['PBABIP'] = contrib / 100;
        skillsScore += contrib;
        totalSkillWeight += w.pBabip;
      }
      if (p.hrRatePot !== null) {
        const contrib = normalize(p.hrRatePot) * w.hrRate;
        breakdown.ratingContributions['HR Rate'] = contrib / 100;
        skillsScore += contrib;
        totalSkillWeight += w.hrRate;
      }
    }

    // Control
    if (p.controlPot !== null) {
      const contrib = normalize(p.controlPot) * w.control;
      breakdown.ratingContributions['Control'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += w.control;
    }

    // Stamina (SP only)
    if (isStarter && p.stamina !== null) {
      const staminaWeight = philosophy.spWeights.stamina;
      const contrib = normalize(p.stamina) * staminaWeight;
      breakdown.ratingContributions['Stamina'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += staminaWeight;
    }

    // Arsenal quality (count of 55+ potential pitches, max 3 for full credit)
    const pitchPots = [a.fastballPot, a.changeupPot, a.curveballPot, a.sliderPot, a.sinkerPot, 
                       a.splitterPot, a.cutterPot, a.circleChangePot, a.forkballPot]
      .filter(pt => pt !== null && pt >= 55).length;
    const arsenalNormalized = Math.min(pitchPots / 3, 1) * 100;
    const arsenalContrib = arsenalNormalized * w.arsenal;
    breakdown.ratingContributions['Arsenal'] = arsenalContrib / 100;
    skillsScore += arsenalContrib;
    totalSkillWeight += w.arsenal;

  } else if (player.battingRatings && player.speedRatings && player.defenseRatings) {
    const b = player.battingRatings;
    const s = player.speedRatings;
    const d = player.defenseRatings;
    const w = philosophy.batterWeights;

    // Power
    if (b.powerPot !== null) {
      const contrib = normalize(b.powerPot) * w.power;
      breakdown.ratingContributions['Power'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += w.power;
    }

    // Contact vs BABIP+AvoidK toggle
    if (philosophy.useBabipKs) {
      if (b.babipPot !== null) {
        const contrib = normalize(b.babipPot) * w.babip;
        breakdown.ratingContributions['BABIP'] = contrib / 100;
        skillsScore += contrib;
        totalSkillWeight += w.babip;
      }
      if (b.avoidKPot !== null) {
        const contrib = normalize(b.avoidKPot) * w.avoidK;
        breakdown.ratingContributions['Avoid K'] = contrib / 100;
        skillsScore += contrib;
        totalSkillWeight += w.avoidK;
      }
    } else {
      if (b.contactPot !== null) {
        const contrib = normalize(b.contactPot) * w.contact;
        breakdown.ratingContributions['Contact'] = contrib / 100;
        skillsScore += contrib;
        totalSkillWeight += w.contact;
      }
    }

    // Eye
    if (b.eyePot !== null) {
      const contrib = normalize(b.eyePot) * w.eye;
      breakdown.ratingContributions['Eye'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += w.eye;
    }

    // Gap
    if (b.gapPot !== null) {
      const contrib = normalize(b.gapPot) * w.gap;
      breakdown.ratingContributions['Gap'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += w.gap;
    }

    // Speed
    if (s.speed !== null) {
      const contrib = normalize(s.speed) * w.speed;
      breakdown.ratingContributions['Speed'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += w.speed;
    }

    // Defense (best of IF range, OF range, or catcher ability based on position)
    let defenseRating = 0;
    if (player.position === 'C') {
      defenseRating = Math.max(d.catcherAbility || 0, d.catcherFraming || 0);
    } else if (['LF', 'CF', 'RF'].includes(player.position)) {
      defenseRating = d.outfieldRange || 0;
    } else {
      defenseRating = d.infieldRange || 0;
    }
    if (defenseRating > 0) {
      const contrib = normalize(defenseRating) * w.defense;
      breakdown.ratingContributions['Defense'] = contrib / 100;
      skillsScore += contrib;
      totalSkillWeight += w.defense;
    }
  }

  // Normalize skills score to be out of 100, then apply skills weight
  if (totalSkillWeight > 0) {
    const normalizedSkillsScore = (skillsScore / totalSkillWeight) * 100;
    breakdown.skillsContribution = (normalizedSkillsScore * skillsWeight) / 100;
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
  const s = player.speedRatings, d = player.defenseRatings;
  
  let bestDef = 0;
  if (player.position === 'C') bestDef = Math.max(d.catcherAbility || 0, d.catcherFraming || 0);
  else if (['LF', 'CF', 'RF'].includes(player.position)) bestDef = Math.max(d.outfieldRange || 0, d.outfieldArm || 0);
  else bestDef = Math.max(d.infieldRange || 0, d.infieldArm || 0, d.turnDoublePlay || 0);
  
  return (s.speed || 0) * 0.4 + bestDef * 0.6;
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
