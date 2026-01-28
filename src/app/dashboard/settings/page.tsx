'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="text-center py-12">
      <Settings className="w-12 h-12 mx-auto text-dugout-400 mb-4" />
      <h2 className="text-xl font-semibold text-dugout-900 dark:text-white">
        Settings - Coming Soon
      </h2>
      <p className="text-dugout-500 dark:text-dugout-400 mt-2">
        Manage your account settings here
      </p>
    </div>
  );
}
