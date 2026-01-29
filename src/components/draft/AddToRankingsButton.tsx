'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TierNames, DEFAULT_TIER_NAMES } from '@/types';

interface AddToRankingsButtonProps {
  playerId: string;
  tierNames: TierNames;
  onAdd: (playerId: string, tier: number) => Promise<void>;
  disabled?: boolean;
  isInRankings?: boolean;
}

export function AddToRankingsButton({
  playerId,
  tierNames,
  onAdd,
  disabled = false,
  isInRankings = false,
}: AddToRankingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelect(tier: number) {
    setIsAdding(true);
    try {
      await onAdd(playerId, tier);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to add to rankings:', error);
    } finally {
      setIsAdding(false);
    }
  }

  if (isInRankings) {
    return (
      <div className="flex items-center gap-1 text-xs text-greenFlag">
        <span className="w-4 h-4 rounded-full bg-greenFlag/20 flex items-center justify-center">
          ✓
        </span>
        <span className="hidden sm:inline">Ranked</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={disabled || isAdding}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
          'bg-diamond-100 dark:bg-diamond-900/30 text-diamond-700 dark:text-diamond-400',
          'hover:bg-diamond-200 dark:hover:bg-diamond-900/50',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Add to My Rankings"
      >
        <Plus className="w-3 h-3" />
        <span className="hidden sm:inline">Add</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg shadow-lg border border-dugout-200 dark:border-dugout-700 bg-white dark:bg-dugout-900 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 text-xs text-dugout-500 dark:text-dugout-400 font-medium">
            Add to tier:
          </div>
          {[1, 2, 3, 4, 5].map((tier) => (
            <button
              key={tier}
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(tier);
              }}
              disabled={isAdding}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                'hover:bg-dugout-100 dark:hover:bg-dugout-800',
                'text-dugout-700 dark:text-dugout-300'
              )}
            >
              {tier} - {tierNames[tier as keyof TierNames] || DEFAULT_TIER_NAMES[tier as keyof TierNames]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
