import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import { Rocket, Sparkles, Trophy } from 'lucide-react';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts';

// --- MOCK DATA ---
const marketMovers = [
    { id: 1, name: 'Arjun Sharma', price: 42.50, change: 8.2, trend: [20, 22, 28, 25, 34, 38, 42.5] },
    { id: 2, name: 'Priya Nair', price: 28.30, change: -2.1, trend: [32, 34, 30, 31, 29, 29.5, 28.3] },
    { id: 3, name: 'Rohit Verma', price: 61.00, change: 14.5, trend: [45, 48, 47, 52, 55, 58, 61.0] },
    { id: 4, name: 'Sneha Patel', price: 19.80, change: 3.3, trend: [17, 18, 17.5, 18.2, 18.9, 19.1, 19.8] },
    { id: 5, name: 'Karan Singh', price: 88.00, change: -5.6, trend: [95, 96, 92, 90, 89, 88.5, 88.0] }
];

const portfolioData = [
    { name: 'Rohit Verma', value: 45000, color: '#5C41F5' },
    { name: 'Arjun Sharma', value: 25000, color: '#00B386' },
    { name: 'Priya Nair', value: 8000, color: '#F5A623' },
    { name: 'Karan Singh', value: 5000, color: '#EB5757' },
    { name: 'Sneha Patel', value: 2000, color: '#8B7FFF' }
];

const upcomingIPOs = [
    { id: 1, name: 'Vikram Thakur', opens: '14 Oct 2025', range: '₹32 - ₹38', interest: 87 },
    { id: 2, name: 'Neha Gupta', opens: '18 Oct 2025', range: '₹24 - ₹28', interest: 64 },
];

const aiPicks = [
    { id: 1, name: 'Aryan Das', score: 94, reason: 'Exceptional domestic record, high burst potential', trend: 'up' },
    { id: 2, name: 'Sameer Khan', score: 91, reason: 'High consistency index, age 19, trending upward', trend: 'up' },
    { id: 3, name: 'Ankita Rao', score: 86, reason: 'Strong recovery metrics post-injury', trend: 'neutral' },
];

