'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, ChevronDown, ChevronUp, RefreshCw,
  Target, Sparkles, AlertTriangle, CheckCircle,
  SlidersHorizontal
} from 'lucide-react';
import { cn, parseNaturalLanguageQuery, getTierColor } from '@/lib/utils';
import { Player, PlayerFilters, DEFAULT_FILTERS, POSITIONS, Tier } from '@/types';

export default function DraftBoardPage() {
  useSession(); // For auth check
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy] = useState<'rank' | 'name' | 'potential' | 'overall'>('rank');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Fetch players
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch('/api/players');
        const data = await res.json();
        if (data.players) {
          setPlayers(data.players);
        }
      } catch (error) {
        console.error('Failed to fetch players:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  // Handle natural language search
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
      setFilters(prev => ({
        ...prev,
        searchQuery: '',
      }));
    }
  }, [searchQuery]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Apply filters
    if (filters.positions.length > 0) {
      result = result.filter(p => filters.positions.includes(p.position));
    }
    if (filters.minPotential) {
      result = result.filter(p => p.potential >= filters.minPotential!);
    }
    if (filters.maxPotential) {
      result = result.filter(p => p.potential <= filters.maxPotential!);
    }
    if (filters.tiers.length > 0) {
      result = result.filter(p => p.tier && filters.tiers.includes(p.tier));
    }
    if (!filters.showDrafted) {
      result = result.filter(p => !p.isDrafted);
    }
    if (filters.showSleepersOnly) {
      result = result.filter(p => p.isSleeper);
    }
    if (filters.collegeOnly) {
      result = result.filter(p => p.highSchoolClass?.includes('CO'));
    }
    if (filters.hsOnly) {
      result = result.filter(p => p.highSchoolClass?.includes('HS'));
    }

    // Text search
    if (filters.searchQuery && filters.searchQuery.length > 0) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.nickname?.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        p.archetypes.some(a => a.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rank':
          comparison = (b.compositeScore || 0) - (a.compositeScore || 0);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'potential':
          comparison = b.potential - a.potential;
          break;
        case 'overall':
          comparison = b.overall - a.overall;
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [players, filters, sortBy, sortOrder]);

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
        <h2 className="text-xl font-semibold text-dugout-900 dark:text-white">
          No Players Yet
        </h2>
        <p className="text-dugout-500 dark:text-dugout-400 mt-2">
          Upload your CSV data to see your draft board
        </p>
        <a href="/dashboard/upload" className="btn-primary btn-md mt-4 inline-flex">
          Upload CSV
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dugout-900 dark:text-white">
            Draft Board
          </h1>
          <p className="text-dugout-500 dark:text-dugout-400 mt-1">
            {filteredPlayers.length} of {players.length} players
          </p>
        </div>
        <button className="btn-secondary btn-sm">
          <RefreshCw className="w-4 h-4" />
          Sync Draft
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
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
          
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'btn-secondary btn-md',
              showFilters && 'bg-diamond-100 dark:bg-diamond-900'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {Object.values(filters).some(v => 
              Array.isArray(v) ? v.length > 0 : v !== null && v !== false && v !== ''
            ) && (
              <span className="w-2 h-2 rounded-full bg-diamond-500" />
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-dugout-200 dark:border-dugout-700 space-y-4">
            {/* Position filters */}
            <div>
              <label className="label">Positions</label>
              <div className="flex flex-wrap gap-2">
                {POSITIONS.map(pos => (
                  <button
                    key={pos}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        positions: prev.positions.includes(pos)
                          ? prev.positions.filter(p => p !== pos)
                          : [...prev.positions, pos],
                      }));
                    }}
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

            {/* Tier filters */}
            <div>
              <label className="label">Tiers</label>
              <div className="flex flex-wrap gap-2">
                {(['Elite', 'Very Good', 'Good', 'Average', 'Filler'] as Tier[]).map(tier => (
                  <button
                    key={tier}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        tiers: prev.tiers.includes(tier)
                          ? prev.tiers.filter(t => t !== tier)
                          : [...prev.tiers, tier],
                      }));
                    }}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium transition-colors border',
                      filters.tiers.includes(tier)
                        ? getTierColor(tier)
                        : 'bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400 border-transparent'
                    )}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle filters */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showSleepersOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, showSleepersOnly: e.target.checked }))}
                  className="rounded border-dugout-300"
                />
                <span className="text-sm text-dugout-700 dark:text-dugout-300">Sleepers only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showDrafted}
                  onChange={(e) => setFilters(prev => ({ ...prev, showDrafted: e.target.checked }))}
                  className="rounded border-dugout-300"
                />
                <span className="text-sm text-dugout-700 dark:text-dugout-300">Show drafted</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.collegeOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, collegeOnly: e.target.checked, hsOnly: false }))}
                  className="rounded border-dugout-300"
                />
                <span className="text-sm text-dugout-700 dark:text-dugout-300">College only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hsOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, hsOnly: e.target.checked, collegeOnly: false }))}
                  className="rounded border-dugout-300"
                />
                <span className="text-sm text-dugout-700 dark:text-dugout-300">HS only</span>
              </label>
            </div>

            {/* Clear filters */}
            <button
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setSearchQuery('');
              }}
              className="text-sm text-diamond-600 hover:text-diamond-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Player List */}
      <div className="space-y-4">
        {filteredPlayers.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            rank={index + 1}
            isExpanded={expandedPlayer === player.id}
            onToggle={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
          />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12 text-dugout-500 dark:text-dugout-400">
          No players match your filters
        </div>
      )}
    </div>
  );
}

function PlayerCard({ 
  player, 
  rank, 
  isExpanded, 
  onToggle 
}: { 
  player: Player; 
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
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
    <div className={cn(
      'card overflow-hidden transition-all',
      player.isDrafted && 'opacity-50'
    )}>
      {/* Collapsed view */}
      <div
        onClick={onToggle}
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-dugout-50 dark:hover:bg-dugout-800/50"
      >
        {/* Tier indicator */}
        <div className={cn('h-12 w-1 rounded-full', getTierIndicatorClass(player.tier))} />
        
        {/* Rank */}
        <div className="w-8 text-center">
          <span className="text-lg font-bold text-dugout-400">#{rank}</span>
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-dugout-900 dark:text-white">
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

        {/* Ratings */}
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

        {/* Archetypes */}
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

        {/* Flags */}
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

        {/* Draft status */}
        {player.isDrafted && (
          <div className="text-sm text-dugout-500">
            Drafted: R{player.draftRound}, P{player.draftPick}
          </div>
        )}

        {/* Expand icon */}
        <div className="text-dugout-400">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-dugout-200 dark:border-dugout-700 p-4 bg-dugout-50 dark:bg-dugout-800/30">
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
