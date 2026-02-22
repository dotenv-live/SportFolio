import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Tag from '../ui/Tag';
import { LayoutGrid, List, Star, ChevronDown, ArrowUpDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// --- MOCK DATA ---
const players = [
    {
        id: 1,
        name: 'Arjun Sharma',
        role: 'Batsman',
        region: 'Maharashtra',
        price: 42.50,
        change24h: 8.2,
        change7d: 15.4,
        marketCap: '₹14.2Cr',
        shareholders: '12,450',
        volume: '2.1L',
        watchlist: true,
        trend: [34, 35, 33, 36, 38, 40, 42.5]
    },
    {
        id: 2,
        name: 'Rohit Verma',
        role: 'All-rounder',
        region: 'Delhi',
        price: 61.00,
        change24h: 14.5,
        change7d: 22.1,
        marketCap: '₹22.5Cr',
        shareholders: '18,200',
        volume: '5.4L',
        watchlist: false,
        trend: [48, 50, 49, 53, 55, 58, 61.0]
    },
    {
        id: 3,
        name: 'Priya Nair',
        role: 'Bowler',
        region: 'Kerala',
        price: 28.30,
        change24h: -2.1,
        change7d: -5.4,
        marketCap: '₹8.4Cr',
        shareholders: '5,120',
        volume: '85K',
        watchlist: true,
        trend: [32, 31, 31.5, 30, 29, 29.5, 28.3]
    },
    {
        id: 4,
        name: 'Karan Singh',
        role: 'Wicketkeeper',
        region: 'Punjab',
        price: 88.00,
        change24h: -5.6,
        change7d: 1.2,
        marketCap: '₹35.1Cr',
        shareholders: '24,050',
        volume: '8.2L',
        watchlist: false,
        trend: [86, 88, 92, 94, 91, 89, 88.0]
    },
    {
        id: 5,
        name: 'Sneha Patel',
        role: 'Batsman',
        region: 'Gujarat',
        price: 19.80,
        change24h: 3.3,
        change7d: 8.7,
        marketCap: '₹4.2Cr',
        shareholders: '3,840',
        volume: '1.2L',
        watchlist: false,
        trend: [18, 18.5, 18.2, 19, 19.4, 19.1, 19.8]
    },
    {
        id: 6,
        name: 'Vikram Thakur',
        role: 'All-rounder',
        region: 'Himachal',
        price: 34.20,
        change24h: 1.5,
        change7d: -2.3,
        marketCap: '₹9.8Cr',
        shareholders: '7,450',
        volume: '2.5L',
        watchlist: true,
        trend: [35, 34.5, 35.2, 33.8, 34, 33.5, 34.2]
    },
    {
        id: 7,
        name: 'Neha Gupta',
        role: 'Bowler',
        region: 'UP',
        price: 24.50,
        change24h: 6.8,
        change7d: 12.4,
        marketCap: '₹6.5Cr',
        shareholders: '4,210',
        volume: '1.8L',
        watchlist: false,
        trend: [21, 22, 21.5, 23, 23.5, 24, 24.5]
    },
    {
        id: 8,
        name: 'Rahul Desai',
        role: 'Batsman',
        region: 'Karnataka',
        price: 55.40,
        change24h: -1.2,
        change7d: 4.5,
        marketCap: '₹18.6Cr',
        shareholders: '15,600',
        volume: '4.7L',
        watchlist: false,
        trend: [52, 53, 54, 56, 55, 56.5, 55.4]
    },
    {
        id: 9,
        name: 'Aisha Khan',
        role: 'All-rounder',
        region: 'Bengal',
        price: 41.90,
        change24h: 0.5,
        change7d: -1.8,
        marketCap: '₹12.3Cr',
        shareholders: '9,820',
        volume: '3.1L',
        watchlist: true,
        trend: [43, 42.5, 42, 41.5, 42.2, 41.8, 41.9]
    }
];

export default function Markets() {
    const [view, setView] = useState('grid'); // 'grid' or 'list'

    const sportPills = [
        { name: 'Cricket', icon: '🏏', active: true },
        { name: 'Football', icon: '⚽', locked: true },
        { name: 'Badminton', icon: '🏸', locked: true },
        { name: 'Tennis', icon: '🎾', locked: true },
    ];

    return (
        <div className="pb-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-1">Markets</h1>
                    <p className="text-text-secondary text-sm">Invest in India's rising cricket talent</p>
                </div>
                <button className="text-brand text-sm font-medium hover:text-brand-dark mt-3 md:mt-0 transition-colors">
                    More sports coming soon &rarr;
                </button>
            </div>

            {/* FILTER & CONTROLS BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">

                {/* Left: Sport filters */}
                <div className="flex space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    {sportPills.map((sport) => (
                        <button
                            key={sport.name}
                            disabled={sport.locked}
                            className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${sport.active
                                ? 'bg-brand text-white'
                                : 'bg-page border border-border text-text-muted cursor-not-allowed opacity-60'
                                }`}
                        >
                            <span className="mr-1.5">{sport.icon}</span>
                            {sport.name}
                            {sport.locked && <span className="ml-1.5 text-xs">🔒</span>}
                        </button>
                    ))}
                </div>

                {/* Right: Controls */}
                <div className="flex items-center space-x-3 shrink-0">
                    <div className="relative">
                        <select className="appearance-none bg-white border border-border text-text-secondary text-sm rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand cursor-pointer">
                            <option>Top Gainers</option>
                            <option>Top Losers</option>
                            <option>Market Cap</option>
                            <option>Newest</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>

                    <div className="flex bg-white border border-border rounded-lg p-0.5">
                        <button
                            onClick={() => setView('grid')}
                            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-page text-brand shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-page text-brand shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            {view === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => {
                        const isPositive = player.change24h >= 0;
                        const strokeColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';
                        const chartData = player.trend.map((val, i) => ({ value: val, index: i }));

                        return (
                            <div
                                key={player.id}
                                className="bg-white rounded-xl border border-border p-4 transition-all duration-200 hover:border-brand hover:shadow-md group flex flex-col"
                            >
                                {/* Top Row */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm shrink-0">
                                            {player.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-base text-text-primary leading-tight">{player.name}</h3>
                                            <p className="text-xs text-text-muted mt-0.5">{player.role} &middot; {player.region}</p>
                                        </div>
                                    </div>
                                    <button className={`p-1 ${player.watchlist ? 'text-gold' : 'text-text-muted hover:text-text-secondary'}`}>
                                        <Star size={18} fill={player.watchlist ? 'currentColor' : 'none'} />
                                    </button>
                                </div>

                                <div className="mb-2">
                                    <Tag className="!text-[10px]">Cricket</Tag>
                                </div>

                                {/* Price Row */}
                                <div className="flex justify-between items-end mt-1 mb-3">
                                    <div className="text-xl font-bold text-text-primary">
                                        ₹{player.price.toFixed(2)}
                                    </div>
                                    <Badge variant={isPositive ? 'success' : 'danger'}>
                                        {isPositive ? '▲ ' : '▼ '}{Math.abs(player.change24h)}%
                                    </Badge>
                                </div>

                                {/* Sparkline */}
                                <div className="h-[60px] w-full mt-2 mb-4 -mx-2 px-2 overflow-hidden">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                            {/* Flat fill override using generic CSS classes mapped to our theme */}
                                            <defs>
                                                <linearGradient id={`gradient-${player.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={isPositive ? 'var(--color-success-light)' : 'var(--color-danger-light)'} stopOpacity={1} />
                                                    <stop offset="100%" stopColor={isPositive ? 'var(--color-success-light)' : 'var(--color-danger-light)'} stopOpacity={1} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke={strokeColor}
                                                strokeWidth={2}
                                                fill={`url(#gradient-${player.id})`}
                                                isAnimationActive={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Stats Row */}
                                <div className="flex justify-between text-[11px] mb-4 mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-text-muted mb-0.5">Mkt Cap</span>
                                        <span className="text-text-secondary font-medium">{player.marketCap}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-text-muted mb-0.5">Shareholders</span>
                                        <span className="text-text-secondary font-medium">{player.shareholders}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-text-muted mb-0.5">Vol</span>
                                        <span className="text-text-secondary font-medium">{player.volume}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex space-x-2 w-full mt-auto">
                                    <Button variant="primary" size="sm" className="flex-1">Trade</Button>
                                    <Button variant="outline" size="sm" className="flex-1">Profile</Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* LIST VIEW */
                <Card noPadding className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-page border-b border-border text-text-muted text-xs uppercase tracking-wide">
                                    <th className="px-4 py-3 font-medium cursor-pointer hover:bg-page transition-colors group">
                                        <div className="flex items-center">
                                            Player <ArrowUpDown size={12} className="ml-1 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium text-right cursor-pointer hover:bg-page transition-colors group">
                                        <div className="flex items-center justify-end">
                                            Price <ArrowUpDown size={12} className="ml-1 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 font-medium text-right">24h</th>
                                    <th className="px-4 py-3 font-medium text-right">7d</th>
                                    <th className="px-4 py-3 font-medium text-right">Mkt Cap</th>
                                    <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Shareholders</th>
                                    <th className="px-4 py-3 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {players.map((player, idx) => {
                                    const isPos24 = player.change24h >= 0;
                                    const isPos7d = player.change7d >= 0;

                                    return (
                                        <tr
                                            key={player.id}
                                            className={`border-b border-border transition-colors hover:bg-brand-light/20 ${idx % 2 === 0 ? 'bg-white' : 'bg-page/50'}`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <button className={`p-1 -ml-1 ${player.watchlist ? 'text-gold' : 'text-text-muted hover:text-text-secondary'}`}>
                                                        <Star size={14} fill={player.watchlist ? 'currentColor' : 'none'} />
                                                    </button>
                                                    <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs shrink-0">
                                                        {player.name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="font-semibold text-sm text-text-primary whitespace-nowrap">{player.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-secondary">
                                                {player.role}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-sm text-text-primary whitespace-nowrap">
                                                ₹{player.price.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-sm font-medium ${isPos24 ? 'text-success' : 'text-danger'} whitespace-nowrap`}>
                                                    {isPos24 ? '+' : ''}{player.change24h}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-sm font-medium ${isPos7d ? 'text-success' : 'text-danger'} whitespace-nowrap`}>
                                                    {isPos7d ? '+' : ''}{player.change7d}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-text-secondary whitespace-nowrap">
                                                {player.marketCap}
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-text-secondary hidden lg:table-cell whitespace-nowrap">
                                                {player.shareholders}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="outline" size="sm" className="h-8 py-0 px-3 text-xs w-full lg:w-auto">
                                                    Trade
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}
