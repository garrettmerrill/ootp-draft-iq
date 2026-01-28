import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDemand(demand: string | null): string {
  if (!demand) return 'Unknown';
  return demand;
}

export function getTierColor(tier: string | null): string {
  switch (tier) {
    case 'Elite':
      return 'text-elite bg-elite/10 border-elite';
    case 'Very Good':
      return 'text-veryGood bg-veryGood/10 border-veryGood';
    case 'Good':
      return 'text-good bg-good/10 border-good';
    case 'Average':
      return 'text-average bg-average/10 border-average';
    case 'Filler':
      return 'text-filler bg-filler/10 border-filler';
    default:
      return 'text-dugout-400 bg-dugout-100 border-dugout-300';
  }
}

export function getTierBgColor(tier: string | null): string {
  switch (tier) {
    case 'Elite':
      return 'bg-elite';
    case 'Very Good':
      return 'bg-veryGood';
    case 'Good':
      return 'bg-good';
    case 'Average':
      return 'bg-average';
    case 'Filler':
      return 'bg-filler';
    default:
      return 'bg-dugout-400';
  }
}

export function getRatingColor(rating: number | null): string {
  if (rating === null) return 'text-dugout-400';
  if (rating >= 70) return 'text-elite';
  if (rating >= 60) return 'text-veryGood';
  if (rating >= 50) return 'text-good';
  if (rating >= 40) return 'text-average';
  return 'text-filler';
}

export function formatPosition(position: string, throws?: string): string {
  const pitcherPositions = ['SP', 'RP', 'CL'];
  if (pitcherPositions.includes(position) && throws) {
    return `${throws === 'L' ? 'LHP' : 'RHP'} (${position})`;
  }
  return position;
}

export function formatHeight(height: string): string {
  return height;
}

