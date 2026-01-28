import Link from 'next/link';
import { 
  BarChart3, 
  Brain, 
  Upload, 
  Users, 
  Zap, 
  Target,
  TrendingUp,
  Shield
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dugout-950 via-dugout-900 to-dugout-950">
      {/* Header */}
      <header className="border-b border-dugout-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-diamond-500 to-diamond-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">OOTP Draft IQ</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-sm font-medium text-dugout-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="btn-primary btn-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-diamond-900/20 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Dominate Your
              <span className="block text-gradient">Fantasy Draft</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-dugout-300">
              Advanced analytics and intelligent rankings for OOTP Baseball drafts. 
              Upload your data, customize your strategy, and draft smarter than ever.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary btn-lg w-full sm:w-auto">
                Start Free
                <Zap className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-secondary btn-lg w-full sm:w-auto">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-dugout-800/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Everything You Need to Win</h2>
            <p className="mt-4 text-dugout-400">Powerful features designed for serious fantasy managers</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              icon={<Upload className="w-6 h-6" />}
              title="CSV Import"
              description="Upload your OOTP export data and we'll handle the rest. Auto-mapping and validation included."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6" />}
              title="Smart Rankings"
              description="Customize weights for every rating. College vs HS, power vs contact - your strategy, your rankings."
            />
            <FeatureCard 
              icon={<Target className="w-6 h-6" />}
              title="Sleeper Detection"
              description="Find undervalued gems the algorithm identifies as better than their raw ratings suggest."
            />
            <FeatureCard 
              icon={<TrendingUp className="w-6 h-6" />}
              title="Live Draft Sync"
              description="Connect to Stats Plus API for real-time draft updates. Track picks as they happen."
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6" />}
              title="Player Comparison"
              description="Side-by-side analysis of prospects. Save comparisons for quick reference during the draft."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="Risk Analysis"
              description="Red flags and green flags at a glance. Know who's safe and who's a gamble."
            />
            <FeatureCard 
              icon={<Brain className="w-6 h-6" />}
              title="Archetype Labels"
              description="Instantly identify player types: Ace Potential, Power Bat, Defensive SS, and more."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Natural Search"
              description='Just type "show me available SP with 65+ pot" and get instant results.'
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-dugout-800/50">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to Draft Smarter?</h2>
          <p className="mt-4 text-lg text-dugout-300">
            Join your league mates and start building your dynasty today.
          </p>
          <div className="mt-8">
            <Link href="/register" className="btn-primary btn-lg">
              Create Your Account
              <Zap className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dugout-800/50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-diamond-500 to-diamond-600 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-dugout-400">OOTP Draft IQ</span>
            </div>
            <p className="text-sm text-dugout-500">
              Built for OOTP Baseball fantasy leagues
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group relative rounded-2xl border border-dugout-800 bg-dugout-900/50 p-6 transition-all duration-300 hover:border-dugout-700 hover:bg-dugout-900">
      <div className="mb-4 inline-flex rounded-xl bg-diamond-900/50 p-3 text-diamond-400 group-hover:bg-diamond-900 group-hover:text-diamond-300 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-dugout-400">{description}</p>
    </div>
  );
}
