import { Link } from 'react-router';
import { TrendingUp, Trophy } from 'lucide-react';

export default function UserTypeSelection() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      {/* Logo/Brand */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Sports Folio</h1>
        <p className="text-sm text-neutral-400">Performance-Backed Athlete Funding</p>
      </div>

      {/* Selection Cards */}
      <div className="w-full max-w-md space-y-4 mb-8">
        {/* Investor Card */}
        <Link to="/auth?type=investor">
          <div className="group relative bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-8 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            
            <div className="pr-16">
              <h2 className="text-2xl font-bold mb-2">I'm an Investor</h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Invest in emerging athletes through performance-based revenue sharing contracts
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-emerald-500 font-medium">
              <span>Get Started</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Athlete Card */}
        <Link to="/auth?type=athlete">
          <div className="group relative bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-8 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            
            <div className="pr-16">
              <h2 className="text-2xl font-bold mb-2">I'm an Athlete</h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Raise funds from supporters while maintaining ownership of your career and future
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-blue-500 font-medium">
              <span>Get Started</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-neutral-500 max-w-md">
        <p className="mb-4">By continuing, you agree to Sports Folio's Terms of Service and Privacy Policy</p>
        <div className="flex items-center justify-center gap-4">
          <a href="#" className="hover:text-white transition-colors">Help</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Support</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </div>
  );
}
