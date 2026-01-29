'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, ChevronDown, ChevronUp, RefreshCw,
  Target, Sparkles, AlertTriangle, CheckCircle,
  SlidersHorizontal, X, Plus, Ban
} from 'lucide-react';
import { cn, parseNaturalLanguageQuery, getTierColor } from '@/lib/utils';
import { Player, PlayerFilters, DEFAULT_FILTERS, POSITIONS, Tier, TierNames, DEFAULT_TIER_NAMES } from '@/types';
import { MyRankings } from '@/components/draft';

interface RankedPlayer {
  id: string;
  odraftId: string;
  odPlayerId: string;
  tier: number;
  rankInTier: number;
  player: Player;
}

type TabType = 'all' | 'rankings';

export default function DraftBoardPage() {
  useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [tierNames, setTierNames] = useState<TierNames>(DEFAULT_TIER_NAMES);
  const [loading, setLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy] = useState<'rank' | 'name' | 'potential' | 'overall'>('rank');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const COOLDOWN_MS = 5 * 60 * 1000;

  useEffect(() => {
    if (lastSyncTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - lastSyncTime;
        const remaining = Math.max(0, COOLDOWN_MS - elapsed);
        setCooldownRemaining(remaining);
        if (remaining === 0) clearInterval(interval);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lastSyncTime]);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch('/api/players');
        const data = await res.json();
        if (data.players) setPlayers(data.players);
      } catch (error) {
        console.error('Failed to fetch players:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  useEffect(() => {
    async function fetchRankingsAndSettings() {
      try {
        const [rankingsRes, tiersRes] = await Promise.all([
          fetch('/api/rankings'),
          fetch('/api/settings/tiers'),
        ]);
        const rankingsData = await rankingsRes.json();
        const tiersData = await tiersRes.json();
        if (rankingsData.rankings) setRankings(rankingsData.rankings);
        if (tiersData.tiers) setTierNames(tiersData.tiers);
      } catch (error) {
        console.error('Failed to fetch rankings:', error);
      } finally {
        setRankingsLoading(false);
      }
    }
    fetchRankingsAndSettings();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 3) {
      const parsed = parseNaturalLanguageQuery(searchQuery);
      setFilters(prev => ({
        ...prev,
        positions: parsed.positions,
        minPotential: parsed.minPotential,
        maxPotential: parsed.maxPotential,
        minOverall: parsed.minOverall,
        maxOverall: parsed.maxOverall,
        tiers: parsed.tiers as Tier[],
        archetypes: parsed.archetypes,
        showDrafted: parsed.showDrafted,
        showSleepersOnly: parsed.showSleepersOnly,
        showTwoWayOnly: parsed.showTwoWayOnly,
        collegeOnly: parsed.collegeOnly,
        hsOnly: parsed.hsOnly,
        maxDemand: parsed.maxDemand,
        searchQuery,
      }));
    } else if (searchQuery.length === 0) {
      setFilters(prev => ({ ...prev, searchQuery: '' }));
    }
  }, [searchQuery]);

  async function syncDraft() {
    if (cooldownRemaining > 0) {
      alert(`⏱️ Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before syncing again.`);
      return;
    }
    setSyncing(true);
    setLastSyncTime(Date.now());
    try {
      const res = await fetch('/api/players/sync-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statsPlusUrl: 'https://statsplus.net/ooobl/api/draftv2/' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync');
      
      const [playersRes, rankingsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/rankings'),
      ]);
      const playersData = await playersRes.json();
      const rankingsData = await rankingsRes.json();
      if (playersData.players) setPlayers(playersData.players);
      if (rankingsData.rankings) setRankings(rankingsData.rankings);
      alert(`✅ ${data.message}`);
    } catch (error) {
      console.error('Sync error:', error);
      alert('❌ Failed to sync draft results.');
    } finally {
      setSyncing(false);
    }
  }

  const filteredPlayers = useMemo(() => {
    let result = [...players];
    if (filters.positions.length > 0) result = result.filter(p => filters.positions.includes(p.position));
    if (filters.minPotential) result = result.filter(p => p.potential >= filters.minPotential!);
    if (filters.maxPotential) result = result.filter(p => p.potential <= filters.maxPotential!);
    if (filters.tiers.length > 0) result = result.filter(p => p.tier && filters.tiers.includes(p.tier));
    if (!filters.showDrafted) result = result.filter(p => !p.isDrafted);
    if (!filters.showNotInterested) result = result.filter(p => !p.isNotInterested);
    if (filters.showSleepersOnly) result = result.filter(p => p.isSleeper);
    if (filters.collegeOnly) result = result.filter(p => p.highSchoolClass?.includes('CO'));
    if (filters.hsOnly) result = result.filter(p => p.highSchoolClass?.includes('HS'));
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.nickname?.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        p.archetypes.some(a => a.toLowerCase().includes(query))
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'rank': cmp = (b.compositeScore || 0) - (a.compositeScore || 0); break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'potential': cmp = b.potential - a.potential; break;
        case 'overall': cmp = b.overall - a.overall; break;
      }
      return sortOrder === 'asc' ? -cmp : cmp;
    });
    return result;
  }, [players, filters, sortBy, sortOrder]);

  const handleAddToRankings = useCallback(async (playerId: string, tier: number) => {
    const res = await fetch('/api/rankings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, tier }),
    });
    if (!res.ok) throw new Error('Failed to add');
    const rankingsRes = await fetch('/api/rankings');
    const data = await rankingsRes.json();
    if (data.rankings) setRankings(data.rankings);
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ranking: { id: '', odraftId: '', odPlayerId: '', tier, rankInTier: 0 } } : p));
  }, []);

  const handleRemoveFromRankings = useCallback(async (playerId: string) => {
    await fetch(`/api/rankings/${playerId}`, { method: 'DELETE' });
    setRankings(prev => prev.filter(r => r.player.id !== playerId));
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ranking: null } : p));
  }, []);

  const handleReorder = useCallback(async (rankingId: string, newTier: number, newRankInTier: number) => {
    await fetch('/api/rankings/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rankingId, newTier, newRankInTier }),
    });
    const res = await fetch('/api/rankings');
    const data = await res.json();
    if (data.rankings) setRankings(data.rankings);
  }, []);

  const handleChangeTier = useCallback(async (rankingId: string, newTier: number) => {
    const ranking = rankings.find(r => r.id === rankingId);
    if (!ranking) return;
    const targetTierRankings = rankings.filter(r => r.tier === newTier && !r.player.isDrafted);
    const newRankInTier = targetTierRankings.length + 1;
    await handleReorder(rankingId, newTier, newRankInTier);
  }, [rankings, handleReorder]);

  const handleToggleNotInterested = useCallback(async (playerId: string, isNotInterested: boolean) => {
    await fetch(`/api/players/${playerId}/not-interested`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isNotInterested }),
    });
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isNotInterested, ranking: isNotInterested ? null : p.ranking } : p));
    if (isNotInterested) setRankings(prev => prev.filter(r => r.player.id !== playerId));
  }, []);

  const handleUpdateTierNames = useCallback(async (newTierNames: TierNames) => {
    await fetch('/api/settings/tiers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiers: newTierNames }),
    });
    setTierNames(newTierNames);
  }, []);

  const rankingsCount = rankings.filter(r => !r.player.isDrafted).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 mx-auto text-dugout-400 mb-4" />
        <h2 className="text-xl font-semibold text-dugout-900 dark:text-white">No Players Yet</h2>
        <p className="text-dugout-500 dark:text-dugout-400 mt-2">Upload your CSV data to see your draft board</p>
        <a href="/dashboard/upload" className="btn-primary btn-md mt-4 inline-flex">Upload CSV</a>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-dugout-50 dark:bg-dugout-950 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4 pt-2 border-b border-dugout-200 dark:border-dugout-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-dugout-900 dark:text-white">Draft Board</h1>
            <p className="text-dugout-500 dark:text-dugout-400 mt-1">
              {activeTab === 'all' ? `${filteredPlayers.length} of ${players.length} players` : `${rankingsCount} players ranked`}
            </p>
          </div>
          <button 
            onClick={syncDraft}
            disabled={syncing || cooldownRemaining > 0}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            {syncing ? 'Syncing...' : cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : 'Sync Draft'}
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeTab === 'all'
                ? 'bg-diamond-600 text-white'
                : 'bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400 hover:bg-dugout-200 dark:hover:bg-dugout-700'
            )}
          >
            All Players
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              activeTab === 'rankings'
                ? 'bg-diamond-600 text-white'
                : 'bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400 hover:bg-dugout-200 dark:hover:bg-dugout-700'
            )}
          >
            My Rankings
            {rankingsCount > 0 && (
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                activeTab === 'rankings' ? 'bg-white/20' : 'bg-diamond-100 dark:bg-diamond-900 text-diamond-700 dark:text-diamond-400'
              )}>
                {rankingsCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dugout-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search or try "available SP with 65+ pot"'
                  className="input pl-10"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn('btn-secondary btn-md', showFilters && 'bg-diamond-100 dark:bg-diamond-900')}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="pt-4 border-t border-dugout-200 dark:border-dugout-700 space-y-4">
                <div>
                  <label className="label">Positions</label>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.map(pos => (
                      <button
                        key={pos}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          positions: prev.positions.includes(pos) ? prev.positions.filter(p => p !== pos) : [...prev.positions, pos],
                        }))}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                          filters.positions.includes(pos)
                            ? 'bg-diamond-600 text-white'
                            : 'bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400 hover:bg-dugout-200'
                        )}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Tiers</label>
                  <div className="flex flex-wrap gap-2">
                    {(['Elite', 'Very Good', 'Good', 'Average', 'Filler'] as Tier[]).map(tier => (
                      <button
                        key={tier}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          tiers: prev.tiers.includes(tier) ? prev.tiers.filter(t => t !== tier) : [...prev.tiers, tier],
                        }))}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium transition-colors border',
                          filters.tiers.includes(tier) ? getTierColor(tier) : 'bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400 border-transparent'
                        )}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={filters.showSleepersOnly} onChange={(e) => setFilters(prev => ({ ...prev, showSleepersOnly: e.target.checked }))} className="rounded border-dugout-300" />
                    <span className="text-sm text-dugout-700 dark:text-dugout-300">Sleepers only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={filters.showDrafted} onChange={(e) => setFilters(prev => ({ ...prev, showDrafted: e.target.checked }))} className="rounded border-dugout-300" />
                    <span className="text-sm text-dugout-700 dark:text-dugout-300">Show drafted</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={filters.showNotInterested} onChange={(e) => setFilters(prev => ({ ...prev, showNotInterested: e.target.checked }))} className="rounded border-dugout-300" />
                    <span className="text-sm text-dugout-700 dark:text-dugout-300">Show not interested</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={filters.collegeOnly} onChange={(e) => setFilters(prev => ({ ...prev, collegeOnly: e.target.checked, hsOnly: false }))} className="rounded border-dugout-300" />
                    <span className="text-sm text-dugout-700 dark:text-dugout-300">College only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={filters.hsOnly} onChange={(e) => setFilters(prev => ({ ...prev, hsOnly: e.target.checked, collegeOnly: false }))} className="rounded border-dugout-300" />
                    <span className="text-sm text-dugout-700 dark:text-dugout-300">HS only</span>
                  </label>
                </div>
                <button onClick={() => { setFilters(DEFAULT_FILTERS); setSearchQuery(''); }} className="text-sm text-diamond-600 hover:text-diamond-700">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-6">
        {activeTab === 'all' ? (
          <div className="space-y-4">
            {filteredPlayers.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={player}
                rank={index + 1}
                isExpanded={expandedPlayer === player.id}
                onToggle={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                tierNames={tierNames}
                onAddToRankings={handleAddToRankings}
                onRemoveFromRankings={handleRemoveFromRankings}
                onToggleNotInterested={handleToggleNotInterested}
              />
            ))}
            {filteredPlayers.length === 0 && (
              <div className="text-center py-12 text-dugout-500 dark:text-dugout-400">
                No players match your filters
              </div>
            )}
          </div>
        ) : (
          <MyRankings
            rankings={rankings}
            tierNames={tierNames}
            onReorder={handleReorder}
            onRemove={handleRemoveFromRankings}
            onChangeTier={handleChangeTier}
            onUpdateTierNames={handleUpdateTierNames}
            isLoading={rankingsLoading}
          />
        )}
      </div>
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

