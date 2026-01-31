'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, GripVertical, X, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Player, TierNames, DEFAULT_TIER_NAMES } from '@/types';

interface RankedPlayer {
  id: string;
  odraftId: string;
  odPlayerId: string;
  tier: number;
  rankInTier: number;
  player: Player;
}

interface TierSectionProps {
  tier: number;
  tierName: string;
  players: RankedPlayer[];
  overallStartRank: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRemovePlayer: (playerId: string) => void;
  onChangeTier: (rankingId: string, newTier: number) => void;
  tierNames: TierNames;
  isDragOver?: boolean;
  activeId?: string | null;
  activeTier?: number | null;
  expandedPlayerId?: string | null;
  onToggleExpand?: (playerId: string | null) => void;
}

export function TierSection({
  tier,
  tierName,
  players,
  overallStartRank,
  isCollapsed,
  onToggleCollapse,
  onRemovePlayer,
  onChangeTier,
  tierNames,
  isDragOver = false,
  activeId,
  activeTier,
  expandedPlayerId,
  onToggleExpand,
}: TierSectionProps) {
  const [localExpandedId, setLocalExpandedId] = useState<string | null>(null);
  
  // Use parent state if provided, otherwise use local state
  const currentExpandedId = expandedPlayerId !== undefined ? expandedPlayerId : localExpandedId;
  const handleToggleExpand = onToggleExpand || ((id: string | null) => setLocalExpandedId(id));
  
  const { setNodeRef, isOver } = useDroppable({
    id: `tier-${tier}`,
    data: { tier, type: 'tier' },
  });

  // Only show highlight if dragging FROM a different tier
  const showDropHighlight = (isOver || isDragOver) && activeId && activeTier !== null && activeTier !== tier;

  const tierColors: Record<number, string> = {
    1: 'border-l-blue-500',
    2: 'border-l-green-500',
    3: 'border-l-yellow-500',
    4: 'border-l-orange-500',
    5: 'border-l-red-500',
  };

  const tierBgColors: Record<number, string> = {
    1: 'bg-blue-500/5',
    2: 'bg-green-500/5',
    3: 'bg-yellow-500/5',
    4: 'bg-orange-500/5',
    5: 'bg-red-500/5',
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border border-dugout-200 dark:border-dugout-700 overflow-hidden transition-all duration-200',
        'border-l-4',
        tierColors[tier],
        showDropHighlight && 'ring-2 ring-diamond-500 ring-offset-2 dark:ring-offset-dugout-900 scale-[1.01]'
      )}
    >
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
          'hover:bg-dugout-50 dark:hover:bg-dugout-800/50',
          tierBgColors[tier]
        )}
      >
        <div className="flex items-center gap-3">
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-dugout-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-dugout-400" />
          )}
          <span className="font-semibold text-dugout-900 dark:text-white">
            Tier {tier}: {tierName}
          </span>
          <span className="text-sm text-dugout-500 dark:text-dugout-400">
            ({players.length} {players.length === 1 ? 'player' : 'players'})
          </span>
        </div>
      </button>

      {/* Drop zone indicator when dragging between tiers */}
      {showDropHighlight && (
        <div className="px-4 py-2 bg-diamond-100 dark:bg-diamond-900/30 border-y border-diamond-200 dark:border-diamond-800 animate-pulse">
          <p className="text-sm text-diamond-700 dark:text-diamond-400 text-center font-medium">
            Drop here to move to {tierName}
          </p>
        </div>
      )}

      {/* Players */}
      {!isCollapsed && (
        <SortableContext
          items={players.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="divide-y divide-dugout-100 dark:divide-dugout-800">
            {players.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-dugout-400">
                No players in this tier
              </div>
            ) : (
              players.map((ranking, index) => (
                <SortableRankingCard
                  key={ranking.id}
                  ranking={ranking}
                  overallRank={overallStartRank + index}
                  onRemove={() => onRemovePlayer(ranking.player.id)}
                  onChangeTier={onChangeTier}
                  tierNames={tierNames}
                  currentTier={tier}
                  isExpanded={currentExpandedId === ranking.player.id}
                  onToggleExpand={() => handleToggleExpand(currentExpandedId === ranking.player.id ? null : ranking.player.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

// Rating Bar Component with color-coded visualization
function RatingBar({ 
  label, 
  current, 
  potential, 
  small = false 
}: { 
  label: string; 
  current: number; 
  potential: number | null | undefined;
  small?: boolean;
}) {
  const getRatingColor = (rating: number): string => {
    if (rating >= 70) return 'bg-blue-500';
    if (rating >= 60) return 'bg-green-500';
    if (rating >= 50) return 'bg-green-300';
    if (rating >= 40) return 'bg-orange-400';
    return 'bg-red-500';
  };
  
  const getTextColor = (rating: number): string => {
    if (rating >= 70) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 60) return 'text-green-600 dark:text-green-400';
    if (rating >= 50) return 'text-green-500 dark:text-green-300';
    if (rating >= 40) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };
  
  const maxValue = 80;
  const currentPercentage = (current / maxValue) * 100;
  const potentialPercentage = potential ? (potential / maxValue) * 100 : currentPercentage;
  
  return (
    <div className={small ? "text-xs" : ""}>
      <div className="flex justify-between items-center mb-1">
        <span className={`${small ? 'text-xs' : 'text-sm'} font-medium text-dugout-600 dark:text-dugout-400`}>
          {label}
        </span>
        <div className="flex gap-2 text-xs">
          <span className={`font-semibold ${getTextColor(current)}`}>
            {current}
          </span>
          {potential !== null && potential !== undefined && (
            <span className={`font-semibold ${getTextColor(potential)}`}>
              / {potential}
            </span>
          )}
        </div>
      </div>
      
      <div className="relative w-full bg-dugout-200 dark:bg-dugout-700 rounded-full h-2 overflow-hidden">
        {potential !== null && potential !== undefined && potential > current && (
          <div 
            className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getRatingColor(potential)} opacity-40`}
            style={{ width: `${potentialPercentage}%` }}
          />
        )}
        <div 
          className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getRatingColor(current)}`}
          style={{ width: `${currentPercentage}%` }}
        />
      </div>
    </div>
  );
}

// Helper function to get personality color class
function getPersonalityColor(trait: string, value: string | null): string {
  if (!value) return '';
  
  // Work Ethic, Intelligence, Adaptability: High = good, Low = bad
  if (['workEthic', 'intelligence', 'adaptability'].includes(trait)) {
    if (value === 'H' || value === 'High') return 'text-greenFlag';
    if (value === 'L' || value === 'Low') return 'text-redFlag';
    return '';
  }
  
  // Leadership: Leader = good
  if (trait === 'leadership') {
    if (value === 'L' || value === 'Leader') return 'text-greenFlag';
    return '';
  }
  
  // Loyalty: High = good (loyal)
  if (trait === 'loyalty') {
    if (value === 'H' || value === 'High') return 'text-greenFlag';
    if (value === 'L' || value === 'Low') return 'text-redFlag';
    return '';
  }
  
  // Financial Ambition: Low = good (less demanding), High = bad
  if (trait === 'financialAmbition') {
    if (value === 'L' || value === 'Low') return 'text-greenFlag';
    if (value === 'H' || value === 'High') return 'text-redFlag';
    return '';
  }
  
  // Injury Prone: Durable/Normal = good, Prone/Fragile = bad
  if (trait === 'injuryProne') {
    if (value === 'Durable') return 'text-greenFlag';
    if (value === 'Prone' || value === 'Fragile') return 'text-redFlag';
    return '';
  }
  
  return '';
}

// Helper function to format personality value for display
function formatPersonalityValue(value: string | null): string {
  if (!value) return 'N/A';
  
  const valueMap: Record<string, string> = {
    'H': 'High',
    'L': 'Low',
    'N': 'Normal',
    'VH': 'Very High',
  };
  
  return valueMap[value] || value;
}

// Helper function to get G/F label
function getGroundFlyLabel(gf: string | null): string {
  if (!gf) return 'N/A';
  
  const labelMap: Record<string, string> = {
    'EX GB': 'Extreme GB',
    'GB': 'Groundball',
    'NEU': 'Neutral',
    'FB': 'Flyball',
    'EX FB': 'Extreme FB',
  };
  
  return labelMap[gf] || gf;
}

interface SortableRankingCardProps {
  ranking: RankedPlayer;
  overallRank: number;
  onRemove: () => void;
  onChangeTier: (rankingId: string, newTier: number) => void;
  tierNames: TierNames;
  currentTier: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function SortableRankingCard({
  ranking,
  overallRank,
  onRemove,
  onChangeTier,
  tierNames,
  currentTier,
  isExpanded,
  onToggleExpand,
}: SortableRankingCardProps) {
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ 
    id: ranking.id,
    data: { tier: currentTier, ranking },
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  const player = ranking.player;
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-dugout-900 transition-all duration-200',
        isDragging && 'opacity-90 shadow-lg z-50 scale-[1.02] bg-dugout-50 dark:bg-dugout-800',
        player.isDrafted && 'opacity-50'
      )}
    >
      {/* Collapsed view - always visible */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className={cn(
            'cursor-grab active:cursor-grabbing p-1 rounded text-dugout-400 transition-colors flex-shrink-0',
            'hover:bg-dugout-100 dark:hover:bg-dugout-800 hover:text-dugout-600 dark:hover:text-dugout-300'
          )}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Clickable area for expanding */}
        <div
          onClick={onToggleExpand}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          {/* Overall rank */}
          <div className="w-8 text-center flex-shrink-0">
            <span className={cn(
              'text-sm font-bold',
              player.isDrafted ? 'text-dugout-400 line-through' : 'text-dugout-500'
            )}>
              #{overallRank}
            </span>
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'font-medium',
                player.isDrafted 
                  ? 'text-dugout-400 line-through' 
                  : 'text-dugout-900 dark:text-white'
              )}>
                {player.name}
              </span>
              <CopyButton text={player.name} />
              {player.isSleeper && (
                <span className="badge-sleeper">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Sleeper
                </span>
              )}
              {player.isTwoWay && (
                <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Two-Way
                </span>
              )}
              {player.isDrafted && (
                <span className="text-xs text-dugout-500 bg-dugout-100 dark:bg-dugout-800 px-2 py-0.5 rounded">
                  Drafted R{player.draftRound} P{player.draftPick}
                  {player.draftTeam && ` by ${player.draftTeam}`}
                </span>
              )}
            </div>
            <div className="text-xs text-dugout-500 dark:text-dugout-400">
              {isPitcher 
                ? `${player.throws === 'L' ? 'LHP' : 'RHP'} (${player.position})`
                : player.position
              } • Age {player.age} • {player.highSchoolClass}
              {!isPitcher && player.bats && ` • Bats: ${player.bats}`}
            </div>
          </div>

          {/* Ratings */}
          <div className="hidden sm:flex items-center gap-4 text-sm flex-shrink-0">
            <div className="text-center">
              <div className="text-xs text-dugout-400">OVR/POT</div>
              <div className="font-medium text-dugout-700 dark:text-dugout-300">
                {player.overall}/{player.potential}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-dugout-400">Score</div>
              <div className="font-medium text-dugout-700 dark:text-dugout-300">
                {player.compositeScore?.toFixed(1)}
              </div>
            </div>
            <div className="text-center min-w-[60px]">
              <div className="text-xs text-dugout-400">Demand</div>
              <div className="font-medium text-dugout-700 dark:text-dugout-300">
                {player.demandAmount || 'N/A'}
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {player.redFlags.length > 0 && (
              <span className="text-redFlag" title={player.redFlags.join(', ')}>
                <AlertTriangle className="w-4 h-4" />
              </span>
            )}
            {player.greenFlags.length > 0 && (
              <span className="text-greenFlag" title={player.greenFlags.join(', ')}>
                <CheckCircle className="w-4 h-4" />
              </span>
            )}
          </div>

          {/* Expand icon */}
          <div className="text-dugout-400 flex-shrink-0">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>

        {/* Tier dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTierDropdown(!showTierDropdown);
            }}
            className="px-2 py-1 text-xs rounded border border-dugout-200 dark:border-dugout-700 hover:bg-dugout-50 dark:hover:bg-dugout-800 text-dugout-600 dark:text-dugout-400 transition-colors"
          >
            Tier {currentTier}
          </button>
          {showTierDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowTierDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg shadow-lg border border-dugout-200 dark:border-dugout-700 bg-white dark:bg-dugout-900 py-1">
                {[1, 2, 3, 4, 5].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (t !== currentTier) {
                        onChangeTier(ranking.id, t);
                      }
                      setShowTierDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-sm transition-colors',
                      t === currentTier 
                        ? 'bg-diamond-100 dark:bg-diamond-900/30 text-diamond-700 dark:text-diamond-400'
                        : 'hover:bg-dugout-100 dark:hover:bg-dugout-800 text-dugout-700 dark:text-dugout-300'
                    )}
                  >
                    {t} - {tierNames[t as keyof TierNames] || DEFAULT_TIER_NAMES[t as keyof TierNames]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 rounded text-dugout-400 hover:text-redFlag hover:bg-redFlag/10 transition-colors flex-shrink-0"
          title="Remove from rankings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded view - detailed ratings */}
      {isExpanded && (
        <div className="border-t border-dugout-200 dark:border-dugout-700 p-4 bg-dugout-50 dark:bg-dugout-800/30">
          {isPitcher ? (
            // ===================== PITCHER LAYOUT =====================
            <div className="space-y-4">
              {/* Main Content: Two columns - Pitching on left, Arsenal on right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Pitching Ratings */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Pitching Ratings</h4>
                    <div className="space-y-3">
                      {player.pitchingRatings?.stuff !== null && player.pitchingRatings && (
                        <RatingBar 
                          label="Stuff" 
                          current={player.pitchingRatings.stuff!} 
                          potential={player.pitchingRatings.stuffPot} 
                        />
                      )}
                      
                      {player.pitchingRatings?.movement !== null && player.pitchingRatings && (
                        <RatingBar 
                          label="Movement" 
                          current={player.pitchingRatings.movement!} 
                          potential={player.pitchingRatings.movementPot} 
                        />
                      )}
                      
                      {/* PBABIP and HR Rate are subratings of Movement */}
                      {player.pitchingRatings?.movement !== null && player.pitchingRatings && (
                        <div className="pl-4 space-y-2 border-l-2 border-dugout-200 dark:border-dugout-700 ml-1">
                          {player.pitchingRatings?.pBabip !== null && (
                            <RatingBar 
                              label="PBABIP" 
                              current={player.pitchingRatings.pBabip!} 
                              potential={player.pitchingRatings.pBabipPot} 
                              small
                            />
                          )}
                          
                          {player.pitchingRatings?.hrRate !== null && (
                            <RatingBar 
                              label="HR Rate" 
                              current={player.pitchingRatings.hrRate!} 
                              potential={player.pitchingRatings.hrRatePot} 
                              small
                            />
                          )}
                        </div>
                      )}
                      
                      {player.pitchingRatings?.control !== null && player.pitchingRatings && (
                        <RatingBar 
                          label="Control" 
                          current={player.pitchingRatings.control!} 
                          potential={player.pitchingRatings.controlPot} 
                        />
                      )}
                      
                      {player.pitchingRatings?.stamina !== null && player.pitchingRatings && (
                        <RatingBar 
                          label="Stamina" 
                          current={player.pitchingRatings.stamina!} 
                          potential={null} 
                        />
                      )}
                      
                      {player.pitchingRatings?.holdRunners !== null && player.pitchingRatings && (
                        <RatingBar 
                          label="Hold Runners" 
                          current={player.pitchingRatings.holdRunners!} 
                          potential={null} 
                          small
                        />
                      )}
                    </div>
                    
                    {/* Velocity and G/F Type */}
                    <div className="mt-4 pt-3 border-t border-dugout-200 dark:border-dugout-700 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-dugout-500">Velocity</span>
                        <div className="font-semibold text-dugout-900 dark:text-white">
                          {player.pitchingRatings?.velocity || 'N/A'}
                          {player.pitchingRatings?.velocityPotential && player.pitchingRatings.velocityPotential !== player.pitchingRatings.velocity && (
                            <span className="text-diamond-600 dark:text-diamond-400"> → {player.pitchingRatings.velocityPotential}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-dugout-500">Type</span>
                        <div className="font-semibold text-dugout-900 dark:text-white">
                          {getGroundFlyLabel(player.pitchingRatings?.groundFlyRatio || null)}
                        </div>
                      </div>
                      <div>
                        <span className="text-dugout-500">Arm Slot</span>
                        <div className="font-semibold text-dugout-900 dark:text-white">
                          {player.pitchingRatings?.armSlot || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-dugout-500">Pitcher Type</span>
                        <div className="font-semibold text-dugout-900 dark:text-white">
                          {player.pitchingRatings?.pitcherType || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column: Arsenal */}
                <div className="space-y-4">
                  {/* Pitch Arsenal */}
                  {player.pitchArsenal && (() => {
                    const pitches = [
                      { name: 'Fastball', current: player.pitchArsenal.fastball, potential: player.pitchArsenal.fastballPot },
                      { name: 'Changeup', current: player.pitchArsenal.changeup, potential: player.pitchArsenal.changeupPot },
                      { name: 'Curveball', current: player.pitchArsenal.curveball, potential: player.pitchArsenal.curveballPot },
                      { name: 'Slider', current: player.pitchArsenal.slider, potential: player.pitchArsenal.sliderPot },
                      { name: 'Sinker', current: player.pitchArsenal.sinker, potential: player.pitchArsenal.sinkerPot },
                      { name: 'Splitter', current: player.pitchArsenal.splitter, potential: player.pitchArsenal.splitterPot },
                      { name: 'Cutter', current: player.pitchArsenal.cutter, potential: player.pitchArsenal.cutterPot },
                      { name: 'Forkball', current: player.pitchArsenal.forkball, potential: player.pitchArsenal.forkballPot },
                      { name: 'Circle Change', current: player.pitchArsenal.circleChange, potential: player.pitchArsenal.circleChangePot },
                      { name: 'Screwball', current: player.pitchArsenal.screwball, potential: player.pitchArsenal.screwballPot },
                      { name: 'Knuckle Curve', current: player.pitchArsenal.knuckleCurve, potential: player.pitchArsenal.knucleCurvePot },
                      { name: 'Knuckleball', current: player.pitchArsenal.knuckleball, potential: player.pitchArsenal.knuckleballPot },
                    ].filter(p => p.current !== null && p.current !== undefined);
                    
                    if (pitches.length === 0) return null;
                    
                    return (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-dugout-700 dark:text-dugout-300 mb-3">
                          Arsenal ({pitches.length} {pitches.length === 1 ? 'Pitch' : 'Pitches'})
                        </h4>
                        <div className="space-y-2">
                          {pitches.map(pitch => (
                            <RatingBar 
                              key={pitch.name}
                              label={pitch.name} 
                              current={pitch.current!} 
                              potential={pitch.potential} 
                              small
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              {/* Bottom Section: Archetypes, Flags, Personality, Background */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-dugout-200 dark:border-dugout-700">
                {/* Archetypes & Flags */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Archetypes</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {player.archetypes.map(arch => (
                      <span key={arch} className="badge bg-diamond-100 dark:bg-diamond-900/30 text-diamond-700 dark:text-diamond-400">
                        {arch}
                      </span>
                    ))}
                    {player.archetypes.length === 0 && (
                      <span className="text-sm text-dugout-400">No archetypes</span>
                    )}
                  </div>
                  
                  {player.redFlags.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-redFlag mb-1">Red Flags</h5>
                      <div className="flex flex-wrap gap-1">
                        {player.redFlags.map(flag => (
                          <span key={flag} className="badge-redflag text-xs">{flag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {player.greenFlags.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-greenFlag mb-1">Green Flags</h5>
                      <div className="flex flex-wrap gap-1">
                        {player.greenFlags.map(flag => (
                          <span key={flag} className="badge-greenflag text-xs">{flag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Personality */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Personality</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Work Ethic</span>
                      <span className={cn("font-medium", getPersonalityColor('workEthic', player.workEthic))}>
                        {formatPersonalityValue(player.workEthic)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Intelligence</span>
                      <span className={cn("font-medium", getPersonalityColor('intelligence', player.intelligence))}>
                        {formatPersonalityValue(player.intelligence)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Leadership</span>
                      <span className={cn("font-medium", getPersonalityColor('leadership', player.leadership))}>
                        {formatPersonalityValue(player.leadership)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Adaptability</span>
                      <span className={cn("font-medium", getPersonalityColor('adaptability', player.adaptability))}>
                        {formatPersonalityValue(player.adaptability)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Loyalty</span>
                      <span className={cn("font-medium", getPersonalityColor('loyalty', player.loyalty))}>
                        {formatPersonalityValue(player.loyalty)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Greed</span>
                      <span className={cn("font-medium", getPersonalityColor('financialAmbition', player.financialAmbition))}>
                        {formatPersonalityValue(player.financialAmbition)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Background */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Background</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dugout-500">School</span>
                      <span className="text-dugout-900 dark:text-white">{player.school || 'N/A'}</span>
                    </div>
                    {player.committedSchool && (
                      <div className="flex justify-between">
                        <span className="text-dugout-500">Committed</span>
                        <span className="text-dugout-900 dark:text-white">{player.committedSchool}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Competition</span>
                      <span className="text-dugout-900 dark:text-white">{player.competitionLevel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Signability</span>
                      <span className="text-dugout-900 dark:text-white">{player.signability || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Scout Accuracy</span>
                      <span className="text-dugout-900 dark:text-white">{player.scoutAccuracy || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Risk</span>
                      <span className="text-dugout-900 dark:text-white">{player.risk || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Physical */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Physical</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Height</span>
                      <span className="text-dugout-900 dark:text-white">{player.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Weight</span>
                      <span className="text-dugout-900 dark:text-white">{player.weight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Durability</span>
                      <span className={cn("font-medium", getPersonalityColor('injuryProne', player.injuryProne))}>
                        {player.injuryProne || 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ===================== BATTER LAYOUT =====================
            <div className="space-y-4">
              {/* Main Content: Two columns - Batting + Speed on left, Defense on right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Batting + Speed */}
                <div className="space-y-4">
                  {/* Batting Ratings */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Batting Ratings</h4>
                    <div className="space-y-3">
                      {player.battingRatings?.contact !== null && player.battingRatings && (
                        <RatingBar 
                          label="Contact" 
                          current={player.battingRatings.contact!} 
                          potential={player.battingRatings.contactPot} 
                        />
                      )}
                      
                      {/* BABIP and Avoid K's are subratings of Contact */}
                      {player.battingRatings?.contact !== null && player.battingRatings && (
                        <div className="pl-4 space-y-2 border-l-2 border-dugout-200 dark:border-dugout-700 ml-1">
                          {player.battingRatings?.babip !== null && (
                            <RatingBar 
                              label="BABIP" 
                              current={player.battingRatings.babip!} 
                              potential={player.battingRatings.babipPot} 
                              small
                            />
                          )}
                          
                          {player.battingRatings?.avoidK !== null && (
                            <RatingBar 
                              label="Avoid K's" 
                              current={player.battingRatings.avoidK!} 
                              potential={player.battingRatings.avoidKPot} 
                              small
                            />
                          )}
                        </div>
                      )}
                      
                      {player.battingRatings?.gap !== null && player.battingRatings && (
                        <RatingBar 
                          label="Gap" 
                          current={player.battingRatings.gap!} 
                          potential={player.battingRatings.gapPot} 
                        />
                      )}
                      
                      {player.battingRatings?.power !== null && player.battingRatings && (
                        <RatingBar 
                          label="Power" 
                          current={player.battingRatings.power!} 
                          potential={player.battingRatings.powerPot} 
                        />
                      )}
                      
                      {player.battingRatings?.eye !== null && player.battingRatings && (
                        <RatingBar 
                          label="Eye" 
                          current={player.battingRatings.eye!} 
                          potential={player.battingRatings.eyePot} 
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Speed Section */}
                  {player.speedRatings && (player.speedRatings.speed !== null || player.speedRatings.baserunning !== null) && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Speed</h4>
                      <div className="space-y-2">
                        {player.speedRatings.speed !== null && (
                          <RatingBar label="Speed" current={player.speedRatings.speed} potential={null} />
                        )}
                        {player.speedRatings.stealingAbility !== null && (
                          <RatingBar label="Stealing Ability" current={player.speedRatings.stealingAbility} potential={null} small />
                        )}
                        {player.speedRatings.stealingAggression !== null && (
                          <RatingBar label="Stealing Aggression" current={player.speedRatings.stealingAggression} potential={null} small />
                        )}
                        {player.speedRatings.baserunning !== null && (
                          <RatingBar label="Baserunning" current={player.speedRatings.baserunning} potential={null} small />
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Column: Defense */}
                <div className="space-y-4">
                  {player.defenseRatings && (
                    <>
                      {/* Catcher Defense - only show for catchers */}
                      {player.position === 'C' && (player.defenseRatings.catcherAbility !== null || 
                        player.defenseRatings.catcherFraming !== null || 
                        player.defenseRatings.catcherArm !== null || 
                        player.defenseRatings.catcher !== null) && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Catcher Defense</h4>
                          <div className="space-y-2">
                            {player.defenseRatings.catcherAbility !== null && (
                              <RatingBar label="Blocking" current={player.defenseRatings.catcherAbility} potential={null} />
                            )}
                            {player.defenseRatings.catcherFraming !== null && (
                              <RatingBar label="Framing" current={player.defenseRatings.catcherFraming} potential={null} />
                            )}
                            {player.defenseRatings.catcherArm !== null && (
                              <RatingBar label="Arm" current={player.defenseRatings.catcherArm} potential={null} />
                            )}
                          </div>
                          
                          {/* Catcher Position Rating */}
                          {player.defenseRatings.catcher !== null && (
                            <div className="mt-3 pt-3 border-t border-dugout-200 dark:border-dugout-700">
                              <h5 className="text-xs font-medium text-dugout-500 dark:text-dugout-400 mb-2">Position Rating</h5>
                              <RatingBar label="C" current={player.defenseRatings.catcher} potential={player.defenseRatings.catcherPot} small />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Infield Defense */}
                      {(player.defenseRatings.infieldRange !== null || 
                        player.defenseRatings.infieldError !== null || 
                        player.defenseRatings.infieldArm !== null || 
                        player.defenseRatings.turnDoublePlay !== null) && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Infield Defense</h4>
                          <div className="space-y-2">
                            {player.defenseRatings.infieldRange !== null && (
                              <RatingBar label="Range" current={player.defenseRatings.infieldRange} potential={null} />
                            )}
                            {player.defenseRatings.infieldError !== null && (
                              <RatingBar label="Error" current={player.defenseRatings.infieldError} potential={null} />
                            )}
                            {player.defenseRatings.infieldArm !== null && (
                              <RatingBar label="Arm" current={player.defenseRatings.infieldArm} potential={null} />
                            )}
                            {player.defenseRatings.turnDoublePlay !== null && (
                              <RatingBar label="Turn DP" current={player.defenseRatings.turnDoublePlay} potential={null} />
                            )}
                          </div>
                          
                          {/* Infield Position Ratings */}
                          {(player.defenseRatings.firstBase !== null ||
                            player.defenseRatings.secondBase !== null ||
                            player.defenseRatings.thirdBase !== null ||
                            player.defenseRatings.shortstop !== null) && (
                            <div className="mt-3 pt-3 border-t border-dugout-200 dark:border-dugout-700">
                              <h5 className="text-xs font-medium text-dugout-500 dark:text-dugout-400 mb-2">Position Ratings</h5>
                              <div className="grid grid-cols-2 gap-2">
                                {player.defenseRatings.firstBase !== null && (
                                  <RatingBar label="1B" current={player.defenseRatings.firstBase} potential={player.defenseRatings.firstBasePot} small />
                                )}
                                {player.defenseRatings.secondBase !== null && (
                                  <RatingBar label="2B" current={player.defenseRatings.secondBase} potential={player.defenseRatings.secondBasePot} small />
                                )}
                                {player.defenseRatings.shortstop !== null && (
                                  <RatingBar label="SS" current={player.defenseRatings.shortstop} potential={player.defenseRatings.shortstopPot} small />
                                )}
                                {player.defenseRatings.thirdBase !== null && (
                                  <RatingBar label="3B" current={player.defenseRatings.thirdBase} potential={player.defenseRatings.thirdBasePot} small />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Outfield Defense */}
                      {(player.defenseRatings.outfieldRange !== null || 
                        player.defenseRatings.outfieldError !== null || 
                        player.defenseRatings.outfieldArm !== null) && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Outfield Defense</h4>
                          <div className="space-y-2">
                            {player.defenseRatings.outfieldRange !== null && (
                              <RatingBar label="Range" current={player.defenseRatings.outfieldRange} potential={null} />
                            )}
                            {player.defenseRatings.outfieldError !== null && (
                              <RatingBar label="Error" current={player.defenseRatings.outfieldError} potential={null} />
                            )}
                            {player.defenseRatings.outfieldArm !== null && (
                              <RatingBar label="Arm" current={player.defenseRatings.outfieldArm} potential={null} />
                            )}
                          </div>
                          
                          {/* Outfield Position Ratings */}
                          {(player.defenseRatings.leftField !== null ||
                            player.defenseRatings.centerField !== null ||
                            player.defenseRatings.rightField !== null) && (
                            <div className="mt-3 pt-3 border-t border-dugout-200 dark:border-dugout-700">
                              <h5 className="text-xs font-medium text-dugout-500 dark:text-dugout-400 mb-2">Position Ratings</h5>
                              <div className="grid grid-cols-3 gap-2">
                                {player.defenseRatings.leftField !== null && (
                                  <RatingBar label="LF" current={player.defenseRatings.leftField} potential={player.defenseRatings.leftFieldPot} small />
                                )}
                                {player.defenseRatings.centerField !== null && (
                                  <RatingBar label="CF" current={player.defenseRatings.centerField} potential={player.defenseRatings.centerFieldPot} small />
                                )}
                                {player.defenseRatings.rightField !== null && (
                                  <RatingBar label="RF" current={player.defenseRatings.rightField} potential={player.defenseRatings.rightFieldPot} small />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Bottom Section: Archetypes, Flags, Personality, Background, Physical */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-dugout-200 dark:border-dugout-700">
                {/* Archetypes & Flags */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Archetypes</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {player.archetypes.map(arch => (
                      <span key={arch} className="badge bg-diamond-100 dark:bg-diamond-900/30 text-diamond-700 dark:text-diamond-400">
                        {arch}
                      </span>
                    ))}
                    {player.archetypes.length === 0 && (
                      <span className="text-sm text-dugout-400">No archetypes</span>
                    )}
                  </div>
                  
                  {player.redFlags.length > 0 && (
                    <div className="mb-2">
                      <h5 className="text-xs font-medium text-redFlag mb-1">Red Flags</h5>
                      <div className="flex flex-wrap gap-1">
                        {player.redFlags.map(flag => (
                          <span key={flag} className="badge-redflag text-xs">{flag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {player.greenFlags.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-greenFlag mb-1">Green Flags</h5>
                      <div className="flex flex-wrap gap-1">
                        {player.greenFlags.map(flag => (
                          <span key={flag} className="badge-greenflag text-xs">{flag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Personality */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Personality</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Work Ethic</span>
                      <span className={cn("font-medium", getPersonalityColor('workEthic', player.workEthic))}>
                        {formatPersonalityValue(player.workEthic)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Intelligence</span>
                      <span className={cn("font-medium", getPersonalityColor('intelligence', player.intelligence))}>
                        {formatPersonalityValue(player.intelligence)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Leadership</span>
                      <span className={cn("font-medium", getPersonalityColor('leadership', player.leadership))}>
                        {formatPersonalityValue(player.leadership)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Adaptability</span>
                      <span className={cn("font-medium", getPersonalityColor('adaptability', player.adaptability))}>
                        {formatPersonalityValue(player.adaptability)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Loyalty</span>
                      <span className={cn("font-medium", getPersonalityColor('loyalty', player.loyalty))}>
                        {formatPersonalityValue(player.loyalty)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Greed</span>
                      <span className={cn("font-medium", getPersonalityColor('financialAmbition', player.financialAmbition))}>
                        {formatPersonalityValue(player.financialAmbition)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Background */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Background</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dugout-500">School</span>
                      <span className="text-dugout-900 dark:text-white">{player.school || 'N/A'}</span>
                    </div>
                    {player.committedSchool && (
                      <div className="flex justify-between">
                        <span className="text-dugout-500">Committed</span>
                        <span className="text-dugout-900 dark:text-white">{player.committedSchool}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Competition</span>
                      <span className="text-dugout-900 dark:text-white">{player.competitionLevel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Signability</span>
                      <span className="text-dugout-900 dark:text-white">{player.signability || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Scout Accuracy</span>
                      <span className="text-dugout-900 dark:text-white">{player.scoutAccuracy || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Risk</span>
                      <span className="text-dugout-900 dark:text-white">{player.risk || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Physical */}
                <div>
                  <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">Physical</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Height</span>
                      <span className="text-dugout-900 dark:text-white">{player.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Weight</span>
                      <span className="text-dugout-900 dark:text-white">{player.weight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-dugout-500">Durability</span>
                      <span className={cn("font-medium", getPersonalityColor('injuryProne', player.injuryProne))}>
                        {player.injuryProne || 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Score breakdown */}
          {player.scoreBreakdown && (
            <div className="mt-4 pt-4 border-t border-dugout-200 dark:border-dugout-700">
              <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">
                Why This Score?
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-dugout-100 dark:bg-dugout-800">
                  POT: +{player.scoreBreakdown.potentialContribution.toFixed(1)}
                </span>
                <span className="px-2 py-1 rounded bg-dugout-100 dark:bg-dugout-800">
                  OVR: +{player.scoreBreakdown.overallContribution.toFixed(1)}
                </span>
                {player.scoreBreakdown.riskPenalty !== 0 && (
                  <span className="px-2 py-1 rounded bg-redFlag/10 text-redFlag">
                    Risk: {player.scoreBreakdown.riskPenalty.toFixed(1)}
                  </span>
                )}
                {player.scoreBreakdown.positionBonus > 0 && (
                  <span className="px-2 py-1 rounded bg-greenFlag/10 text-greenFlag">
                    Position: +{player.scoreBreakdown.positionBonus.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
