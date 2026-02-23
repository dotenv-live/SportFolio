import { Link } from 'react-router';
import { ArrowLeft, Bell, Settings, Search } from 'lucide-react';
import { mockUser } from '../data/mockData';

export default function Profile() {
  const joiningDate = new Date(mockUser.joinedAt);
  const monthYear = joiningDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  const balance = 7340; // Mock balance

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-base">Sports Folio</span>
          <div className="flex items-center gap-2">
            <Link to="/marketplace">
              <button className="w-8 h-8 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/investor">
              <button className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-semibold text-sm">
                {mockUser.name.charAt(0)}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-8 border-b border-white/[0.08]">
        <div className="flex flex-col items-center">
          {/* Avatar with circular text */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-5xl font-bold text-white">
                {mockUser.name.charAt(0)}
              </span>
            </div>
            {/* Circular text */}
            <svg className="absolute inset-0 w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <defs>
                <path
                  id="circlePath"
                  d="M 64, 64 m -56, 0 a 56,56 0 1,1 112,0 a 56,56 0 1,1 -112,0"
                />
              </defs>
              <text fill="#737373" fontSize="9" fontWeight="500" letterSpacing="2">
                <textPath href="#circlePath" startOffset="0%">
                  GROWING SINCE {monthYear}
                </textPath>
              </text>
            </svg>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold mb-1">{mockUser.name}</h1>
        </div>
      </div>

      {/* Balance Section */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1a1a1a] border border-white/[0.08] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold">₹{balance.toLocaleString()}</div>
              <div className="text-xs text-neutral-500">Athletes, Investment balance</div>
            </div>
          </div>
          <button className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm font-medium border border-emerald-500/20 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add money
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-2">
        <MenuItem 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Orders"
        />
        <MenuItem 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          label="Account details"
        />
        <MenuItem 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          }
          label="Bank & AutoPay"
        />
        <MenuItem 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          label="Customer support 24x7"
        />
        <MenuItem 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Reports"
        />
        <MenuItem 
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          label="Refer & Invite"
        />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom">
        <div className="flex items-center justify-around">
          <Link to="/dashboard" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-[10px] text-neutral-500">Home</span>
          </Link>
          <Link to="/marketplace" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-[10px] text-neutral-500">Explore</span>
          </Link>
          <Link to="/portfolio" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-[10px] text-neutral-500">Holdings</span>
          </Link>
          <Link to="/investor" className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] text-white font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="w-full flex items-center gap-4 py-4 border-b border-white/[0.05] active:bg-[#1a1a1a]/50 transition-colors">
      <div className="text-neutral-400">
        {icon}
      </div>
      <span className="text-base flex-1 text-left">{label}</span>
      <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}