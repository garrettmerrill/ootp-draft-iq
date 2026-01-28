'use client';

import { Sparkles } from 'lucide-react';

export default function SleepersPage() {
  return (
    <div className="text-center py-12">
      <Sparkles className="w-12 h-12 mx-auto text-sleeper mb-4" />
      <h2 className="text-xl font-semibold text-dugout-900 dark:text-white">
        Sleeper Picks - Coming Soon
      </h2>
      <p className="text-dugout-500 dark:text-dugout-400 mt-2">
        Find undervalued prospects here
      </p>
    </div>
  );
}
