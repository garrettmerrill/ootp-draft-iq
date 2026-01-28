'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  Settings2,
  Target,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  // TODO: Fetch actual stats from database
  const hasUploadedData = false;
  const playerCount = 0;
  const draftedCount = 0;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-dugout-900 dark:text-white">
          Welcome back, {session.user?.name}!
        </h1>
        <p className="text-dugout-500 dark:text-dugout-400 mt-1">
          Here&apos;s an overview of your draft preparation
        </p>
      </div>

      {/* Getting started checklist */}
      {!hasUploadedData && (
        <div className="card p-6 border-l-4 border-l-sleeper">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-sleeper/10">
              <AlertCircle className="w-6 h-6 text-sleeper" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-dugout-900 dark:text-white">
                Get Started
              </h2>
              <p className="text-sm text-dugout-500 dark:text-dugout-400 mt-1">
                Upload your OOTP draft data to start analyzing prospects
              </p>
              <Link
                href="/dashboard/upload"
                className="btn-primary btn-sm mt-4 inline-flex"
              >
                <Upload className="w-4 h-4" />
                Upload CSV
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Prospects"
          value={playerCount}
          description="Players in your database"
          icon={<FileSpreadsheet className="w-5 h-5" />}
        />
        <StatCard
          title="Available"
          value={playerCount - draftedCount}
          description="Still on the board"
          icon={<Target className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Drafted"
          value={draftedCount}
          description="Already selected"
          icon={<AlertCircle className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          title="Sleepers"
          value={0}
          description="Undervalued prospects"
          icon={<Sparkles className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-dugout-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="Upload Data"
            description="Import your OOTP CSV export"
            href="/dashboard/upload"
            icon={<Upload className="w-6 h-6" />}
          />
          <ActionCard
            title="Set Philosophy"
            description="Customize your draft preferences"
            href="/dashboard/philosophy"
            icon={<Settings2 className="w-6 h-6" />}
          />
          <ActionCard
            title="View Draft Board"
            description="See your personalized rankings"
            href="/dashboard/draft"
            icon={<Target className="w-6 h-6" />}
          />
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-dugout-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="card p-8 text-center">
          <p className="text-dugout-500 dark:text-dugout-400">
            No recent activity. Upload your data to get started!
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  color = 'default',
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color?: 'default' | 'green' | 'yellow' | 'orange';
}) {
  const colorClasses = {
    default: 'bg-dugout-100 dark:bg-dugout-800 text-dugout-600 dark:text-dugout-400',
    green: 'bg-greenFlag/10 text-greenFlag',
    yellow: 'bg-elite/10 text-elite',
    orange: 'bg-sleeper/10 text-sleeper',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-dugout-500 dark:text-dugout-400">{title}</p>
          <p className="text-2xl font-bold text-dugout-900 dark:text-white">{value}</p>
        </div>
      </div>
      <p className="text-xs text-dugout-400 dark:text-dugout-500 mt-2">{description}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="card-hover p-5 group">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-diamond-100 dark:bg-diamond-900/50 text-diamond-600 dark:text-diamond-400">
          {icon}
        </div>
        <ArrowRight className="w-5 h-5 text-dugout-300 dark:text-dugout-600 group-hover:text-diamond-500 transition-colors" />
      </div>
      <h3 className="font-semibold text-dugout-900 dark:text-white mt-4">{title}</h3>
      <p className="text-sm text-dugout-500 dark:text-dugout-400 mt-1">{description}</p>
    </Link>
  );
}
