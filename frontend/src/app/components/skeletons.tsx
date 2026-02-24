/**
 * Skeleton loading components for each major page section.
 * Uses the existing Skeleton primitive from ui/skeleton.tsx.
 */
import { Skeleton } from './ui/skeleton';

// ─── Dashboard / Home ────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Portfolio Value */}
      <div className="px-4 py-6 border-b border-white/[0.08]">
        <Skeleton className="h-3 w-24 bg-white/[0.06] mb-3" />
        <Skeleton className="h-10 w-48 bg-white/[0.06] mb-2" />
        <Skeleton className="h-4 w-32 bg-white/[0.06]" />
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
              <Skeleton className="h-3 w-14 bg-white/[0.06] mb-2" />
              <Skeleton className="h-5 w-20 bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>

      {/* Holdings */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-16 bg-white/[0.06]" />
          <Skeleton className="h-3 w-12 bg-white/[0.06]" />
        </div>
        {[1, 2, 3].map((i) => (
          <HoldingRowSkeleton key={i} />
        ))}
      </div>

      {/* Trending */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-28 bg-white/[0.06]" />
          <Skeleton className="h-3 w-12 bg-white/[0.06]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <AthleteCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Athlete Marketplace ─────────────────────────────────────────────

export function MarketplaceSkeleton() {
  return (
    <div className="py-4 animate-in fade-in duration-300">
      {[1, 2, 3].map((section) => (
        <div key={section} className="mb-6">
          <div className="px-4 mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-32 bg-white/[0.06]" />
            <Skeleton className="h-3 w-16 bg-white/[0.06]" />
          </div>
          <div className="flex gap-3 overflow-hidden px-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[140px] bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-3 flex-shrink-0"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06]" />
                  <Skeleton className="h-3 w-16 bg-white/[0.06]" />
                </div>
                <Skeleton className="h-5 w-20 bg-white/[0.06] mb-2" />
                <Skeleton className="h-3 w-12 bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Portfolio ───────────────────────────────────────────────────────

export function PortfolioSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Summary Card */}
      <div className="px-4 py-4">
        <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
          <Skeleton className="h-3 w-20 bg-white/[0.06] mb-2" />
          <Skeleton className="h-8 w-40 bg-white/[0.06] mb-4" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 bg-white/[0.06]" />
              <Skeleton className="h-3 w-28 bg-white/[0.06]" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 bg-white/[0.06]" />
              <Skeleton className="h-3 w-24 bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      <div className="px-4 pb-4">
        {[1, 2, 3, 4].map((i) => (
          <HoldingRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Athlete Detail ──────────────────────────────────────────────────

export function AthleteDetailSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06]" />
            <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Price Header */}
      <div className="px-4 py-6">
        <div className="flex items-start gap-3 mb-4">
          <Skeleton className="w-12 h-12 rounded-xl bg-white/[0.06]" />
          <div className="flex-1">
            <Skeleton className="h-6 w-40 bg-white/[0.06] mb-1" />
            <Skeleton className="h-4 w-28 bg-white/[0.06]" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 bg-white/[0.06] mb-2" />
        <Skeleton className="h-4 w-48 bg-white/[0.06]" />
      </div>

      {/* Chart */}
      <div className="px-4 pb-4">
        <Skeleton className="h-64 w-full rounded-xl bg-white/[0.06] mb-3" />
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-14 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2 border-b border-white/[0.08]">
        <div className="flex gap-6 pb-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-16 bg-white/[0.06]" />
          ))}
        </div>
      </div>

      {/* Performance section */}
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 bg-white/[0.06] mb-1" />
              <Skeleton className="h-5 w-20 bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared pieces ───────────────────────────────────────────────────

export function HoldingRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="w-10 h-10 rounded-lg bg-white/[0.06] flex-shrink-0" />
        <div>
          <Skeleton className="h-4 w-24 bg-white/[0.06] mb-1" />
          <Skeleton className="h-3 w-16 bg-white/[0.06]" />
        </div>
      </div>
      <Skeleton className="w-[60px] h-6 bg-white/[0.06] mx-3" />
      <div className="text-right">
        <Skeleton className="h-4 w-16 bg-white/[0.06] mb-1 ml-auto" />
        <Skeleton className="h-3 w-12 bg-white/[0.06] ml-auto" />
      </div>
    </div>
  );
}

export function AthleteCardSkeleton() {
  return (
    <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06]" />
        <Skeleton className="h-3 w-16 bg-white/[0.06]" />
      </div>
      <Skeleton className="h-5 w-20 bg-white/[0.06] mb-1" />
      <Skeleton className="h-3 w-12 bg-white/[0.06]" />
    </div>
  );
}

// ─── Admin pages ─────────────────────────────────────────────────────

export function AdminSkeleton() {
  return (
    <div className="px-4 py-4 space-y-4 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
            <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06] mb-2" />
            <Skeleton className="h-7 w-16 bg-white/[0.06] mb-1" />
            <Skeleton className="h-3 w-20 bg-white/[0.06] mb-2" />
            <Skeleton className="h-3 w-24 bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-2xl p-4">
        <Skeleton className="h-4 w-32 bg-white/[0.06] mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <Skeleton className="w-10 h-8 bg-white/[0.06]" />
            <Skeleton className="flex-1 h-8 bg-white/[0.06] rounded-lg" />
            <Skeleton className="w-16 h-4 bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics ───────────────────────────────────────────────────────

export function AnalyticsSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="px-4 py-6">
        <Skeleton className="h-3 w-20 bg-white/[0.06] mb-2" />
        <Skeleton className="h-10 w-48 bg-white/[0.06] mb-6" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl p-3">
              <Skeleton className="h-3 w-14 bg-white/[0.06] mb-1" />
              <Skeleton className="h-5 w-16 bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 pb-6">
        <Skeleton className="h-[220px] w-full rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white pb-24 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16 bg-white/[0.06]" />
          <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06]" />
        </div>
      </div>

      {/* Profile Avatar + Name */}
      <div className="px-4 py-8 border-b border-white/[0.08]">
        <div className="flex flex-col items-center">
          <Skeleton className="w-32 h-32 rounded-full bg-white/[0.06] mb-6" />
          <Skeleton className="h-7 w-40 bg-white/[0.06] mb-2" />
          <Skeleton className="h-4 w-48 bg-white/[0.06]" />
        </div>
      </div>

      {/* Wallet Balance Card */}
      <div className="px-4 py-4 border-b border-white/[0.08]">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded bg-emerald-500/20" />
              <Skeleton className="h-3 w-24 bg-white/[0.06]" />
            </div>
            <Skeleton className="w-4 h-4 rounded bg-white/[0.06]" />
          </div>
          <Skeleton className="h-9 w-36 bg-white/[0.06] mb-4" />
          <div className="flex items-center gap-2">
            <Skeleton className="flex-1 h-10 rounded-xl bg-emerald-500/20" />
            <Skeleton className="flex-1 h-10 rounded-xl bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-white/[0.05]">
            <Skeleton className="w-5 h-5 rounded bg-white/[0.06]" />
            <Skeleton className="h-4 flex-1 bg-white/[0.06]" style={{ maxWidth: `${100 + i * 15}px` }} />
            <Skeleton className="w-4 h-4 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

