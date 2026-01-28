'use client';

import { Users } from 'lucide-react';

export default function ComparePage() {
  return (
    <div className="text-center py-12">
      <Users className="w-12 h-12 mx-auto text-dugout-400 mb-4" />
      <h2 className="text-xl font-semibold text-dugout-900 dark:text-white">
        Player Comparison - Coming Soon
      </h2>
      <p className="text-dugout-500 dark:text-dugout-400 mt-2">
        Compare players side-by-side here
      </p>
    </div>
  );
}
