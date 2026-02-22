import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Tag from '../ui/Tag';
import StatBox from '../ui/StatBox';
import ProgressBar from '../ui/ProgressBar';
import { ChevronRight, Sparkles, Minus, Plus } from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// --- MOCK DATA ---
const playerData = {
    id: '1',
    name: 'Arjun Sharma',
    role: 'Right-handed Batsman',
    team: 'Mumbai Indians',
    region: 'Maharashtra',
    price: 42.50,
    change: 8.2,
    age: 22,
    matches: 134,
    avg: 48.3,
    sr: 142.5,
    ranking: '#12 U-25',
};

const chartData = [
    { time: '10:00', price: 38.0, volume: 1200 },
    { time: '11:00', price: 38.5, volume: 1500 },
    { time: '12:00', price: 39.2, volume: 800 },
    { time: '13:00', price: 38.8, volume: 2200 },
    { time: '14:00', price: 40.5, volume: 3100 },
    { time: '15:00', price: 41.8, volume: 4500 },
    { time: '16:00', price: 42.5, volume: 5200 },
];

const careerData = [
    { year: '2019', runs: 450 },
    { year: '2020', runs: 520 },
    { year: '2021', runs: 310 },
    { year: '2022', runs: 850 },
    { year: '2023', runs: 1120 },
    { year: '2024', runs: 980 },
];

const dividends = [
    { date: '12 Oct 2025', event: 'Q3 Performace Bonus', perShare: '₹1.50', total: '₹450', status: 'Upcoming' },
    { date: '05 Sep 2025', event: 'Man of the Match', perShare: '₹0.50', total: '₹150', status: 'Paid' },
    { date: '21 Jul 2025', event: 'Series Win Bonus', perShare: '₹2.10', total: '₹630', status: 'Paid' },
    { date: '15 May 2025', event: 'IPL Playoff Q', perShare: '₹3.00', total: '₹900', status: 'Paid' },
    { date: '10 Feb 2025', event: 'Annual Dividend', perShare: '₹5.50', total: '₹1650', status: 'Paid' },
];

const orderBook = {
    bids: [
        { price: 42.45, qty: 1500 },
        { price: 42.40, qty: 3200 },
        { price: 42.35, qty: 850 },
        { price: 42.30, qty: 5000 },
        { price: 42.20, qty: 12000 },
    ],
    asks: [
        { price: 42.55, qty: 800 },
        { price: 42.60, qty: 2100 },
        { price: 42.65, qty: 450 },
        { price: 42.70, qty: 3800 },
        { price: 42.80, qty: 9500 },
    ]
};

// Custom Tooltip for AreaChart
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-border rounded-lg shadow-lg p-3">
                <p className="font-bold text-text-primary mb-1">₹{payload[0].value.toFixed(2)}</p>
                <p className="text-xs text-text-muted">{label}</p>
            </div>
        );
    }
    return null;
};