function PlayerCard({ 
  player, 
  rank, 
  isExpanded, 
  onToggle,
  tierNames,
  onAddToRankings,
  onRemoveFromRankings,
  onToggleNotInterested,
}: { 
  player: Player; 
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  tierNames: TierNames;
  onAddToRankings: (playerId: string, tier: number) => Promise<void>;
  onRemoveFromRankings: (playerId: string) => Promise<void>;
  onToggleNotInterested: (playerId: string, isNotInterested: boolean) => Promise<void>;
}) {
  const [showTierMenu, setShowTierMenu] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);
  
  const getTierIndicatorClass = (tier: Tier | null) => {
    switch (tier) {
      case 'Elite': return 'tier-indicator-elite';
      case 'Very Good': return 'tier-indicator-verygood';
      case 'Good': return 'tier-indicator-good';
      case 'Average': return 'tier-indicator-average';
      default: return 'tier-indicator-filler';
    }
  };

  async function handleAddToTier(tier: number) {
    setIsAdding(true);
    try {
      await onAddToRankings(player.id, tier);
    } finally {
      setIsAdding(false);
      setShowTierMenu(false);
    }
  }

  return (
    <div className={cn('card overflow-hidden transition-all relative', player.isDrafted && 'opacity-50', player.isNotInterested && 'opacity-40')}>
      {/* Collapsed view */}
      <div
        onClick={onToggle}
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-dugout-50 dark:hover:bg-dugout-800/50"
      >
        <div className={cn('h-12 w-1 rounded-full', getTierIndicatorClass(player.tier))} />
        
        <div className="w-8 text-center">
          <span className="text-lg font-bold text-dugout-400">#{rank}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-semibold", player.isNotInterested ? "text-dugout-500 line-through" : "text-dugout-900 dark:text-white")}>
              {player.name}
            </span>
            {player.nickname && (
              <span className="text-sm text-dugout-500">&quot;{player.nickname}&quot;</span>
            )}
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
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-dugout-500 dark:text-dugout-400">
            <span className="font-medium">
              {isPitcher 
                ? `${player.throws === 'L' ? 'LHP' : 'RHP'} (${player.position})`
                : `${player.position}`
              }
            </span>
            <span>•</span>
            <span>Age {player.age}</span>
            <span>•</span>
            <span>{player.highSchoolClass}</span>
            {!isPitcher && (
              <>
                <span>•</span>
                <span>Bats: {player.bats}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-dugout-400 text-xs">OVR/POT</div>
            <div className="font-bold text-dugout-900 dark:text-white">
              {player.overall}/{player.potential}
            </div>
          </div>
          <div className="text-center">
            <div className="text-dugout-400 text-xs">Score</div>
            <div className="font-bold text-dugout-900 dark:text-white">
              {player.compositeScore?.toFixed(1)}
            </div>
          </div>
          <div className="text-center min-w-[80px]">
            <div className="text-dugout-400 text-xs">Demand</div>
            <div className="font-medium text-dugout-700 dark:text-dugout-300">
              {player.demandAmount || 'N/A'}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-[200px]">
          {player.archetypes.slice(0, 2).map(arch => (
            <span key={arch} className="badge bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400 text-xs">
              {arch}
            </span>
          ))}
          {player.archetypes.length > 2 && (
            <span className="text-xs text-dugout-400">+{player.archetypes.length - 2}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
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

        {player.isDrafted && (
          <div className="text-sm text-dugout-500">
            Drafted: R{player.draftRound}, P{player.draftPick}
          </div>
        )}

        <div className="text-dugout-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Action buttons - positioned absolutely in top right */}
      <div className="absolute top-3 right-14 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {!player.isDrafted && !player.isNotInterested && (
          player.ranking ? (
            <button
              onClick={() => onRemoveFromRankings(player.id)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-greenFlag/10 text-greenFlag hover:bg-redFlag/10 hover:text-redFlag transition-colors"
              title="Remove from rankings"
            >
              <CheckCircle className="w-3 h-3" />
              <span className="hidden sm:inline">Ranked</span>
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowTierMenu(!showTierMenu)}
                disabled={isAdding}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-diamond-100 dark:bg-diamond-900/30 text-diamond-700 dark:text-diamond-400 hover:bg-diamond-200 dark:hover:bg-diamond-900/50 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Add</span>
              </button>
              {showTierMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={() => setShowTierMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-[101] w-40 rounded-lg shadow-lg border border-dugout-200 dark:border-dugout-700 bg-white dark:bg-dugout-900 py-1">
                    <div className="px-2 py-1 text-xs text-dugout-500 dark:text-dugout-400 font-medium">Add to tier:</div>
                    {[1, 2, 3, 4, 5].map((tier) => (
                      <button
                        key={tier}
                        onClick={() => handleAddToTier(tier)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-dugout-100 dark:hover:bg-dugout-800 text-dugout-700 dark:text-dugout-300"
                      >
                        {tier} - {tierNames[tier as keyof TierNames] || DEFAULT_TIER_NAMES[tier as keyof TierNames]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        )}
        <button
          onClick={() => onToggleNotInterested(player.id, !player.isNotInterested)}
          className={cn(
            "p-1 rounded transition-colors",
            player.isNotInterested 
              ? "bg-redFlag/10 text-redFlag hover:bg-dugout-100 dark:hover:bg-dugout-800 hover:text-dugout-500" 
              : "text-dugout-400 hover:bg-redFlag/10 hover:text-redFlag"
          )}
          title={player.isNotInterested ? "Remove from Not Interested" : "Mark as Not Interested"}
        >
          <Ban className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-dugout-200 dark:border-dugout-700 p-4 bg-dugout-50 dark:bg-dugout-800/30">
          {/* Player Ratings Section */}
          <div className="mb-6 pb-6 border-b border-dugout-200 dark:border-dugout-700">
            <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-3">
              {isPitcher ? 'Pitching Ratings' : 'Batting Ratings'}
            </h4>
            
            {isPitcher ? (
              // Pitcher ratings
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {player.pitchingRatings?.stuff !== null && player.pitchingRatings && (
                    <RatingBar 
                      label="Stuff" 
                      current={player.pitchingRatings.stuff!} 
                      potential={player.pitchingRatings.stuffPot} 
                    />
                  )}
                  
                  {player.pitchingRatings?.movement !== null && player.pitchingRatings && (
                    <div className="space-y-2">
                      <RatingBar 
                        label="Movement" 
                        current={player.pitchingRatings.movement!} 
                        potential={player.pitchingRatings.movementPot} 
                      />
                      <div className="ml-4 space-y-1">
                        {player.pitchingRatings.pBabip !== null && (
                          <RatingBar 
                            label="PBABIP" 
                            current={player.pitchingRatings.pBabip!} 
                            potential={player.pitchingRatings.pBabipPot} 
                            small
                          />
                        )}
                        {player.pitchingRatings.hrRate !== null && (
                          <RatingBar 
                            label="HR Rate" 
                            current={player.pitchingRatings.hrRate!} 
                            potential={player.pitchingRatings.hrRatePot} 
                            small
                          />
                        )}
                      </div>
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
                </div>
                
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
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mt-4">
                      <h5 className="text-xs font-semibold text-dugout-700 dark:text-dugout-300 mb-3">
                        Pitch Arsenal ({pitches.length} {pitches.length === 1 ? 'Pitch' : 'Pitches'})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pitches.map(pitch => (
                          <RatingBar 
                            key={pitch.name}
                            label={pitch.name} 
                            current={pitch.current!} 
                            potential={pitch.potential} 
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Batter ratings
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column: Contact with sub-ratings */}
                  <div className="space-y-4">
                    {player.battingRatings?.contact !== null && player.battingRatings && (
                      <div className="space-y-2">
                        <RatingBar 
                          label="Contact" 
                          current={player.battingRatings.contact!} 
                          potential={player.battingRatings.contactPot} 
                        />
                        <div className="ml-4 space-y-1">
                          {player.battingRatings.babip !== null && (
                            <RatingBar 
                              label="BABIP" 
                              current={player.battingRatings.babip!} 
                              potential={player.battingRatings.babipPot} 
                              small
                            />
                          )}
                          {player.battingRatings.avoidK !== null && (
                            <RatingBar 
                              label="Avoid K's" 
                              current={player.battingRatings.avoidK!} 
                              potential={player.battingRatings.avoidKPot} 
                              small
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right column: Gap, Power, Eye */}
                  <div className="space-y-4">
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
                
                {/* Speed with all sub-ratings stacked */}
                {player.speedRatings?.speed !== null && player.speedRatings && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="text-xs font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Speed</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <RatingBar 
                        label="Speed" 
                        current={player.speedRatings.speed!} 
                        potential={null} 
                      />
                      {player.speedRatings.stealingAggression !== null && (
                        <RatingBar 
                          label="Stealing Aggression" 
                          current={player.speedRatings.stealingAggression!} 
                          potential={null} 
                        />
                      )}
                      {player.speedRatings.stealingAbility !== null && (
                        <RatingBar 
                          label="Stealing Ability" 
                          current={player.speedRatings.stealingAbility!} 
                          potential={null} 
                        />
                      )}
                      {player.speedRatings.baserunning !== null && (
                        <RatingBar 
                          label="Baserunning" 
                          current={player.speedRatings.baserunning!} 
                          potential={null} 
                        />
                      )}
                    </div>
                  </div>
                )}
                
                {/* Defense sections */}
                {player.defenseRatings && (
                  <div className="space-y-4">
                    {/* Catcher Defense - only show if player is a catcher */}
                    {player.position === 'C' && (player.defenseRatings.catcherAbility !== null || 
                      player.defenseRatings.catcherFraming !== null || 
                      player.defenseRatings.catcherArm !== null || 
                      player.defenseRatings.catcher !== null) && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <h5 className="text-xs font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Catcher Defense</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {player.defenseRatings.catcherAbility !== null && (
                            <RatingBar label="Blocking" current={player.defenseRatings.catcherAbility} potential={null} />
                          )}
                          {player.defenseRatings.catcherFraming !== null && (
                            <RatingBar label="Framing" current={player.defenseRatings.catcherFraming} potential={null} />
                          )}
                          {player.defenseRatings.catcherArm !== null && (
                            <RatingBar label="C Arm" current={player.defenseRatings.catcherArm} potential={null} />
                          )}
                          {player.defenseRatings.catcher !== null && (
                            <RatingBar 
                              label="C Position Rating" 
                              current={player.defenseRatings.catcher} 
                              potential={player.defenseRatings.catcherPot} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Infield Defense */}
                    {(player.defenseRatings.infieldRange !== null || 
                      player.defenseRatings.infieldError !== null || 
                      player.defenseRatings.infieldArm !== null || 
                      player.defenseRatings.turnDoublePlay !== null ||
                      player.defenseRatings.firstBase !== null ||
                      player.defenseRatings.secondBase !== null ||
                      player.defenseRatings.thirdBase !== null ||
                      player.defenseRatings.shortstop !== null) && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <h5 className="text-xs font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Infield Defense</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {player.defenseRatings.infieldRange !== null && (
                            <RatingBar label="IF Range" current={player.defenseRatings.infieldRange} potential={null} />
                          )}
                          {player.defenseRatings.infieldError !== null && (
                            <RatingBar label="IF Error" current={player.defenseRatings.infieldError} potential={null} />
                          )}
                          {player.defenseRatings.infieldArm !== null && (
                            <RatingBar label="IF Arm" current={player.defenseRatings.infieldArm} potential={null} />
                          )}
                          {player.defenseRatings.turnDoublePlay !== null && (
                            <RatingBar label="Turn DP" current={player.defenseRatings.turnDoublePlay} potential={null} />
                          )}
                          {player.defenseRatings.firstBase !== null && (
                            <RatingBar 
                              label="1B Position Rating" 
                              current={player.defenseRatings.firstBase} 
                              potential={player.defenseRatings.firstBasePot} 
                            />
                          )}
                          {player.defenseRatings.secondBase !== null && (
                            <RatingBar 
                              label="2B Position Rating" 
                              current={player.defenseRatings.secondBase} 
                              potential={player.defenseRatings.secondBasePot} 
                            />
                          )}
                          {player.defenseRatings.thirdBase !== null && (
                            <RatingBar 
                              label="3B Position Rating" 
                              current={player.defenseRatings.thirdBase} 
                              potential={player.defenseRatings.thirdBasePot} 
                            />
                          )}
                          {player.defenseRatings.shortstop !== null && (
                            <RatingBar 
                              label="SS Position Rating" 
                              current={player.defenseRatings.shortstop} 
                              potential={player.defenseRatings.shortstopPot} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Outfield Defense */}
                    {(player.defenseRatings.outfieldRange !== null || 
                      player.defenseRatings.outfieldError !== null || 
                      player.defenseRatings.outfieldArm !== null ||
                      player.defenseRatings.leftField !== null ||
                      player.defenseRatings.centerField !== null ||
                      player.defenseRatings.rightField !== null) && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <h5 className="text-xs font-semibold text-dugout-700 dark:text-dugout-300 mb-3">Outfield Defense</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {player.defenseRatings.outfieldRange !== null && (
                            <RatingBar label="OF Range" current={player.defenseRatings.outfieldRange} potential={null} />
                          )}
                          {player.defenseRatings.outfieldError !== null && (
                            <RatingBar label="OF Error" current={player.defenseRatings.outfieldError} potential={null} />
                          )}
                          {player.defenseRatings.outfieldArm !== null && (
                            <RatingBar label="OF Arm" current={player.defenseRatings.outfieldArm} potential={null} />
                          )}
                          {player.defenseRatings.leftField !== null && (
                            <RatingBar 
                              label="LF Position Rating" 
                              current={player.defenseRatings.leftField} 
                              potential={player.defenseRatings.leftFieldPot} 
                            />
                          )}
                          {player.defenseRatings.centerField !== null && (
                            <RatingBar 
                              label="CF Position Rating" 
                              current={player.defenseRatings.centerField} 
                              potential={player.defenseRatings.centerFieldPot} 
                            />
                          )}
                          {player.defenseRatings.rightField !== null && (
                            <RatingBar 
                              label="RF Position Rating" 
                              current={player.defenseRatings.rightField} 
                              potential={player.defenseRatings.rightFieldPot} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Archetypes & Flags */}
            <div>
              <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">
                Archetypes
              </h4>
              <div className="flex flex-wrap gap-1">
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
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-redFlag mb-1">Red Flags</h4>
                  <div className="flex flex-wrap gap-1">
                    {player.redFlags.map(flag => (
                      <span key={flag} className="badge-redflag">{flag}</span>
                    ))}
                  </div>
                </div>
              )}

              {player.greenFlags.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-greenFlag mb-1">Green Flags</h4>
                  <div className="flex flex-wrap gap-1">
                    {player.greenFlags.map(flag => (
                      <span key={flag} className="badge-greenflag">{flag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Background */}
            <div>
              <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">
                Background
              </h4>
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

            {/* Physical & Injury */}
            <div>
              <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">
                Physical
              </h4>
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
                  <span className="text-dugout-500">Injury Prone</span>
                  <span className="text-dugout-900 dark:text-white">{player.injuryProne || 'Normal'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          {player.scoreBreakdown && (
            <div className="mt-4 pt-4 border-t border-dugout-200 dark:border-dugout-700">
              <h4 className="text-sm font-medium text-dugout-700 dark:text-dugout-300 mb-2">
                Why This Rank?
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
