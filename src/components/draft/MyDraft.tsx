'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, DollarSign, HelpCircle, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MLB_TEAMS, MyDraftPick, MyDraftSummary } from '@/types';

interface MyDraftProps {
  onSync: () => Promise<void>;
  syncing: boolean;
  cooldownRemaining: number;
}

const CUSTOM_TEAMS_STORAGE_KEY = 'ootp-draft-iq-custom-teams';

export function MyDraft({ onSync, syncing, cooldownRemaining }: MyDraftProps) {
  const [teamName, setTeamName] = useState<string | null>(null);
  const [picks, setPicks] = useState<MyDraftPick[]>([]);
  const [summary, setSummary] = useState<MyDraftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTeamName, setCustomTeamName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customTeams, setCustomTeams] = useState<string[]>([]);

  // Load custom teams from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_TEAMS_STORAGE_KEY);
      if (stored) {
        setCustomTeams(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load custom teams from localStorage:', e);
    }
  }, []);

  // Add a custom team to the list
  const addCustomTeam = useCallback((team: string) => {
    setCustomTeams(prev => {
      // Don't add duplicates or MLB teams
      if (prev.includes(team) || (MLB_TEAMS as readonly string[]).includes(team)) {
        return prev;
      }
      const updated = [...prev, team];
      try {
        localStorage.setItem(CUSTOM_TEAMS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save custom teams to localStorage:', e);
      }
      return updated;
    });
  }, []);

  // Fetch team and picks
  const fetchMyDraft = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/my-draft');
      if (!res.ok) throw new Error('Failed to fetch draft data');
      const data = await res.json();
      setTeamName(data.teamName);
      setPicks(data.picks || []);
      setSummary(data.summary || null);
      
      // If the current team is a custom team, make sure it's in our list
      if (data.teamName && !(MLB_TEAMS as readonly string[]).includes(data.teamName)) {
        addCustomTeam(data.teamName);
      }
    } catch (err) {
      console.error('Failed to fetch my draft:', err);
      setError('Failed to load draft data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [addCustomTeam]);

  useEffect(() => {
    fetchMyDraft();
  }, [fetchMyDraft]);

  async function handleTeamChange(team: string | null) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: team }),
      });
      if (!res.ok) throw new Error('Failed to save team');
      setTeamName(team);
      
      // If this is a custom team, add it to our list
      if (team && !(MLB_TEAMS as readonly string[]).includes(team)) {
        addCustomTeam(team);
      }
      
      // Refetch picks for new team
      await fetchMyDraft();
    } catch (err) {
      console.error('Failed to update team:', err);
      setError('Failed to save team selection. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  }

  // Handle sync and refresh
  async function handleSyncAndRefresh() {
    await onSync();
    // Wait a moment for the sync to complete, then refetch
    setTimeout(() => {
      fetchMyDraft();
    }, 1000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner" />
      </div>
    );
  }

  // Error state
  if (error && !teamName) {
    return (
      <div className="card p-6">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 mx-auto text-redFlag mb-4" />
          <h2 className="text-xl font-semibold text-dugout-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-dugout-500 dark:text-dugout-400 mb-4">{error}</p>
          <button onClick={fetchMyDraft} className="btn-primary btn-md">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No team selected - show selection UI
  if (!teamName) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="text-center max-w-md mx-auto">
            <Users className="w-12 h-12 mx-auto text-dugout-400 mb-4" />
            <h2 className="text-xl font-semibold text-dugout-900 dark:text-white mb-2">
              Select Your Team
            </h2>
            <p className="text-dugout-500 dark:text-dugout-400 mb-6">
              Choose your team to track your draft picks, signing bonuses, and budget.
            </p>
            
            {/* MLB Teams Dropdown */}
            <div className="space-y-4">
              <select
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setShowCustomInput(true);
                  } else if (e.target.value) {
                    handleTeamChange(e.target.value);
                  }
                }}
                className="input w-full"
                disabled={saving}
                defaultValue=""
              >
                <option value="" disabled>Select a team...</option>
                {MLB_TEAMS.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
                <option value="__custom__">Custom Team (Fantasy League)</option>
              </select>
              
              {/* Custom team input */}
              {showCustomInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTeamName}
                    onChange={(e) => setCustomTeamName(e.target.value)}
                    placeholder="Enter custom team name..."
                    className="input flex-1"
                  />
                  <button
                    onClick={() => {
                      if (customTeamName.trim()) {
                        handleTeamChange(customTeamName.trim());
                        setShowCustomInput(false);
                        setCustomTeamName('');
                      }
                    }}
                    disabled={!customTeamName.trim() || saving}
                    className="btn-primary btn-md"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomTeamName('');
                    }}
                    className="btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Team selected but no picks - prompt to sync
  if (picks.length === 0) {
    return (
      <div className="space-y-6">
        {/* Team selector */}
        <TeamSelector 
          teamName={teamName} 
          onTeamChange={handleTeamChange} 
          saving={saving}
          customTeams={customTeams}
          onAddCustomTeam={addCustomTeam}
        />
        
        <div className="card p-6">
          <div className="text-center max-w-md mx-auto">
            <RefreshCw className="w-12 h-12 mx-auto text-dugout-400 mb-4" />
            <h2 className="text-xl font-semibold text-dugout-900 dark:text-white mb-2">
              No Draft Picks Yet
            </h2>
            <p className="text-dugout-500 dark:text-dugout-400 mb-6">
              Sync with Stats Plus to see your team&apos;s draft picks.
            </p>
            <button
              onClick={handleSyncAndRefresh}
              disabled={syncing || cooldownRemaining > 0}
              className="btn-primary btn-md"
            >
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              {syncing ? 'Syncing...' : cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : 'Sync Draft'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full My Draft view
  return (
    <div className="space-y-6">
      {/* Team selector */}
      <div className="flex items-center justify-between">
        <TeamSelector 
          teamName={teamName} 
          onTeamChange={handleTeamChange} 
          saving={saving}
          customTeams={customTeams}
          onAddCustomTeam={addCustomTeam}
        />
        <button
          onClick={handleSyncAndRefresh}
          disabled={syncing || cooldownRemaining > 0}
          className="btn-secondary btn-sm"
        >
          <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
          {syncing ? 'Syncing...' : cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : 'Sync'}
        </button>
      </div>
      
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-sm text-dugout-500 dark:text-dugout-400">Total Picks</div>
            <div className="text-2xl font-bold text-dugout-900 dark:text-white">
              {summary.totalPicks}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-dugout-500 dark:text-dugout-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Total Committed
            </div>
            <div className="text-2xl font-bold text-greenFlag">
              {formatCurrency(summary.totalCommitted)}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-dugout-500 dark:text-dugout-400 flex items-center gap-1">
              Slot Demands
              <span title="Players demanding slot money - exact amount determined by pick position">
                <HelpCircle className="w-3 h-3 cursor-help" />
              </span>
            </div>
            <div className="text-2xl font-bold text-dugout-900 dark:text-white">
              {summary.slotDemandCount}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-dugout-500 dark:text-dugout-400 flex items-center gap-1">
              Unknown Demands
              <span title="Players without demand data - may not have been in your CSV">
                <HelpCircle className="w-3 h-3 cursor-help" />
              </span>
            </div>
            <div className="text-2xl font-bold text-dugout-400">
              {summary.unknownDemandCount}
            </div>
          </div>
        </div>
      )}
      
      {/* Picks Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dugout-100 dark:bg-dugout-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-dugout-600 dark:text-dugout-400">Round</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dugout-600 dark:text-dugout-400">Pick</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dugout-600 dark:text-dugout-400">Player</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dugout-600 dark:text-dugout-400">Pos</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dugout-600 dark:text-dugout-400">Bonus Demand</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-dugout-600 dark:text-dugout-400">Signability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dugout-200 dark:divide-dugout-700">
              {picks.map((pick) => (
                <tr 
                  key={`${pick.round}-${pick.pick}`}
                  className="hover:bg-dugout-50 dark:hover:bg-dugout-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-dugout-900 dark:text-white">
                    {pick.round}
                  </td>
                  <td className="px-4 py-3 text-sm text-dugout-600 dark:text-dugout-400">
                    {pick.pick} <span className="text-dugout-400 text-xs">({pick.overallPick})</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-dugout-900 dark:text-white">
                    {pick.playerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-dugout-600 dark:text-dugout-400">
                    {pick.position || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {pick.isSlotDemand ? (
                      <span className="text-dugout-400 italic">
                        {pick.demandAmount === 'Slot' ? 'Slot' : 'Unknown'}
                      </span>
                    ) : (
                      <span className="text-greenFlag font-medium">
                        {pick.demandAmount}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <SignabilityBadge signability={pick.signability} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Team selector component
function TeamSelector({ 
  teamName, 
  onTeamChange, 
  saving,
  customTeams,
  onAddCustomTeam,
}: { 
  teamName: string; 
  onTeamChange: (team: string | null) => void;
  saving: boolean;
  customTeams: string[];
  onAddCustomTeam: (team: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTeamName, setCustomTeamName] = useState('');

  // Check if current team is custom (not in MLB_TEAMS)
  const isCurrentTeamCustom = teamName && !(MLB_TEAMS as readonly string[]).includes(teamName);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-dugout-500 dark:text-dugout-400">My Team:</span>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={saving}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dugout-100 dark:bg-dugout-800 text-dugout-900 dark:text-white font-medium hover:bg-dugout-200 dark:hover:bg-dugout-700 transition-colors"
        >
          {teamName}
          {isCurrentTeamCustom && (
            <span className="text-xs text-dugout-400">(Custom)</span>
          )}
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => {
                setIsOpen(false);
                setShowCustomInput(false);
                setCustomTeamName('');
              }} 
            />
            <div className="absolute top-full left-0 mt-1 z-50 w-72 max-h-96 overflow-y-auto rounded-lg shadow-xl border border-dugout-200 dark:border-dugout-700 bg-white dark:bg-dugout-900">
              {/* Custom teams section */}
              {customTeams.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-dugout-500 dark:text-dugout-400 bg-dugout-50 dark:bg-dugout-800/50">
                    Custom Teams
                  </div>
                  {customTeams.map((team) => (
                    <button
                      key={team}
                      onClick={() => {
                        onTeamChange(team);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm hover:bg-dugout-100 dark:hover:bg-dugout-800 transition-colors",
                        team === teamName && "bg-diamond-50 dark:bg-diamond-900/20 text-diamond-700 dark:text-diamond-400"
                      )}
                    >
                      {team}
                    </button>
                  ))}
                </>
              )}
              
              {/* Add custom team option */}
              {showCustomInput ? (
                <div className="p-2 border-b border-dugout-200 dark:border-dugout-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTeamName}
                      onChange={(e) => setCustomTeamName(e.target.value)}
                      placeholder="Team name..."
                      className="input text-sm flex-1 py-1.5"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customTeamName.trim()) {
                          onAddCustomTeam(customTeamName.trim());
                          onTeamChange(customTeamName.trim());
                          setShowCustomInput(false);
                          setCustomTeamName('');
                          setIsOpen(false);
                        } else if (e.key === 'Escape') {
                          setShowCustomInput(false);
                          setCustomTeamName('');
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (customTeamName.trim()) {
                          onAddCustomTeam(customTeamName.trim());
                          onTeamChange(customTeamName.trim());
                          setShowCustomInput(false);
                          setCustomTeamName('');
                          setIsOpen(false);
                        }
                      }}
                      disabled={!customTeamName.trim()}
                      className="btn-primary btn-sm text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full px-3 py-2 text-left text-sm text-diamond-600 dark:text-diamond-400 hover:bg-dugout-100 dark:hover:bg-dugout-800 transition-colors border-b border-dugout-200 dark:border-dugout-700"
                >
                  + Add Custom Team
                </button>
              )}
              
              {/* MLB Teams section */}
              <div className="px-3 py-2 text-xs font-medium text-dugout-500 dark:text-dugout-400 bg-dugout-50 dark:bg-dugout-800/50">
                MLB Teams
              </div>
              {MLB_TEAMS.map((team) => (
                <button
                  key={team}
                  onClick={() => {
                    onTeamChange(team);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-dugout-100 dark:hover:bg-dugout-800 transition-colors",
                    team === teamName && "bg-diamond-50 dark:bg-diamond-900/20 text-diamond-700 dark:text-diamond-400"
                  )}
                >
                  {team}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Signability badge component
function SignabilityBadge({ signability }: { signability: string | null }) {
  if (!signability) return <span className="text-dugout-400">-</span>;
  
  const colorClass: Record<string, string> = {
    'Very Easy': 'bg-greenFlag/10 text-greenFlag',
    'Easy': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'Normal': 'bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400',
    'Hard': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    'Extremely Hard': 'bg-redFlag/10 text-redFlag',
  };
  
  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', colorClass[signability] || colorClass['Normal'])}>
      {signability}
    </span>
  );
}

export default MyDraft;
