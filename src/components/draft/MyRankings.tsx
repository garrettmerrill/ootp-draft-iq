'use client';

import { useState, useCallback } from 'react';
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
import { Download, Settings2, Loader2, Trash2 } from 'lucide-react';
import { TierSection } from './TierSection';
import { RenameTiersModal } from './RenameTiersModal';
import { Player, TierNames, DEFAULT_TIER_NAMES } from '@/types';

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
  onClearAll: () => Promise<void>;
  isLoading: boolean;
}

export function MyRankings({
  rankings,
  tierNames,
  onReorder,
  onRemove,
  onChangeTier,
  onUpdateTierNames,
  onClearAll,
  isLoading,
}: MyRankingsProps) {
  const [showRenameTiers, setShowRenameTiers] = useState(false);
  const [collapsedTiers, setCollapsedTiers] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<number | null>(null);
  const [overTier, setOverTier] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
  
  const draftedRankings: RankedPlayer[] = [];
  
  rankings.forEach(r => {
    if (r.player.isDrafted) {
      draftedRankings.push(r);
    } else {
      rankingsByTier[r.tier]?.push(r);
    }
  });

  Object.values(rankingsByTier).forEach(tierRankings => {
    tierRankings.sort((a, b) => a.rankInTier - b.rankInTier);
  });

  let overallRank = 1;
  const tierStartRanks: Record<number, number> = {};
  [1, 2, 3, 4, 5].forEach(tier => {
    tierStartRanks[tier] = overallRank;
    overallRank += rankingsByTier[tier].length;
  });

  const totalRanked = rankings.filter(r => !r.player.isDrafted).length;

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);
    const activeData = active.data.current;
    if (activeData?.tier) {
      setActiveTier(activeData.tier);
    }
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
    setActiveTier(null);
    setOverTier(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    const activeRanking = activeData.ranking as RankedPlayer;
    const sourceTier = activeData.tier as number;

    let targetTier: number;
    let targetRankInTier: number;

    if (overData?.type === 'tier') {
      targetTier = overData.tier;
      targetRankInTier = rankingsByTier[targetTier].length + 1;
    } else if (overData?.ranking) {
      const overRanking = overData.ranking as RankedPlayer;
      targetTier = overData.tier;
      
      if (sourceTier === targetTier) {
        targetRankInTier = overRanking.rankInTier;
      } else {
        targetRankInTier = overRanking.rankInTier;
      }
    } else {
      return;
    }

    if (sourceTier === targetTier && activeRanking.rankInTier === targetRankInTier) {
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

  async function handleClearAll() {
    setIsClearing(true);
    try {
      await onClearAll();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Clear all failed:', error);
      alert('Failed to clear rankings');
    } finally {
      setIsClearing(false);
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-dugout-500 dark:text-dugout-400">
          {totalRanked} {totalRanked === 1 ? 'player' : 'players'} ranked
          {draftedRankings.length > 0 && (
            <span className="text-dugout-400"> • {draftedRankings.length} drafted</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={totalRanked === 0}
            className="btn-ghost btn-sm text-redFlag hover:bg-redFlag/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
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
                activeTier={activeTier}
                expandedPlayerId={expandedPlayerId}
                onToggleExpand={setExpandedPlayerId}
              />
            ))}

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

          <DragOverlay dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeRanking ? (
              <div className="bg-white dark:bg-dugout-800 rounded-lg shadow-xl border-2 border-diamond-500 px-4 py-3 opacity-95">
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

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => !isClearing && setShowClearConfirm(false)}
          />
          <div className="relative bg-white dark:bg-dugout-900 rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-dugout-900 dark:text-white mb-2">
              Clear All Rankings?
            </h3>
            <p className="text-dugout-600 dark:text-dugout-400 mb-4">
              This will remove all {totalRanked} {totalRanked === 1 ? 'player' : 'players'} from your rankings. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearing}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="btn-sm bg-redFlag text-white hover:bg-redFlag/90 disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  'Clear All'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
