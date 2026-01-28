'use client';

import { BarChart3 } from 'lucide-react';

export default function ScarcityPage() {
  return (
    <div className="text-center py-12">
      <BarChart3 className="w-12 h-12 mx-auto text-dugout-400 mb-4" />
      <h2 className="text-xl font-semibold text-dugout-900 dark:text-white">
        Position Scarcity - Coming Soon
      </h2>
      <p className="text-dugout-500 dark:text-dugout-400 mt-2">
        Track remaining players by position and tier
      </p>
    </div>
  );
}