export function formatWeight(weight: string): string {
  return weight;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function parseNaturalLanguageQuery(query: string): {
  positions: string[];
  minPotential: number | null;
  maxPotential: number | null;
  minOverall: number | null;
  maxOverall: number | null;
  tiers: string[];
  archetypes: string[];
  showDrafted: boolean;
  showSleepersOnly: boolean;
  showTwoWayOnly: boolean;
  collegeOnly: boolean;
  hsOnly: boolean;
  maxDemand: number | null;
  throws: string | null;
  bats: string | null;
} {
  const result = {
    positions: [] as string[],
    minPotential: null as number | null,
    maxPotential: null as number | null,
    minOverall: null as number | null,
    maxOverall: null as number | null,
    tiers: [] as string[],
    archetypes: [] as string[],
    showDrafted: false,
    showSleepersOnly: false,
    showTwoWayOnly: false,
    collegeOnly: false,
    hsOnly: false,
    maxDemand: null as number | null,
    throws: null as string | null,
    bats: null as string | null,
  };

  const q = query.toLowerCase();

  // Positions
  const positionMap: Record<string, string> = {
    'catcher': 'C', 'c': 'C',
    'first base': '1B', '1b': '1B', 'first baseman': '1B',
    'second base': '2B', '2b': '2B', 'second baseman': '2B',
    'third base': '3B', '3b': '3B', 'third baseman': '3B',
    'shortstop': 'SS', 'ss': 'SS', 'short': 'SS',
    'left field': 'LF', 'lf': 'LF', 'left fielder': 'LF',
    'center field': 'CF', 'cf': 'CF', 'center fielder': 'CF',
    'right field': 'RF', 'rf': 'RF', 'right fielder': 'RF',
    'starting pitcher': 'SP', 'sp': 'SP', 'starter': 'SP', 'starters': 'SP',
    'relief pitcher': 'RP', 'rp': 'RP', 'reliever': 'RP', 'relievers': 'RP',
    'closer': 'CL', 'cl': 'CL', 'closers': 'CL',
    'pitcher': 'SP', 'pitchers': 'SP',
    'outfielder': 'OF', 'outfielders': 'OF', 'of': 'OF',
    'infielder': 'IF', 'infielders': 'IF', 'if': 'IF',
  };

  for (const [key, value] of Object.entries(positionMap)) {
    if (q.includes(key)) {
      if (value === 'OF') {
        result.positions.push('LF', 'CF', 'RF');
      } else if (value === 'IF') {
        result.positions.push('2B', '3B', 'SS');
      } else {
        result.positions.push(value);
      }
    }
  }
  result.positions = [...new Set(result.positions)];

  // Potential thresholds
  const potMatch = q.match(/(\d+)\+?\s*pot(ential)?/);
  if (potMatch) {
    result.minPotential = parseInt(potMatch[1], 10);
  }

  // Overall thresholds
  const ovrMatch = q.match(/(\d+)\+?\s*ov(r|erall)?/);
  if (ovrMatch) {
    result.minOverall = parseInt(ovrMatch[1], 10);
  }

  // Tiers
  if (q.includes('elite')) result.tiers.push('Elite');
  if (q.includes('very good')) result.tiers.push('Very Good');
  if (q.includes('good') && !q.includes('very good')) result.tiers.push('Good');
  if (q.includes('average')) result.tiers.push('Average');
  if (q.includes('filler')) result.tiers.push('Filler');

  // Archetypes
  const archetypeKeywords = [
    'power bat', 'contact hitter', 'five-tool', 'five tool', 'toolsy',
    'defensive ss', 'defensive c', 'speed threat', 'patient hitter',
    'raw power', 'utility', 'glove-first', 'glove first', 'balanced',
    'ace', 'mid-rotation', 'mid rotation', 'back-end', 'back end',
    'power arm', 'groundball', 'ground ball', 'strikeout', 'control pitcher',
    'closer material', 'fastball-only', 'fastball only', 'elite arsenal', 'sidearmer'
  ];
  
  for (const keyword of archetypeKeywords) {
    if (q.includes(keyword)) {
      // Convert to proper archetype name
      const archetypeMap: Record<string, string> = {
        'power bat': 'Power Bat',
        'contact hitter': 'Contact Hitter',
        'five-tool': 'Five-Tool Player',
        'five tool': 'Five-Tool Player',
        'toolsy': 'Toolsy OF',
        'defensive ss': 'Defensive SS',
        'defensive c': 'Defensive C',
        'speed threat': 'Speed Threat',
        'patient hitter': 'Patient Hitter',
        'raw power': 'Raw Power',
        'utility': 'Utility Player',
        'glove-first': 'Glove-First',
        'glove first': 'Glove-First',
        'balanced': 'Balanced Hitter',
        'ace': 'Ace Potential',
        'mid-rotation': 'Mid-Rotation Starter',
        'mid rotation': 'Mid-Rotation Starter',
        'back-end': 'Back-End Starter',
        'back end': 'Back-End Starter',
        'power arm': 'Power Arm',
        'groundball': 'Groundball Specialist',
        'ground ball': 'Groundball Specialist',
        'strikeout': 'Strikeout Artist',
        'control pitcher': 'Control Pitcher',
        'closer material': 'Closer Material',
        'fastball-only': 'Fastball-Only',
        'fastball only': 'Fastball-Only',
        'elite arsenal': 'Elite Arsenal',
        'sidearmer': 'Sidearmer',
      };
      if (archetypeMap[keyword]) {
        result.archetypes.push(archetypeMap[keyword]);
      }
    }
  }

  // Status filters
  if (q.includes('available') || q.includes('undrafted')) {
    result.showDrafted = false;
  }
  if (q.includes('drafted')) {
    result.showDrafted = true;
  }
  if (q.includes('sleeper')) {
    result.showSleepersOnly = true;
  }
  if (q.includes('two-way') || q.includes('two way')) {
    result.showTwoWayOnly = true;
  }

  // College/HS
  if (q.includes('college') || q.includes('co ')) {
    result.collegeOnly = true;
  }
  if (q.includes('high school') || q.includes('hs ') || q.includes(' hs')) {
    result.hsOnly = true;
  }

  // Handedness
  if (q.includes('left handed') || q.includes('left-handed') || q.includes('lefty') || q.includes('lhp')) {
    if (q.includes('pitcher') || q.includes('sp') || q.includes('lhp')) {
      result.throws = 'L';
    } else {
      result.bats = 'L';
    }
  }
  if (q.includes('right handed') || q.includes('right-handed') || q.includes('righty') || q.includes('rhp')) {
    if (q.includes('pitcher') || q.includes('sp') || q.includes('rhp')) {
      result.throws = 'R';
    } else {
      result.bats = 'R';
    }
  }
  if (q.includes('switch')) {
    result.bats = 'S';
  }

  // Demand
  const demandMatch = q.match(/under\s*\$?([\d.]+)\s*(m|k)?/i);
  if (demandMatch) {
    let amount = parseFloat(demandMatch[1]);
    if (demandMatch[2]?.toLowerCase() === 'm') amount *= 1000000;
    else if (demandMatch[2]?.toLowerCase() === 'k') amount *= 1000;
    result.maxDemand = amount;
  }

  return result;
}
