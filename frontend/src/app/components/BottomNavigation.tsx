import { Link, useLocation } from 'react-router';

interface BottomNavigationProps {
  currentPage?: string;
}

export function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (page: string) => {
    if (currentPage) return currentPage === page;
    
    // Check if we're on the home page or any of its tabs
    if (page === 'home' && (currentPath === '/home' || currentPath === '/dashboard')) {
      return true;
    }
    
    // Check if we're on portfolio
    if (page === 'portfolio' && currentPath === '/portfolio') {
      return true;
    }
    
    // Check if we're on profile/investor
    if (page === 'investor' && (currentPath === '/investor' || currentPath === '/profile')) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/[0.08] px-4 py-3 safe-area-bottom z-40">
      <div className="flex items-center justify-around">
        <Link to="/home" className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg 
              className={`w-5 h-5 ${isActive('home') ? 'text-white' : 'text-neutral-500'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className={`text-[10px] ${isActive('home') ? 'text-white font-medium' : 'text-neutral-500'}`}>
            Home
          </span>
        </Link>

        <Link to="/portfolio" className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg 
              className={`w-5 h-5 ${isActive('portfolio') ? 'text-white' : 'text-neutral-500'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className={`text-[10px] ${isActive('portfolio') ? 'text-white font-medium' : 'text-neutral-500'}`}>
            Holdings
          </span>
        </Link>

        <Link to="/investor" className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 flex items-center justify-center">
            <svg 
              className={`w-5 h-5 ${isActive('investor') ? 'text-white' : 'text-neutral-500'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className={`text-[10px] ${isActive('investor') ? 'text-white font-medium' : 'text-neutral-500'}`}>
            Profile
          </span>
        </Link>
      </div>
    </div>
  );
}