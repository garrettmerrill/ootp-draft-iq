'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Download, Settings2, Loader2 } from 'lucide-react';
import { TierSection } from './TierSection';
import { RenameTiersModal } from './RenameTiersModal';
import { Player, TierNames, DEFAULT_TIER_NAMES } from '@/types';
import { cn } from '@/lib/utils';

interface RankedPlayer {
  id: string;
  odraftId: string;
  odPlayerId: string;
  tier: number;
  rankInTier: number;
  player: Player;
}

interface MyRankingsProps {
  rankings: RankedPlayer[];
  tierNames: TierNames;
  onReorder: (rankingId: string, newTier: number, newRankInTier: number) => Promise<void>;
  onRemove: (playerId: string) => Promise<void>;
  onChangeTier: (rankingId: string, newTier: number) => Promise<void>;
  onUpdateTierNames: (tierNames: TierNames) => Promise<void>;
  isLoading: boolean;
}

export function MyRankings({
  rankings,
  tierNames,
  onReorder,
  onRemove,
  onChangeTier,
  onUpdateTierNames,
  isLoading,
}: MyRankingsProps) {
  const [showRenameTiers, setShowRenameTiers] = useState(false);
  const [collapsedTiers, setCollapsedTiers] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overTier, setOverTier] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group rankings by tier
  const rankingsByTier: Record<number, RankedPlayer[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  
  // Also track drafted players separately
  const draftedRankings: RankedPlayer[] = [];
  
  rankings.forEach(r => {
    if (r.player.isDrafted) {
      draftedRankings.push(r);
    } else {
      rankingsByTier[r.tier]?.push(r);
    }
  });

  // Sort each tier by rankInTier
  Object.values(rankingsByTier).forEach(tierRankings => {
    tierRankings.sort((a, b) => a.rankInTier - b.rankInTier);
  });

  // Calculate overall ranks (excluding drafted)
  let overallRank = 1;
  const tierStartRanks: Record<number, number> = {};
  [1, 2, 3, 4, 5].forEach(tier => {
    tierStartRanks[tier] = overallRank;
    overallRank += rankingsByTier[tier].length;
  });

  // Count non-drafted players
  const totalRanked = rankings.filter(r => !r.player.isDrafted).length;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (over) {
      const overData = over.data.current;
      if (overData?.type === 'tier') {
        setOverTier(overData.tier);
      } else if (overData?.tier) {
        setOverTier(overData.tier);
      } else {
        setOverTier(null);
      }
    } else {
      setOverTier(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverTier(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    const activeRanking = activeData.ranking as RankedPlayer;
    const activeTier = activeData.tier as number;

    let targetTier: number;
    let targetRankInTier: number;

    if (overData?.type === 'tier') {
      // Dropped on tier header - add to end of tier
      targetTier = overData.tier;
      targetRankInTier = rankingsByTier[targetTier].length + 1;
    } else if (overData?.ranking) {
      // Dropped on another ranking
      const overRanking = overData.ranking as RankedPlayer;
      targetTier = overData.tier;
      
      if (activeTier === targetTier) {
        // Same tier - just reorder
        targetRankInTier = overRanking.rankInTier;
      } else {
        // Different tier - insert at that position
        targetRankInTier = overRanking.rankInTier;
      }
    } else {
      return;
    }

    // Don't do anything if nothing changed
    if (activeTier === targetTier && activeRanking.rankInTier === targetRankInTier) {
      return;
    }

    await onReorder(activeRanking.id, targetTier, targetRankInTier);
  }

  function toggleCollapse(tier: number) {
    setCollapsedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) {
        next.delete(tier);
      } else {
        next.add(tier);
      }
      return next;
    });
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await fetch('/api/rankings/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'statsplus-rankings.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export rankings');
    } finally {
      setIsExporting(false);
    }
  }

  const activeRanking = activeId 
    ? rankings.find(r => r.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-dugout-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-dugout-500 dark:text-dugout-400">
          {totalRanked} {totalRanked === 1 ? 'player' : 'players'} ranked
          {draftedRankings.length > 0 && (
            <span className="text-dugout-400"> • {draftedRankings.length} drafted</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRenameTiers(true)}
            className="btn-secondary btn-sm"
          >
            <Settings2 className="w-4 h-4" />
            Rename Tiers
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || totalRanked === 0}
            className="btn-primary btn-sm"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {totalRanked === 0 && draftedRankings.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-dugout-500 dark:text-dugout-400 mb-2">
            No players in your rankings yet
          </p>
          <p className="text-sm text-dugout-400">
            Switch to &quot;All Players&quot; and click the + button to add players
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(tier => (
              <TierSection
                key={tier}
                tier={tier}
                tierName={tierNames[tier as keyof TierNames] || DEFAULT_TIER_NAMES[tier as keyof TierNames]}
                players={rankingsByTier[tier]}
                overallStartRank={tierStartRanks[tier]}
                isCollapsed={collapsedTiers.has(tier)}
                onToggleCollapse={() => toggleCollapse(tier)}
                onRemovePlayer={onRemove}
                onChangeTier={onChangeTier}
                tierNames={tierNames}
                isDragOver={overTier === tier}
                activeId={activeId}
              />
            ))}

            {/* Drafted section */}
            {draftedRankings.length > 0 && (
              <div className="rounded-lg border border-dugout-200 dark:border-dugout-700 overflow-hidden opacity-60">
                <div className="px-4 py-3 bg-dugout-100 dark:bg-dugout-800">
                  <span className="font-medium text-dugout-600 dark:text-dugout-400">
                    Drafted ({draftedRankings.length}) - Not exported
                  </span>
                </div>
                <div className="divide-y divide-dugout-100 dark:divide-dugout-800">
                  {draftedRankings.map(ranking => (
                    <div
                      key={ranking.id}
                      className="flex items-center justify-between px-4 py-2 bg-white dark:bg-dugout-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-dugout-400 line-through">
                          {ranking.player.name}
                        </span>
                        <span className="text-xs text-dugout-500">
                          {ranking.player.position} • R{ranking.player.draftRound} P{ranking.player.draftPick}
                          {ranking.player.draftTeam && ` by ${ranking.player.draftTeam}`}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemove(ranking.player.id)}
                        className="text-xs text-dugout-400 hover:text-redFlag"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeRanking ? (
              <div className="bg-white dark:bg-dugout-800 rounded-lg shadow-xl border border-dugout-200 dark:border-dugout-700 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-dugout-900 dark:text-white">
                    {activeRanking.player.name}
                  </span>
                  <span className="text-sm text-dugout-500">
                    {activeRanking.player.position} • {activeRanking.player.overall}/{activeRanking.player.potential}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <RenameTiersModal
        isOpen={showRenameTiers}
        onClose={() => setShowRenameTiers(false)}
        tierNames={tierNames}
        onSave={onUpdateTierNames}
      />
    </div>
  );
}
