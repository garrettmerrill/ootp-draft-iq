'use client';

import { useState, useEffect } from 'react';
import { DraftPhilosophy, DEFAULT_PHILOSOPHY, POSITIONS } from '@/types';

const BATTER_TYPES = ['Flyball', 'Line Drive', 'Normal', 'Groundball'];
const PITCHER_TYPES = ['EX GB', 'GB', 'NEU', 'FB', 'EX FB'];

export default function PhilosophyPage() {
  const [philosophies, setPhilosophies] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [activePhilosophy, setActivePhilosophy] = useState<any | null>(null);
  const [editing, setEditing] = useState<DraftPhilosophy>(DEFAULT_PHILOSOPHY);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhilosophies();
  }, []);

  async function fetchPhilosophies() {
    try {
      const res = await fetch('/api/philosophy');
      const data = await res.json();
      setPhilosophies(data.philosophies || []);
      setPresets(data.presets || []);
      setActivePhilosophy(data.activePhilosophy);
      
      if (data.activePhilosophy) {
        setEditing(data.activePhilosophy.settings);
      }
    } catch (error) {
      console.error('Error fetching philosophies:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateTotal(weights: Record<string, number>, exclude: string[] = []): number {
    return Object.entries(weights)
      .filter(([key]) => !exclude.includes(key))
      .reduce((sum, [_, val]) => sum + val, 0);
  }

  function isValid(): boolean {
    // Check base weights (POT + OVR should be between 40-80, leaving room for skills)
    const baseTotal = editing.potentialWeight + editing.overallWeight;
    if (baseTotal < 20 || baseTotal > 90) return false;
    
    // Check batter weights
    const batterExclude = editing.useBabipKs ? ['contact'] : ['babip', 'avoidK'];
    const batterTotal = calculateTotal(editing.batterWeights, batterExclude);
    if (Math.abs(batterTotal - 100) > 0.01) return false;
    
    // Check SP weights
    const spExclude = editing.useMovementSP ? ['pBabip', 'hrRate'] : ['movement'];
    const spTotal = calculateTotal(editing.spWeights, spExclude);
    if (Math.abs(spTotal - 100) > 0.01) return false;
    
    // Check RP weights
    const rpExclude = editing.useMovementRP ? ['pBabip', 'hrRate'] : ['movement'];
    const rpTotal = calculateTotal(editing.rpWeights, rpExclude);
    if (Math.abs(rpTotal - 100) > 0.01) return false;
    
    return true;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const isUpdating = editing.id && !editing.isPreset;
      
      if (isUpdating) {
        await fetch(`/api/philosophy/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ philosophy: editing }),
        });
      } else {
        const { id, ...philosophyData } = editing;
        await fetch('/api/philosophy/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            philosophy: {
              ...philosophyData,
              isActive: false,
              isPreset: false,
            }
          }),
        });
      }
      await fetchPhilosophies();
      alert(isUpdating ? 'Philosophy updated successfully!' : 'Philosophy created successfully!');
    } catch (error) {
      alert('Failed to save philosophy');
    } finally {
      setSaving(false);
    }
  }

  async function handleRecalculate() {
    if (!confirm('This will recalculate all players. Continue?')) return;
    
    setRecalculating(true);
    try {
      const res = await fetch('/api/philosophy/recalculate', { method: 'POST' });
      const data = await res.json();
      alert(`Recalculated ${data.playersUpdated} players!`);
    } catch (error) {
      alert('Failed to recalculate players');
    } finally {
      setRecalculating(false);
    }
  }

  async function handleActivate(id: string) {
    try {
      await fetch('/api/philosophy/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ philosophyId: id }),
      });
      await fetchPhilosophies();
    } catch (error) {
      alert('Failed to activate philosophy');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this philosophy?')) return;
    
    try {
      await fetch(`/api/philosophy/${id}`, { method: 'DELETE' });
      await fetchPhilosophies();
    } catch (error) {
      alert('Failed to delete philosophy');
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const baseTotal = editing.potentialWeight + editing.overallWeight;
  const skillsWeight = 100 - baseTotal;
  const batterExclude = editing.useBabipKs ? ['contact'] : ['babip', 'avoidK'];
  const batterTotal = calculateTotal(editing.batterWeights, batterExclude);
  const spExclude = editing.useMovementSP ? ['pBabip', 'hrRate'] : ['movement'];
  const spTotal = calculateTotal(editing.spWeights, spExclude);
  const rpExclude = editing.useMovementRP ? ['pBabip', 'hrRate'] : ['movement'];
  const rpTotal = calculateTotal(editing.rpWeights, rpExclude);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Draft Philosophy</h1>
          <p className="text-dugout-500 dark:text-dugout-400 mt-1">
            Configure how players are evaluated and ranked
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ ...DEFAULT_PHILOSOPHY, name: 'New Philosophy' });
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New
        </button>
      </div>

      {/* Score Calculation Explanation */}
      <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-800 rounded-lg shadow-lg p-6 border-2 border-blue-200 dark:border-blue-800">
        <h2 className="text-xl font-bold text-dugout-900 dark:text-white mb-3 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How Player Scores Are Calculated
        </h2>
        <div className="space-y-4 text-sm text-dugout-700 dark:text-dugout-300">
          <p className="leading-relaxed">
            Each player receives a <span className="font-semibold text-blue-600 dark:text-blue-400">Composite Score</span> (typically 0-100) based on three parts:
          </p>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
            <div className="font-mono text-xs space-y-2">
              <div><span className="font-semibold">1. BASE SCORE</span> (POT + OVR weights)</div>
              <div className="ml-4 text-blue-600">POT rating × {editing.potentialWeight}% + OVR rating × {editing.overallWeight}%</div>
              <div className="mt-2"><span className="font-semibold">2. SKILLS SCORE</span> (remaining {skillsWeight}%)</div>
              <div className="ml-4 text-purple-600">Weighted average of individual ratings (Power, Contact, Stuff, etc.)</div>
              <div className="mt-2"><span className="font-semibold">3. ADJUSTMENTS</span> (flat bonuses/penalties)</div>
              <div className="ml-4 text-green-600">+ Position bonus, + Personality bonuses, + Preference bonuses</div>
              <div className="ml-4 text-red-600">− Risk penalty, − Personality penalties</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
              <div className="font-semibold text-dugout-900 dark:text-white mb-2">Example: 70 POT / 35 OVR SS</div>
              <div className="text-xs space-y-1">
                <div>POT: 70 → 83 normalized × 40% = <span className="text-blue-600">33 pts</span></div>
                <div>OVR: 35 → 25 normalized × 20% = <span className="text-blue-600">5 pts</span></div>
                <div>Skills: weighted avg × 40% ≈ <span className="text-purple-600">30 pts</span></div>
                <div>+ High Work Ethic = <span className="text-green-600">+5 pts</span></div>
                <div>− High Risk = <span className="text-red-600">−10 pts</span></div>
                <div className="font-semibold mt-1">Total: ~63 pts → "Very Good"</div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
              <div className="font-semibold text-dugout-900 dark:text-white mb-2">Rating Scale</div>
              <div className="text-xs space-y-1">
                <div>OOTP uses 20-80 scale</div>
                <div>We normalize to 0-100:</div>
                <div className="ml-2">20 rating → 0 pts</div>
                <div className="ml-2">50 rating → 50 pts</div>
                <div className="ml-2">80 rating → 100 pts</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Select Philosophy</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {philosophies.map((phil) => (
            <div
              key={phil.id}
              className={`p-4 border-2 rounded-lg cursor-pointer ${
                editing.id === phil.id ? 'border-blue-500' : 'border-gray-300'
              }`}
              onClick={() => setEditing(phil.settings)}
            >
              <div className="font-semibold">{phil.name}</div>
              <div className="text-sm text-gray-600">{phil.description}</div>
              {phil.isActive && <div className="text-xs text-green-600 mt-1">Active</div>}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivate(phil.id);
                  }}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded"
                >
                  Activate
                </button>
                {!phil.isPreset && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(phil.id);
                    }}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Philosophy Info & Base Weights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Philosophy Info</h2>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({...editing, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="My Custom Philosophy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <input
              type="text"
              value={editing.description || ''}
              onChange={(e) => setEditing({...editing, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="A brief description of this philosophy"
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-2">Base Weights</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          POT + OVR = {baseTotal}% of score. Remaining {skillsWeight}% comes from individual skill ratings.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Potential Weight: {editing.potentialWeight}%</label>
            <input
              type="range"
              min="0"
              max="80"
              value={editing.potentialWeight}
              onChange={(e) => setEditing({...editing, potentialWeight: Number(e.target.value)})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Overall Weight: {editing.overallWeight}%</label>
            <input
              type="range"
              min="0"
              max="80"
              value={editing.overallWeight}
              onChange={(e) => setEditing({...editing, overallWeight: Number(e.target.value)})}
              className="w-full"
            />
          </div>
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-medium">Skills Weight: {skillsWeight}% (automatic)</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              This portion comes from individual ratings like Power, Contact, Stuff, etc.
            </div>
          </div>
        </div>
      </div>

      {/* Risk Penalties */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Risk Penalties</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Points subtracted from players based on their risk level
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-red-600">Very High Risk: −{editing.riskPenalties.veryHigh}</label>
            <input
              type="range"
              min="0"
              max="30"
              value={editing.riskPenalties.veryHigh}
              onChange={(e) => setEditing({...editing, riskPenalties: {...editing.riskPenalties, veryHigh: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-orange-600">High Risk: −{editing.riskPenalties.high}</label>
            <input
              type="range"
              min="0"
              max="20"
              value={editing.riskPenalties.high}
              onChange={(e) => setEditing({...editing, riskPenalties: {...editing.riskPenalties, high: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-yellow-600">Medium Risk: −{editing.riskPenalties.medium}</label>
            <input
              type="range"
              min="0"
              max="15"
              value={editing.riskPenalties.medium}
              onChange={(e) => setEditing({...editing, riskPenalties: {...editing.riskPenalties, medium: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Personality Adjustments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Personality Adjustments</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Flat points added or subtracted based on player personality traits
        </p>
        
        <h3 className="text-md font-semibold mb-3 text-green-600">Bonuses (positive traits)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">High Work Ethic: +{editing.personalityBonuses.highWorkEthic}</label>
            <input
              type="range"
              min="0"
              max="15"
              value={editing.personalityBonuses.highWorkEthic}
              onChange={(e) => setEditing({...editing, personalityBonuses: {...editing.personalityBonuses, highWorkEthic: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">High Intelligence: +{editing.personalityBonuses.highIntelligence}</label>
            <input
              type="range"
              min="0"
              max="15"
              value={editing.personalityBonuses.highIntelligence}
              onChange={(e) => setEditing({...editing, personalityBonuses: {...editing.personalityBonuses, highIntelligence: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Leadership: +{editing.personalityBonuses.leadership}</label>
            <input
              type="range"
              min="0"
              max="10"
              value={editing.personalityBonuses.leadership}
              onChange={(e) => setEditing({...editing, personalityBonuses: {...editing.personalityBonuses, leadership: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">High Adaptability: +{editing.personalityBonuses.highAdaptability}</label>
            <input
              type="range"
              min="0"
              max="10"
              value={editing.personalityBonuses.highAdaptability}
              onChange={(e) => setEditing({...editing, personalityBonuses: {...editing.personalityBonuses, highAdaptability: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Durable: +{editing.personalityBonuses.durable}</label>
            <input
              type="range"
              min="0"
              max="10"
              value={editing.personalityBonuses.durable}
              onChange={(e) => setEditing({...editing, personalityBonuses: {...editing.personalityBonuses, durable: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
        </div>

        <h3 className="text-md font-semibold mb-3 text-red-600">Penalties (negative traits)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Low Work Ethic: −{editing.personalityPenalties.lowWorkEthic}</label>
            <input
              type="range"
              min="0"
              max="15"
              value={editing.personalityPenalties.lowWorkEthic}
              onChange={(e) => setEditing({...editing, personalityPenalties: {...editing.personalityPenalties, lowWorkEthic: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Low Intelligence: −{editing.personalityPenalties.lowIntelligence}</label>
            <input
              type="range"
              min="0"
              max="15"
              value={editing.personalityPenalties.lowIntelligence}
              onChange={(e) => setEditing({...editing, personalityPenalties: {...editing.personalityPenalties, lowIntelligence: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Low Adaptability: −{editing.personalityPenalties.lowAdaptability}</label>
            <input
              type="range"
              min="0"
              max="10"
              value={editing.personalityPenalties.lowAdaptability}
              onChange={(e) => setEditing({...editing, personalityPenalties: {...editing.personalityPenalties, lowAdaptability: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Injury Prone: −{editing.personalityPenalties.injuryProne}</label>
            <input
              type="range"
              min="0"
              max="15"
              value={editing.personalityPenalties.injuryProne}
              onChange={(e) => setEditing({...editing, personalityPenalties: {...editing.personalityPenalties, injuryProne: Number(e.target.value)}})}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        
        {/* College vs HS */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">College vs High School</label>
          <div className="flex gap-4 mb-2">
            {['college', 'hs', 'neutral'].map((opt) => (
              <label key={opt} className="flex items-center">
                <input
                  type="radio"
                  checked={editing.collegeVsHS === opt}
                  onChange={() => setEditing({...editing, collegeVsHS: opt as any})}
                  className="mr-2"
                />
                {opt === 'college' ? 'College' : opt === 'hs' ? 'High School' : 'Neutral'}
              </label>
            ))}
          </div>
          {editing.collegeVsHS !== 'neutral' && (
            <div>
              <label className="block text-sm mb-2">Bonus: +{editing.collegeHSBonus}</label>
              <input
                type="range"
                min="0"
                max="20"
                value={editing.collegeHSBonus}
                onChange={(e) => setEditing({...editing, collegeHSBonus: Number(e.target.value)})}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Batter Types */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Preferred Batter Types</label>
          <div className="flex gap-4 mb-2 flex-wrap">
            {BATTER_TYPES.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={editing.preferredBatterTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditing({...editing, preferredBatterTypes: [...editing.preferredBatterTypes, type]});
                    } else {
                      setEditing({...editing, preferredBatterTypes: editing.preferredBatterTypes.filter(t => t !== type)});
                    }
                  }}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
          {editing.preferredBatterTypes.length > 0 && (
            <div>
              <label className="block text-sm mb-2">Bonus: +{editing.batterTypeBonus}</label>
              <input
                type="range"
                min="0"
                max="15"
                value={editing.batterTypeBonus}
                onChange={(e) => setEditing({...editing, batterTypeBonus: Number(e.target.value)})}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Pitcher Types */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Preferred Pitcher Types</label>
          <div className="flex gap-4 mb-2 flex-wrap">
            {PITCHER_TYPES.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={editing.preferredPitcherTypes.includes(type)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditing({...editing, preferredPitcherTypes: [...editing.preferredPitcherTypes, type]});
                    } else {
                      setEditing({...editing, preferredPitcherTypes: editing.preferredPitcherTypes.filter(t => t !== type)});
                    }
                  }}
                  className="mr-2"
                />
                {type}
              </label>
            ))}
          </div>
          {editing.preferredPitcherTypes.length > 0 && (
            <div>
              <label className="block text-sm mb-2">Bonus: +{editing.pitcherTypeBonus}</label>
              <input
                type="range"
                min="0"
                max="15"
                value={editing.pitcherTypeBonus}
                onChange={(e) => setEditing({...editing, pitcherTypeBonus: Number(e.target.value)})}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Priority Positions */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Priority Positions</label>
          <div className="flex gap-4 mb-2 flex-wrap">
            {POSITIONS.map((pos) => (
              <label key={pos} className="flex items-center">
                <input
                  type="checkbox"
                  checked={editing.priorityPositions.includes(pos)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditing({...editing, priorityPositions: [...editing.priorityPositions, pos]});
                    } else {
                      setEditing({...editing, priorityPositions: editing.priorityPositions.filter(p => p !== pos)});
                    }
                  }}
                  className="mr-2"
                />
                {pos}
              </label>
            ))}
          </div>
          {editing.priorityPositions.length > 0 && (
            <div>
              <label className="block text-sm mb-2">Bonus: +{editing.positionBonus}</label>
              <input
                type="range"
                min="0"
                max="20"
                value={editing.positionBonus}
                onChange={(e) => setEditing({...editing, positionBonus: Number(e.target.value)})}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Batter Weights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Batter Skill Weights
          <span className={`ml-2 text-sm ${Math.abs(batterTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
            (Total: {batterTotal.toFixed(1)}%)
          </span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          How individual batting skills are weighted when calculating the skills portion of the score
        </p>
        
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={editing.useBabipKs}
            onChange={(e) => setEditing({...editing, useBabipKs: e.target.checked})}
            className="mr-2"
          />
          Use BABIP + Avoid K&apos;s instead of Contact
        </label>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Power: {editing.batterWeights.power}%</label>
            <input type="range" min="0" max="100" value={editing.batterWeights.power}
              onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, power: Number(e.target.value)}})}
              className="w-full" />
          </div>
          
          {!editing.useBabipKs ? (
            <div>
              <label className="block text-sm font-medium mb-2">Contact: {editing.batterWeights.contact}%</label>
              <input type="range" min="0" max="100" value={editing.batterWeights.contact}
                onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, contact: Number(e.target.value)}})}
                className="w-full" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">BABIP: {editing.batterWeights.babip}%</label>
                <input type="range" min="0" max="100" value={editing.batterWeights.babip}
                  onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, babip: Number(e.target.value)}})}
                  className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Avoid K: {editing.batterWeights.avoidK}%</label>
                <input type="range" min="0" max="100" value={editing.batterWeights.avoidK}
                  onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, avoidK: Number(e.target.value)}})}
                  className="w-full" />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Eye: {editing.batterWeights.eye}%</label>
            <input type="range" min="0" max="100" value={editing.batterWeights.eye}
              onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, eye: Number(e.target.value)}})}
              className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gap: {editing.batterWeights.gap}%</label>
            <input type="range" min="0" max="100" value={editing.batterWeights.gap}
              onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, gap: Number(e.target.value)}})}
              className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Speed: {editing.batterWeights.speed}%</label>
            <input type="range" min="0" max="100" value={editing.batterWeights.speed}
              onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, speed: Number(e.target.value)}})}
              className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Defense: {editing.batterWeights.defense}%</label>
            <input type="range" min="0" max="100" value={editing.batterWeights.defense}
              onChange={(e) => setEditing({...editing, batterWeights: {...editing.batterWeights, defense: Number(e.target.value)}})}
              className="w-full" />
          </div>
        </div>
      </div>

      {/* SP Weights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          SP Skill Weights
          <span className={`ml-2 text-sm ${Math.abs(spTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
            (Total: {spTotal.toFixed(1)}%)
          </span>
        </h2>
        
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={editing.useMovementSP}
            onChange={(e) => setEditing({...editing, useMovementSP: e.target.checked})}
            className="mr-2"
          />
          Use Movement instead of PBABIP + HR Rate
        </label>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stuff: {editing.spWeights.stuff}%</label>
            <input type="range" min="0" max="100" value={editing.spWeights.stuff}
              onChange={(e) => setEditing({...editing, spWeights: {...editing.spWeights, stuff: Number(e.target.value)}})}
              className="w-full" />
          </div>
          
          {editing.useMovementSP ? (
            <div>
              <label className="block text-sm font-medium mb-2">Movement: {editing.spWeights.movement}%</label>
              <input type="range" min="0" max="100" value={editing.spWeights.movement}
                onChange={(e) => setEditing({...editing, spWeights: {...editing.spWeights, movement: Number(e.target.value)}})}
                className="w-full" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">PBABIP: {editing.spWeights.pBabip}%</label>
                <input type="range" min="0" max="100" value={editing.spWeights.pBabip}
                  onChange={(e) => setEditing({...editing, spWeights: {...editing.spWeights, pBabip: Number(e.target.value)}})}
                  className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">HR Rate: {editing.spWeights.hrRate}%</label>
                <input type="range" min="0" max="100" value={editing.spWeights.hrRate}
                  onChange={(e) => setEditing({...editing, spWeights: {...editing.spWeights, hrRate: Number(e.target.value)}})}
                  className="w-full" />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Control: {editing.spWeights.control}%</label>
            <input type="range" min="0" max="100" value={editing.spWeights.control}
              onChange={(e) => setEditing({...editing, spWeights: {...editing.spWeights, control: Number(e.target.value)}})}
              className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stamina: {editing.spWeights.stamina}%</label>
            <input type="range" min="0" max="100" value={editing.spWeights.stamina}
              onChange={(e) => setEditing({...editing, spWeights: {...editing.spWeights, stamina: Number(e.target.value)}})}
              className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Arsenal: {editing.spWeights.arsenal}%</label>
            <input type="range" min="0" max="100" value={editing.spWeights.arsenal}
              onChange={(e) => setEditing({...editing, spWeights: {...editing.spWeights, arsenal: Number(e.target.value)}})}
              className="w-full" />
          </div>
        </div>
      </div>

      {/* RP Weights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          RP/CL Skill Weights
          <span className={`ml-2 text-sm ${Math.abs(rpTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
            (Total: {rpTotal.toFixed(1)}%)
          </span>
        </h2>
        
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={editing.useMovementRP}
            onChange={(e) => setEditing({...editing, useMovementRP: e.target.checked})}
            className="mr-2"
          />
          Use Movement instead of PBABIP + HR Rate
        </label>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Stuff: {editing.rpWeights.stuff}%</label>
            <input type="range" min="0" max="100" value={editing.rpWeights.stuff}
              onChange={(e) => setEditing({...editing, rpWeights: {...editing.rpWeights, stuff: Number(e.target.value)}})}
              className="w-full" />
          </div>
          
          {editing.useMovementRP ? (
            <div>
              <label className="block text-sm font-medium mb-2">Movement: {editing.rpWeights.movement}%</label>
              <input type="range" min="0" max="100" value={editing.rpWeights.movement}
                onChange={(e) => setEditing({...editing, rpWeights: {...editing.rpWeights, movement: Number(e.target.value)}})}
                className="w-full" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">PBABIP: {editing.rpWeights.pBabip}%</label>
                <input type="range" min="0" max="100" value={editing.rpWeights.pBabip}
                  onChange={(e) => setEditing({...editing, rpWeights: {...editing.rpWeights, pBabip: Number(e.target.value)}})}
                  className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">HR Rate: {editing.rpWeights.hrRate}%</label>
                <input type="range" min="0" max="100" value={editing.rpWeights.hrRate}
                  onChange={(e) => setEditing({...editing, rpWeights: {...editing.rpWeights, hrRate: Number(e.target.value)}})}
                  className="w-full" />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Control: {editing.rpWeights.control}%</label>
            <input type="range" min="0" max="100" value={editing.rpWeights.control}
              onChange={(e) => setEditing({...editing, rpWeights: {...editing.rpWeights, control: Number(e.target.value)}})}
              className="w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Arsenal: {editing.rpWeights.arsenal}%</label>
            <input type="range" min="0" max="100" value={editing.rpWeights.arsenal}
              onChange={(e) => setEditing({...editing, rpWeights: {...editing.rpWeights, arsenal: Number(e.target.value)}})}
              className="w-full" />
          </div>
        </div>
      </div>

      {/* Tier Thresholds */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Tier Thresholds</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Minimum composite score needed for each tier. Players below &quot;Average&quot; are classified as &quot;Filler&quot;.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Elite (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.elite}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, elite: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Very Good (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.veryGood}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, veryGood: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Good (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.good}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, good: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Average (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.average}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, average: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={handleSave}
          disabled={!isValid() || saving}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isValid() && !saving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Philosophy'}
        </button>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
        >
          {recalculating ? 'Recalculating...' : 'Recalculate All Players'}
        </button>
      </div>
    </div>
  );
}
