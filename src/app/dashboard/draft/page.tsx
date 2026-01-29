'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, ChevronDown, ChevronUp, RefreshCw,
  Target, Sparkles, AlertTriangle, CheckCircle,
  SlidersHorizontal
} from 'lucide-react';
import { cn, parseNaturalLanguageQuery, getTierColor } from '@/lib/utils';
import { Player, PlayerFilters, DEFAULT_FILTERS, POSITIONS, Tier, TierNames, DEFAULT_TIER_NAMES } from '@/types';
import { AddToRankingsButton, NotInterestedButton, MyRankings } from '@/components/draft';

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

  // Cooldown timer
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

  // Fetch players
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

  // Fetch rankings and tier names
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

  // Natural language search
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

  // Sync draft
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

  // Filter players
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

  // Handlers
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
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ranking: { id: '', tier, rankInTier: 0 } } : p));
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

  // Count rankings for tab badge
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
        {/* Title row */}
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

        {/* Tabs */}
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

        {/* Search and Filters - Only show on All Players tab */}
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

      {/* Content area with padding for sticky header */}
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

// PlayerCard component (simplified for space - keeping core functionality)
function PlayerCard({ 
  player, 
  rank, 
  isExpanded, 
  onToggle,
  tierNames,
  onAddToRankings,
  onToggleNotInterested,
}: { 
  player: Player; 
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  tierNames: TierNames;
  onAddToRankings: (playerId: string, tier: number) => Promise<void>;
  onToggleNotInterested: (playerId: string, isNotInterested: boolean) => Promise<void>;
}) {
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

  return (
    <div className={cn('card overflow-hidden transition-all', player.isDrafted && 'opacity-50', player.isNotInterested && 'opacity-40')}>
      <div onClick={onToggle} className="flex items-center gap-4 p-4 cursor-pointer hover:bg-dugout-50 dark:hover:bg-dugout-800/50">
        <div className={cn('h-12 w-1 rounded-full', getTierIndicatorClass(player.tier))} />
        <div className="w-8 text-center">
          <span className="text-lg font-bold text-dugout-400">#{rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-semibold", player.isNotInterested ? "text-dugout-500 line-through" : "text-dugout-900 dark:text-white")}>
              {player.name}
            </span>
            {player.nickname && <span className="text-sm text-dugout-500">&quot;{player.nickname}&quot;</span>}
            {player.isSleeper && <span className="badge-sleeper"><Sparkles className="w-3 h-3 mr-1" />Sleeper</span>}
            {player.isTwoWay && <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Two-Way</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-dugout-500 dark:text-dugout-400">
            <span className="font-medium">{isPitcher ? `${player.throws === 'L' ? 'LHP' : 'RHP'} (${player.position})` : player.position}</span>
            <span>•</span><span>Age {player.age}</span>
            <span>•</span><span>{player.highSchoolClass}</span>
            {!isPitcher && <><span>•</span><span>Bats: {player.bats}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-dugout-400 text-xs">OVR/POT</div>
            <div className="font-bold text-dugout-900 dark:text-white">{player.overall}/{player.potential}</div>
          </div>
          <div className="text-center">
            <div className="text-dugout-400 text-xs">Score</div>
            <div className="font-bold text-dugout-900 dark:text-white">{player.compositeScore?.toFixed(1)}</div>
          </div>
          <div className="text-center min-w-[80px]">
            <div className="text-dugout-400 text-xs">Demand</div>
            <div className="font-medium text-dugout-700 dark:text-dugout-300">{player.demandAmount || 'N/A'}</div>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-[200px]">
          {player.archetypes.slice(0, 2).map(arch => (
            <span key={arch} className="badge bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400 text-xs">{arch}</span>
          ))}
          {player.archetypes.length > 2 && <span className="text-xs text-dugout-400">+{player.archetypes.length - 2}</span>}
        </div>
        <div className="flex items-center gap-1">
          {player.redFlags.length > 0 && <span className="text-redFlag" title={player.redFlags.join(', ')}><AlertTriangle className="w-4 h-4" /></span>}
          {player.greenFlags.length > 0 && <span className="text-greenFlag" title={player.greenFlags.join(', ')}><CheckCircle className="w-4 h-4" /></span>}
        </div>
        {player.isDrafted && <div className="text-sm text-dugout-500">Drafted: R{player.draftRound}, P{player.draftPick}</div>}
        
        {/* Action buttons */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {!player.isDrafted && !player.isNotInterested && (
            <AddToRankingsButton
              playerId={player.id}
              tierNames={tierNames}
              onAdd={onAddToRankings}
              isInRankings={!!player.ranking}
            />
          )}
          <NotInterestedButton
            playerId={player.id}
            isNotInterested={player.isNotInterested}
            onToggle={onToggleNotInterested}
          />
        </div>
        
        <div className="text-dugout-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-dugout-200 dark:border-dugout-700 p-4 bg-dugout-50 dark:bg-dugout-800/30">
          <div className="text-sm text-dugout-500">
            Expanded player details here (ratings, background, etc.)
          </div>
        </div>
      )}
    </div>
  );
}
