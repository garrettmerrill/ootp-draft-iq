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
    // Check global weights
    const globalTotal = editing.potentialWeight + editing.overallWeight + 
                       editing.riskWeight + editing.signabilityWeight;
    if (Math.abs(globalTotal - 100) > 0.01) return false;
    
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
      if (editing.id) {
        await fetch(`/api/philosophy/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ philosophy: editing }),
        });
      } else {
        await fetch('/api/philosophy/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ philosophy: editing }),
        });
      }
      await fetchPhilosophies();
      alert('Philosophy saved successfully!');
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

  const globalTotal = editing.potentialWeight + editing.overallWeight + 
                     editing.riskWeight + editing.signabilityWeight;
  const batterExclude = editing.useBabipKs ? ['contact'] : ['babip', 'avoidK'];
  const batterTotal = calculateTotal(editing.batterWeights, batterExclude);
  const spExclude = editing.useMovementSP ? ['pBabip', 'hrRate'] : ['movement'];
  const spTotal = calculateTotal(editing.spWeights, spExclude);
  const rpExclude = editing.useMovementRP ? ['pBabip', 'hrRate'] : ['movement'];
  const rpTotal = calculateTotal(editing.rpWeights, rpExclude);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Draft Philosophy</h1>
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

      {/* Global Weights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Global Weights 
          <span className={`ml-2 text-sm ${Math.abs(globalTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
            (Total: {globalTotal.toFixed(1)}%)
          </span>
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Potential Weight: {editing.potentialWeight}%</label>
            <input
              type="range"
              min="0"
              max="100"
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
              max="100"
              value={editing.overallWeight}
              onChange={(e) => setEditing({...editing, overallWeight: Number(e.target.value)})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Risk Weight: {editing.riskWeight}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={editing.riskWeight}
              onChange={(e) => setEditing({...editing, riskWeight: Number(e.target.value)})}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Signability Weight: {editing.signabilityWeight}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={editing.signabilityWeight}
              onChange={(e) => setEditing({...editing, signabilityWeight: Number(e.target.value)})}
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
              <label className="block text-sm mb-2">Bonus: {editing.collegeHSBonus}</label>
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
              <label className="block text-sm mb-2">Bonus: {editing.batterTypeBonus}</label>
              <input
                type="range"
                min="0"
                max="20"
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
              <label className="block text-sm mb-2">Bonus: {editing.pitcherTypeBonus}</label>
              <input
                type="range"
                min="0"
                max="20"
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
              <label className="block text-sm mb-2">Bonus: {editing.positionBonus}</label>
              <input
                type="range"
                min="0"
                max="30"
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
          Batter Weights
          <span className={`ml-2 text-sm ${Math.abs(batterTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
            (Total: {batterTotal.toFixed(1)}%)
          </span>
        </h2>
        
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={editing.useBabipKs}
            onChange={(e) => setEditing({...editing, useBabipKs: e.target.checked})}
            className="mr-2"
          />
          Use BABIP + K's instead of Contact
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
          SP Weights
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
          RP Weights
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
        <h2 className="text-xl font-semibold mb-4">Tier Thresholds</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Elite (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.elite}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, elite: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Very Good (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.veryGood}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, veryGood: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Good (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.good}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, good: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Average (≥)</label>
            <input
              type="number"
              value={editing.tierThresholds.average}
              onChange={(e) => setEditing({...editing, tierThresholds: {...editing.tierThresholds, average: Number(e.target.value)}})}
              className="w-full px-3 py-2 border rounded-lg"
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
