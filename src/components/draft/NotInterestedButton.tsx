'use client';

import { useState } from 'react';
import { Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotInterestedButtonProps {
  playerId: string;
  isNotInterested: boolean;
  onToggle: (playerId: string, isNotInterested: boolean) => Promise<void>;
}

export function NotInterestedButton({
  playerId,
  isNotInterested,
  onToggle,
}: NotInterestedButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setIsUpdating(true);
    try {
      await onToggle(playerId, !isNotInterested);
    } catch (error) {
      console.error('Failed to update not interested status:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={cn(
        'p-1 rounded transition-colors',
        isNotInterested
          ? 'text-redFlag bg-redFlag/10 hover:bg-redFlag/20'
          : 'text-dugout-400 hover:text-dugout-600 dark:hover:text-dugout-300 hover:bg-dugout-100 dark:hover:bg-dugout-800',
        'disabled:opacity-50'
      )}
      title={isNotInterested ? 'Mark as interested' : 'Not interested'}
    >
      <Ban className="w-4 h-4" />
    </button>
  );
}
