'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TierNames, DEFAULT_TIER_NAMES } from '@/types';

interface RenameTiersModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierNames: TierNames;
  onSave: (tierNames: TierNames) => Promise<void>;
}

export function RenameTiersModal({
  isOpen,
  onClose,
  tierNames,
  onSave,
}: RenameTiersModalProps) {
  const [editing, setEditing] = useState<TierNames>(tierNames);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditing(tierNames);
  }, [tierNames, isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(editing);
      onClose();
    } catch (error) {
      console.error('Failed to save tier names:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dugout-900 rounded-xl shadow-xl w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dugout-200 dark:border-dugout-700">
          <h2 className="text-lg font-semibold text-dugout-900 dark:text-white">
            Rename Tiers
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-dugout-100 dark:hover:bg-dugout-800 text-dugout-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {[1, 2, 3, 4, 5].map((tier) => (
            <div key={tier} className="flex items-center gap-4">
              <div className="w-16 text-sm font-medium text-dugout-500 dark:text-dugout-400">
                Tier {tier}
              </div>
              <input
                type="text"
                value={editing[tier as keyof TierNames]}
                onChange={(e) => setEditing({ ...editing, [tier]: e.target.value })}
                placeholder={DEFAULT_TIER_NAMES[tier as keyof TierNames]}
                className="flex-1 input"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dugout-200 dark:border-dugout-700">
          <button
            onClick={onClose}
            className="btn-secondary btn-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary btn-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