export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* SECTION 1: PORTFOLIO SUMMARY */}
            <Card noPadding className="border-l-[4px] border-l-brand overflow-hidden">
                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">

                    <div className="flex-1 p-5">
                        <span className="text-text-secondary text-xs uppercase tracking-wide font-medium block mb-1">
                            Total Value
                        </span>
                        <div className="text-2xl font-bold text-text-primary">
                            ₹1,24,500
                        </div>
                    </div>

                    <div className="flex-1 p-5">
                        <span className="text-text-secondary text-xs uppercase tracking-wide font-medium block mb-1">
                            Invested
                        </span>
                        <div className="text-2xl font-bold text-text-primary">
                            ₹85,000
                        </div>
                    </div>

                    <div className="flex-1 p-5">
                        <span className="text-text-secondary text-xs uppercase tracking-wide font-medium block mb-1">
                            Total Returns
                        </span>
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-success">
                                +₹39,500
                            </span>
                            <Badge variant="success" className="text-[10px]">+46.4%</Badge>
                        </div>
                    </div>

                    <div className="flex-1 p-5">
                        <span className="text-text-secondary text-xs uppercase tracking-wide font-medium block mb-1">
                            Today's P&L
                        </span>
                        <div className="text-2xl font-bold text-success">
                            +₹3,240
                        </div>
                    </div>

                    <div className="flex-1 p-5">
                        <span className="text-text-secondary text-xs uppercase tracking-wide font-medium block mb-1">
                            Holdings
                        </span>
                        <div className="text-2xl font-bold text-text-primary">
                            7 <span className="text-base text-text-secondary font-medium ml-1">Players</span>
                        </div>
                    </div>

                </div>
            </Card>

            {/* SECTION 2: TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* LEFT COLUMN: Market Movers (65%) */}
                <div className="lg:col-span-2 space-y-5">
                    <Card className="h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-text-primary">Market Movers</h2>
                            <div className="flex items-center space-x-2 bg-success-light px-2.5 py-1 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                </span>
                                <span className="text-xs font-semibold text-success">Live</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border bg-page text-text-muted text-xs uppercase tracking-wide">
                                        <th className="pb-3 font-medium">Player</th>
                                        <th className="pb-3 font-medium text-right">Current Price</th>
                                        <th className="pb-3 font-medium text-right">Change</th>
                                        <th className="pb-3 font-medium text-center">7D Chart</th>
                                        <th className="pb-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {marketMovers.map((player) => {
                                        const isPositive = player.change >= 0;
                                        const chartData = player.trend.map((val, i) => ({ value: val, index: i }));

                                        return (
                                            <tr key={player.id} className="hover:bg-page transition-colors">
                                                <td className="py-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs shrink-0">
                                                            {player.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm text-text-primary">{player.name}</div>
                                                            <div className="text-xs text-text-muted">Cricketer</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right font-semibold text-sm text-text-primary">
                                                    ₹{player.price.toFixed(2)}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Badge variant={isPositive ? 'success' : 'danger'}>
                                                        {isPositive ? '▲ ' : '▼ '}{Math.abs(player.change)}%
                                                    </Badge>
                                                </td>
                                                <td className="py-3 w-28">
                                                    <div className="h-9 w-20 mx-auto">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={chartData}>
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="value"
                                                                    stroke={isPositive ? '#00B386' : '#EB5757'}
                                                                    strokeWidth={2}
                                                                    dot={false}
                                                                    isAnimationActive={false}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Button variant="outline" size="sm" className="h-8 py-0 px-3 text-xs">
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
                </div>

                {/* RIGHT COLUMN: My Portfolio (35%) */}
                <div className="space-y-5">
                    <Card className="h-full flex flex-col">
                        <h2 className="text-lg font-bold text-text-primary mb-6">My Portfolio</h2>

                        <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                            <div className="h-44 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={portfolioData}
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {portfolioData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center text overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs text-text-secondary font-medium">Total</span>
                                    <span className="text-sm font-bold text-text-primary">7 Assets</span>
                                </div>
                            </div>

                            {/* Custom Legend */}
                            <div className="w-full mt-4 space-y-2.5">
                                {portfolioData.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-text-secondary truncate max-w-[120px]">{item.name}</span>
                                        </div>
                                        <span className="font-semibold text-text-primary">
                                            ₹{(item.value).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between p-3 bg-gold-light rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="p-1.5 bg-gold/20 rounded-md">
                                    <Trophy size={16} className="text-gold" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Top Performer</div>
                                    <div className="text-sm font-bold text-text-primary">Rohit Verma</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-success">+68.4%</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* SECTION 3: BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* IPOs */}
                <Card>
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center space-x-2">
                            <Rocket size={20} className="text-brand" />
                            <h2 className="text-lg font-bold text-text-primary">Upcoming IPOs</h2>
                        </div>
                    </div>

                    <div className="divide-y divide-border">
                        {upcomingIPOs.map((ipo) => (
                            <div key={ipo.id} className="py-4 first:pt-0 last:pb-0">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className="font-bold text-text-primary">{ipo.name}</span>
                                            <Badge variant="neutral" className="text-[10px]">Cricketer</Badge>
                                        </div>
                                        <div className="text-xs text-text-secondary">
                                            Opens: <span className="font-medium text-text-primary">{ipo.opens}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-text-secondary mb-1">Expected Range</div>
                                        <div className="font-semibold text-sm text-text-primary">{ipo.range}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 space-x-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-text-muted">Demand Interest</span>
                                            <span className="font-bold text-brand">{ipo.interest}%</span>
                                        </div>
                                        <ProgressBar value={ipo.interest} colorClass="bg-brand" className="h-[4px]" />
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 px-3 py-0 text-xs shrink-0">
                                        Notify Me
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* AI Scout */}
                <Card>
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center space-x-2">
                            <Sparkles size={20} className="text-brand" />
                            <h2 className="text-lg font-bold text-text-primary">AI Scout Picks</h2>
                        </div>
                        <span className="text-xs font-semibold text-brand px-2 py-0.5 bg-brand-light rounded">
                            Powered by AI
                        </span>
                    </div>

                    <div className="divide-y divide-border">
                        {aiPicks.map((pick) => (
                            <div key={pick.id} className="py-3.5 first:pt-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-text-primary">{pick.name}</span>
                                    <div className="text-right text-brand font-bold text-sm">
                                        Score: {pick.score}
                                    </div>
                                </div>
                                <p className="text-xs text-text-secondary mb-2.5 line-clamp-1">
                                    {pick.reason}
                                </p>
                                <ProgressBar value={pick.score} colorClass="bg-brand" className="h-[3px]" />
                            </div>
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    );
}