export default function PlayerProfile() {
    // State for tabs and trading panel
    const [timeTab, setTimeTab] = useState('1D');
    const [statsTab, setStatsTab] = useState('Overview');
    const [tradeMode, setTradeMode] = useState('BUY'); // 'BUY' or 'SELL'
    const [orderType, setOrderType] = useState('Market'); // 'Market', 'Limit', 'SL'
    const [quantity, setQuantity] = useState(10);
    const [limitPrice, setLimitPrice] = useState(playerData.price);

    const isPositive = playerData.change >= 0;

    // Trade calcs
    const TradePrice = orderType === 'Market' ? playerData.price : limitPrice;
    const grossTotal = quantity * TradePrice;
    const fee = grossTotal * 0.005; // 0.5% fee
    const netTotal = grossTotal + fee;

    return (
        <div className="max-w-[1400px] mx-auto pb-8">
            {/* 1. BREADCRUMB */}
            <div className="flex items-center text-sm mb-4">
                <Link to="/markets" className="text-text-muted hover:text-brand transition-colors">Markets</Link>
                <ChevronRight size={14} className="mx-2 text-border" />
                <span className="text-text-secondary font-medium">{playerData.name}</span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

                {/* LEFT COLUMN (65% on xl screens ~ cols 8) */}
                <div className="xl:col-span-8 space-y-4">

                    {/* 2. PLAYER HEADER */}
                    <Card className="flex flex-col">
                        <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-4">
                                <div className="w-14 h-14 rounded-full bg-brand-light text-brand text-xl font-bold flex items-center justify-center shrink-0">
                                    {playerData.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-text-primary leading-tight mb-1">{playerData.name}</h1>
                                    <p className="text-text-secondary text-sm mb-2">
                                        {playerData.role} &middot; {playerData.team} &middot; {playerData.region}
                                    </p>
                                    <div className="flex space-x-2">
                                        <Tag>Cricket</Tag>
                                        <Tag>Batsman</Tag>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center justify-end space-x-2 mb-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-success tracking-wider">LIVE</span>
                                </div>
                                <div className="text-3xl font-bold text-text-primary mb-1">
                                    ₹{playerData.price.toFixed(2)}
                                </div>
                                <Badge variant={isPositive ? 'success' : 'danger'} className="text-sm">
                                    {isPositive ? '+' : ''}{playerData.change}%
                                </Badge>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border grid grid-cols-5 gap-4">
                            <div className="text-center">
                                <div className="text-xs text-text-muted mb-0.5">Age</div>
                                <div className="text-sm font-semibold text-text-primary">{playerData.age}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-text-muted mb-0.5">Matches</div>
                                <div className="text-sm font-semibold text-text-primary">{playerData.matches}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-text-muted mb-0.5">Avg</div>
                                <div className="text-sm font-semibold text-text-primary">{playerData.avg}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-text-muted mb-0.5">SR</div>
                                <div className="text-sm font-semibold text-text-primary">{playerData.sr}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-text-muted mb-0.5">Ranking</div>
                                <div className="text-sm font-semibold text-text-primary">{playerData.ranking}</div>
                            </div>
                        </div>
                    </Card>

                    {/* 3. PRICE CHART */}
                    <Card>
                        <div className="flex space-x-2 mb-6">
                            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setTimeTab(tab)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${timeTab === tab
                                        ? 'bg-brand-light text-brand'
                                        : 'text-text-secondary hover:bg-page'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="h-[280px] w-full mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={['dataMin - 1', 'dataMax + 1']}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                        dx={-10}
                                        width={40}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke="var(--color-brand)"
                                        strokeWidth={2}
                                        fill="var(--color-brand-light)"
                                        activeDot={{ r: 6, fill: 'var(--color-brand)', stroke: 'white', strokeWidth: 2 }}
                                        dot={false}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="h-[50px] w-full ml-10 pr-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <Bar dataKey="volume" fill="var(--color-brand)" opacity={0.3} radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* 4. STATS TABS */}
                    <Card noPadding className="overflow-hidden">
                        <div className="flex border-b border-border">
                            {['Overview', 'Career Stats', 'Dividends'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setStatsTab(tab)}
                                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${statsTab === tab
                                        ? 'border-b-2 border-brand text-brand bg-brand-light/20'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-page border-b-2 border-transparent'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-5">
                            {statsTab === 'Overview' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatBox label="Batting Avg" value="48.3" />
                                    <StatBox label="Strike Rate" value="142.5" />
                                    <StatBox label="Total Runs" value="5,240" />
                                    <StatBox label="Centuries" value="12" />
                                    <StatBox label="Half-Centuries" value="34" />
                                    <StatBox label="Highest Score" value="145*" />
                                    <StatBox label="IPL Matches" value="62" />
                                    <StatBox label="IPL Runs" value="2,150" />
                                    <StatBox label="IPL Avg" value="44.2" className="md:col-span-1" />
                                </div>
                            )}

                            {statsTab === 'Career Stats' && (
                                <div className="h-[250px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={careerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: 'var(--color-page)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
                                            <Bar dataKey="runs" fill="var(--color-brand)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {statsTab === 'Dividends' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-page text-xs uppercase tracking-wide text-text-muted">
                                                <th className="pb-2 font-medium">Date</th>
                                                <th className="pb-2 font-medium">Event</th>
                                                <th className="pb-2 font-medium text-right">Per Share</th>
                                                <th className="pb-2 font-medium text-right">Your Earnings</th>
                                                <th className="pb-2 font-medium text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {dividends.map((div, i) => (
                                                <tr key={i} className="border-b border-border hover:bg-page transition-colors">
                                                    <td className="py-3 text-text-primary whitespace-nowrap">{div.date}</td>
                                                    <td className="py-3 text-text-secondary">{div.event}</td>
                                                    <td className="py-3 text-right font-medium text-text-primary">{div.perShare}</td>
                                                    <td className="py-3 text-right font-medium text-text-primary">{div.total}</td>
                                                    <td className="py-3 text-right">
                                                        <Badge variant={div.status === 'Paid' ? 'success' : 'brand'}>{div.status}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COLUMN (35% on xl screens ~ cols 4) */}
                <div className="xl:col-span-4 space-y-4 xl:sticky xl:top-[80px]">

                    {/* 5. TRADING PANEL */}
                    <Card>
                        {/* BUY/SELL Toggle */}
                        <div className="flex space-x-2 mb-5">
                            <button
                                onClick={() => setTradeMode('BUY')}
                                className={`flex-1 py-3 rounded-lg font-bold text-lg transition-colors ${tradeMode === 'BUY' ? 'bg-success text-white' : 'bg-page text-text-secondary hover:bg-border/50'
                                    }`}
                            >
                                BUY
                            </button>
                            <button
                                onClick={() => setTradeMode('SELL')}
                                className={`flex-1 py-3 rounded-lg font-bold text-lg transition-colors ${tradeMode === 'SELL' ? 'bg-danger text-white' : 'bg-page text-text-secondary hover:bg-border/50'
                                    }`}
                            >
                                SELL
                            </button>
                        </div>

                        {/* Order Type */}
                        <div className="flex bg-page p-1 rounded-lg mb-5">
                            {['Market', 'Limit', 'SL'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type)}
                                    className={`flex-1 py-1.5 text-sm font-semibold transition-all rounded-md ${orderType === type
                                        ? 'bg-brand-light border border-brand text-brand shadow-sm'
                                        : 'text-text-secondary border border-transparent hover:text-text-primary'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Quantity */}
                        <div className="mb-5">
                            <div className="text-sm font-medium text-text-secondary mb-2">Quantity</div>
                            <div className="flex items-center">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-l-lg border border-border bg-page flex items-center justify-center text-text-secondary hover:bg-border/50 hover:text-text-primary transition-colors"
                                >
                                    <Minus size={18} />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    className="w-full h-10 border-y border-border text-center font-bold text-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand z-10"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 rounded-r-lg border border-border bg-page flex items-center justify-center text-text-secondary hover:bg-border/50 hover:text-text-primary transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="text-xs text-text-muted mt-2 text-right">
                                @ ₹{TradePrice.toFixed(2)} per share
                            </div>
                        </div>

                        {/* Limit Price Input */}
                        {orderType === 'Limit' && (
                            <div className="mb-5">
                                <div className="text-sm font-medium text-text-secondary mb-2">Limit Price</div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">₹</span>
                                    <input
                                        type="number"
                                        value={limitPrice}
                                        onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                                        className="w-full h-10 border border-border rounded-lg pl-7 pr-3 font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Price Breakdown */}
                        <div className="bg-page rounded-lg p-4 mb-5 text-sm">
                            <div className="flex justify-between text-text-secondary mb-2">
                                <span>Qty &times; Price</span>
                                <span className="font-medium text-text-primary">₹{grossTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-text-secondary mb-3">
                                <span>Platform fee (0.5%)</span>
                                <span className="font-medium text-text-primary">₹{fee.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-border pt-3 flex justify-between">
                                <span className="font-bold text-text-primary">Total Amount</span>
                                <span className="font-bold text-text-primary text-lg">₹{netTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <Button
                            variant={tradeMode === 'BUY' ? 'success' : 'danger'}
                            size="lg"
                            className="w-full text-base font-bold"
                        >
                            {tradeMode} {playerData.name}
                        </Button>

                        <div className="text-center mt-3">
                            <span className="text-xs text-text-muted font-medium">Balance: ₹24,500</span>
                        </div>
                    </Card>

                    {/* 6. ORDER BOOK */}
                    <Card>
                        <h3 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wider">Order Book</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm relative">

                            {/* Center Divider Price */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 border border-border rounded-md font-bold text-text-primary z-10 text-xs shadow-sm">
                                ₹{playerData.price.toFixed(2)}
                            </div>

                            {/* Bids */}
                            <div>
                                <div className="flex justify-between text-xs text-success font-semibold border-b border-border pb-2 mb-2">
                                    <span>Price</span>
                                    <span>Qty</span>
                                </div>
                                {orderBook.bids.map((bid, i) => (
                                    <div key={i} className="flex justify-between py-1 text-text-secondary group hover:bg-page transition-colors">
                                        <span className="text-success font-medium">₹{bid.price.toFixed(2)}</span>
                                        <span>{bid.qty}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Asks */}
                            <div className="ml-2">
                                <div className="flex justify-between text-xs text-danger font-semibold border-b border-border pb-2 mb-2">
                                    <span>Price</span>
                                    <span>Qty</span>
                                </div>
                                {orderBook.asks.map((ask, i) => (
                                    <div key={i} className="flex justify-between py-1 text-text-secondary group hover:bg-page transition-colors">
                                        <span className="text-danger font-medium">₹{ask.price.toFixed(2)}</span>
                                        <span>{ask.qty}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* 7. KEY METRICS */}
                    <Card className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center py-2 pb-3 border-b border-border">
                            <div className="flex items-center text-text-secondary text-sm">
                                <Sparkles size={16} className="text-brand mr-2" />
                                <span className="font-medium">AI Valuation</span>
                            </div>
                            <span className="text-brand font-bold">₹8.3 Cr</span>
                        </div>
                        <div className="pb-3 border-b border-border">
                            <ProgressBar value={84} colorClass="bg-brand" className="mb-1.5 h-1.5" />
                            <div className="text-right text-[10px] text-text-muted font-semibold tracking-wide uppercase">84% Confidence</div>
                        </div>

                        <div className="flex justify-between py-1 text-sm">
                            <span className="text-text-secondary">IPO Price</span>
                            <span className="text-text-primary font-medium">₹25.00</span>
                        </div>
                        <div className="flex justify-between py-1 text-sm border-t border-border mt-1 pt-2">
                            <span className="text-text-secondary">52W High</span>
                            <span className="text-text-primary font-medium">₹48.20</span>
                        </div>
                        <div className="flex justify-between py-1 text-sm border-t border-border mt-1 pt-2">
                            <span className="text-text-secondary">52W Low</span>
                            <span className="text-text-primary font-medium">₹18.50</span>
                        </div>
                        <div className="flex justify-between py-1 text-sm border-t border-border mt-1 pt-2">
                            <span className="text-text-secondary">Shares Issued</span>
                            <span className="text-text-primary font-medium">20,00,000</span>
                        </div>
                        <div className="flex justify-between py-1 text-sm border-t border-border mt-1 pt-2">
                            <span className="text-text-secondary">Shares Available</span>
                            <span className="text-text-primary font-medium">35,420</span>
                        </div>
                        <div className="flex justify-between py-1 text-sm border-t border-border mt-1 pt-2">
                            <span className="text-text-secondary">Next Dividend</span>
                            <span className="text-text-primary font-medium">12 Oct 2025</span>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
