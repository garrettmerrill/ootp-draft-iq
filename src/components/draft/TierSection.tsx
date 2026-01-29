'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, X } from 'lucide-react';
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
}: TierSectionProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tier-${tier}`,
    data: { tier, type: 'tier' },
  });

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
        'rounded-lg border border-dugout-200 dark:border-dugout-700 overflow-hidden transition-all',
        'border-l-4',
        tierColors[tier],
        (isOver || isDragOver) && 'ring-2 ring-diamond-500 ring-offset-2 dark:ring-offset-dugout-900'
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

      {/* Drop zone indicator when dragging over */}
      {(isOver || isDragOver) && activeId && (
        <div className="px-4 py-2 bg-diamond-100 dark:bg-diamond-900/30 border-y border-diamond-200 dark:border-diamond-800">
          <p className="text-sm text-diamond-700 dark:text-diamond-400 text-center">
            Drop to move to {tierName}
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
                />
              ))
            )}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

interface SortableRankingCardProps {
  ranking: RankedPlayer;
  overallRank: number;
  onRemove: () => void;
  onChangeTier: (rankingId: string, newTier: number) => void;
  tierNames: TierNames;
  currentTier: number;
}

function SortableRankingCard({
  ranking,
  overallRank,
  onRemove,
  onChangeTier,
  tierNames,
  currentTier,
}: SortableRankingCardProps) {
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: ranking.id,
    data: { tier: currentTier, ranking },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const player = ranking.player;
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white dark:bg-dugout-900 transition-all',
        isDragging && 'opacity-50 shadow-lg z-50',
        player.isDrafted && 'opacity-50'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-dugout-100 dark:hover:bg-dugout-800 text-dugout-400"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Overall rank */}
      <div className="w-8 text-center">
        <span className={cn(
          'text-sm font-bold',
          player.isDrafted ? 'text-dugout-400 line-through' : 'text-dugout-500'
        )}>
          #{overallRank}
        </span>
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium',
            player.isDrafted 
              ? 'text-dugout-400 line-through' 
              : 'text-dugout-900 dark:text-white'
          )}>
            {player.name}
          </span>
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
        </div>
      </div>

      {/* Ratings */}
      <div className="flex items-center gap-4 text-sm">
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
      </div>

      {/* Tier dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowTierDropdown(!showTierDropdown)}
          className="px-2 py-1 text-xs rounded border border-dugout-200 dark:border-dugout-700 hover:bg-dugout-50 dark:hover:bg-dugout-800 text-dugout-600 dark:text-dugout-400"
        >
          Tier {currentTier}
        </button>
        {showTierDropdown && (
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
                  'w-full px-3 py-1.5 text-left text-sm',
                  t === currentTier 
                    ? 'bg-diamond-100 dark:bg-diamond-900/30 text-diamond-700 dark:text-diamond-400'
                    : 'hover:bg-dugout-100 dark:hover:bg-dugout-800 text-dugout-700 dark:text-dugout-300'
                )}
              >
                {t} - {tierNames[t as keyof TierNames] || DEFAULT_TIER_NAMES[t as keyof TierNames]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="p-1 rounded text-dugout-400 hover:text-redFlag hover:bg-redFlag/10 transition-colors"
        title="Remove from rankings"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
