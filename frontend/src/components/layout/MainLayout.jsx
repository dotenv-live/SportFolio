import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    TrendingUp,
    Rocket,
    BriefcaseBusiness,
    Sparkles,
    Star,
    ArrowLeftRight,
    Search,
    Bell,
    Wallet,
    Menu,
    X,
    Lock,
    Bolt,
    Trophy
} from 'lucide-react';

const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Markets', path: '/markets', icon: TrendingUp },
    { name: 'IPO Zone', path: '/ipo', icon: Rocket },
    { name: 'My Portfolio', path: '/portfolio', icon: BriefcaseBusiness },
    { name: 'AI Scout', path: '/ai-scout', icon: Sparkles },
    { name: 'Watchlist', path: '/watchlist', icon: Star },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
];

export default function MainLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const location = useLocation();

    // Handle route change loading bar
    useEffect(() => {
        let startTimer = setTimeout(() => setIsNavigating(true), 0);
        let endTimer = setTimeout(() => setIsNavigating(false), 500);

        // Close mobile menu on route change
        let menuTimer = setTimeout(() => setIsMobileMenuOpen(false), 0);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(endTimer);
            clearTimeout(menuTimer);
        }
    }, [location.pathname]);

    const getPageTitle = () => {
        const item = navItems.find((nav) => nav.path === location.pathname);
        return item ? item.name : 'SportFolio';
    };

    return (
        <div className="min-h-screen bg-page text-text-primary flex">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* LEFT SIDEBAR */}
            <aside
                className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-border flex flex-col z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}
            >
                {/* Top: Logo section */}
                <div className="p-4 flex items-start justify-between lg:block">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
                                <Bolt className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight">SportFolio</span>
                        </div>
                        <div className="inline-block px-2 py-0.5 rounded bg-brand-light text-brand text-[10px] font-bold tracking-wider">
                            CRICKET BETA
                        </div>
                    </div>
                    <button
                        className="lg:hidden text-text-secondary hover:text-text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                end={item.path === '/'}
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={({ isActive }) => `
                                    flex items-center px-3 py-2.5 rounded-lg transition-colors relative
                                    ${isActive
                                        ? 'bg-brand-light text-brand font-medium'
                                        : 'text-text-secondary hover:bg-page hover:text-text-primary'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand rounded-r-md rounded-l-none" />
                                        )}
                                        <Icon size={18} className="mr-3 shrink-0" />
                                        <span className="text-sm">{item.name}</span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-border mt-auto mb-20">
                    {/* User Profile */}
                    <div className="flex items-center space-x-3 pt-2">
                        <div className="w-9 h-9 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm shrink-0">
                            AB
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate text-text-primary">Abhinav Bajpai</span>
                            <span className="text-xs text-gold font-medium">Pro Member</span>
                        </div>
                    </div>
                </div>

                {/* More Sports Coming Soon - Fixed/Sticky at Bottom */}
                <div className="absolute bottom-0 w-full p-4 bg-white border-t border-border">
                    <div className="bg-page rounded-xl p-4 border border-border/50 text-center">
                        <Trophy size={20} className="text-brand mx-auto mb-2 opacity-80" />
                        <h4 className="text-sm font-bold text-text-primary">More Sports</h4>
                        <p className="text-[10px] text-text-muted mt-1">Football & Tennis coming in Q3</p>
                    </div>
                </div>
            </aside>

            {/* RIGHT SIDE: Header & Main Box */}
            <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
                {/* TOP NAVBAR */}
                <header className="h-14 bg-white border-b border-border fixed top-0 right-0 left-0 lg:left-60 flex items-center px-4 justify-between z-30">

                    {/* Top Loading Bar */}
                    <div
                        className={`absolute top-0 left-0 h-[2px] bg-brand transition-all duration-300 ease-out z-50 ${isNavigating ? 'w-[75%] opacity-100' : 'w-full opacity-0'}`}
                    />

                    <div className="flex items-center">
                        <button
                            className="lg:hidden text-text-secondary hover:text-text-primary mr-3 p-1"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="font-bold text-lg text-text-primary hidden sm:block">
                            {getPageTitle()}
                        </h1>
                    </div>

                    <div className="flex-1 max-w-md px-4 hidden md:block">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search players..."
                                className="w-full bg-page border border-border rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
                        <button className="relative text-text-secondary hover:text-text-primary p-1.5">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-white"></span>
                        </button>

                        <div className="hidden sm:flex items-center bg-page border border-border rounded-lg px-3 py-1.5">
                            <Wallet size={16} className="text-text-secondary mr-2" />
                            <span className="text-sm font-semibold text-success tracking-tight">₹ 24,500</span>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs lg:hidden shrink-0">
                            AB
                        </div>
                    </div>
                </header>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 mt-14 p-4 sm:p-6 overflow-x-hidden min-h-[calc(100vh-3.5rem)] flex flex-col justify-between">
                    <div className="flex-1">
                        <Outlet />
                    </div>

                    {/* Global Footer */}
                    <footer className="mt-12 pt-6 pb-2 text-center text-[11px] text-text-muted border-t border-border/50">
                        SportFolio &middot; Cricket Beta &middot; AI-powered talent investing &middot; Not SEBI registered &middot; For demonstration purposes only
                    </footer>
                </main>
            </div>
        </div>
    );
}
