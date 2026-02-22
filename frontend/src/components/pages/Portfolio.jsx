import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { IndianRupee, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from 'recharts';

// --- MOCK DATA ---
const allocationPlayer = [
    { name: 'Arjun Sharma', value: 45000 },
    { name: 'Yash Rathore', value: 32000 },
    { name: 'Ravi Kumar', value: 25000 },
    { name: 'Meera Das', value: 12500 },
    { name: 'Ishan Ali', value: 10000 }
];

const allocationRole = [
    { name: 'Batsman', value: 77000 },
    { name: 'Bowler', value: 35000 },
    { name: 'All-rounder', value: 12500 }
];

const COLORS = ['#5C41F5', '#00B386', '#F5A623', '#EB5757', '#8B7FFF'];

const holdings = [
    { id: '1', name: 'Arjun Sharma', role: 'Batsman', shares: 500, avgPrice: 65.0, ltp: 90.0, value: 45000, pnl: 12500, pnlPct: 38.4 },
    { id: '15', name: 'Yash Rathore', role: 'Batsman', shares: 800, avgPrice: 34.0, ltp: 40.0, value: 32000, pnl: 4800, pnlPct: 17.6 },
    { id: '16', name: 'Ravi Kumar', role: 'Bowler', shares: 1000, avgPrice: 20.0, ltp: 25.0, value: 25000, pnl: 5000, pnlPct: 25.0 },
    { id: '18', name: 'Meera Das', role: 'All-rounder', shares: 250, avgPrice: 40.0, ltp: 50.0, value: 12500, pnl: 2500, pnlPct: 25.0 },
    { id: '19', name: 'Ishan Ali', role: 'Bowler', shares: 600, avgPrice: 20.0, ltp: 16.66, value: 10000, pnl: -2000, pnlPct: -16.6 },
];

const dividendChart = [
    { month: 'Jan', amount: 450 },
    { month: 'Feb', amount: 820 },
    { month: 'Mar', amount: 650 },
    { month: 'Apr', amount: 1200 },
    { month: 'May', amount: 950 },
    { month: 'Jun', amount: 750 },
];

const dividendHistory = [
    { date: '15 Jun 2024', player: 'Arjun Sharma', event: 'MOM T20', perShare: 1.5, shares: 500, total: 750, status: 'Credited' },
    { date: '28 May 2024', player: 'Yash Rathore', event: 'Century Bonus', perShare: 2.5, shares: 380, total: 950, status: 'Credited' },
    { date: '12 Apr 2024', player: 'Ravi Kumar', event: '5-Wicket Haul', perShare: 1.2, shares: 1000, total: 1200, status: 'Credited' },
    { date: '05 Mar 2024', player: 'Arjun Sharma', event: 'Series Win', perShare: 1.3, shares: 500, total: 650, status: 'Credited' },
    { date: '18 Feb 2024', player: 'Meera Das', event: 'WPL Playoff', perShare: 3.28, shares: 250, total: 820, status: 'Credited' },
];

const transactionsFull = [
    { id: 'tx1', date: '20 Jun 2024', player: 'Meera Das', type: 'Buy', qty: 50, price: 48.0, amount: 2400, status: 'Completed' },
    { id: 'tx2', date: '18 Jun 2024', player: 'Ishan Ali', type: 'Buy', qty: 200, price: 17.5, amount: 3500, status: 'Pending' },
    { id: 'tx3', date: '15 Jun 2024', player: 'Arjun Sharma', type: 'Dividend', qty: '-', price: '-', amount: 750, status: 'Completed' },
    { id: 'tx4', date: '12 Jun 2024', player: 'Ravi Kumar', type: 'Sell', qty: 100, price: 26.0, amount: 2600, status: 'Completed' },
    { id: 'tx5', date: '08 Jun 2024', player: 'Yash Rathore', type: 'Buy', qty: 300, price: 38.0, amount: 11400, status: 'Completed' },
    { id: 'tx6', date: '02 Jun 2024', player: 'Arjun Sharma', type: 'Buy', qty: 100, price: 85.0, amount: 8500, status: 'Completed' },
    { id: 'tx7', date: '28 May 2024', player: 'Yash Rathore', type: 'Dividend', qty: '-', price: '-', amount: 950, status: 'Completed' },
    { id: 'tx8', date: '20 May 2024', player: 'Meera Das', type: 'Sell', qty: 50, price: 52.0, amount: 2600, status: 'Completed' },
    { id: 'tx9', date: '15 May 2024', player: 'Ravi Kumar', type: 'Buy', qty: 400, price: 21.0, amount: 8400, status: 'Completed' },
    { id: 'tx10', date: '10 May 2024', player: 'Ishan Ali', type: 'Buy', qty: 400, price: 16.0, amount: 6400, status: 'Completed' },
];

export default function Portfolio() {
    const [allocTab, setAllocTab] = useState('By Player');
    const [txFilter, setTxFilter] = useState('All');
    const [page, setPage] = useState(1);
    const rowsPerPage = 8;

    const currentAllocation = allocTab === 'By Player' ? allocationPlayer : allocationRole;
    const totalAllocationValue = currentAllocation.reduce((sum, item) => sum + item.value, 0);

    // Filter transactions
    const filteredTx = txFilter === 'All'
        ? transactionsFull
        : transactionsFull.filter(tx => tx.type === txFilter);

    // Paginate transactions
    const totalPages = Math.ceil(filteredTx.length / rowsPerPage);
    const paginatedTx = filteredTx.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handleTxFilter = (filter) => {
        setTxFilter(filter);
        setPage(1); // Reset page on filter change
    };

    return (
        <div className="pb-8 max-w-[1400px] mx-auto">

            {/* PAGE HEADER */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">My Portfolio</h1>
                    <p className="text-xs text-text-muted mt-1">Last updated: just now</p>
                </div>
            </div>

            {/* SUMMARY CARD */}
            <Card className="mb-5 overflow-hidden">
                <div className="grid grid-cols-2 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-border -m-5">
                    <div className="p-5 text-center flex flex-col justify-center">
                        <div className="text-xs text-text-secondary mb-1">Total Invested</div>
                        <div className="text-xl font-bold text-text-primary">₹85,000</div>
                    </div>
                    <div className="p-5 text-center flex flex-col justify-center">
                        <div className="text-xs text-text-secondary mb-1">Current Value</div>
                        <div className="text-xl font-bold text-text-primary">₹1,24,500</div>
                    </div>
                    <div className="p-5 text-center flex flex-col justify-center bg-success/5">
                        <div className="text-xs text-success mb-1">Total Returns</div>
                        <div className="text-xl font-bold text-success">+₹39,500</div>
                    </div>
                    <div className="p-5 text-center flex items-center justify-center">
                        <div>
                            <div className="text-xs text-text-secondary mb-1">Returns %</div>
                            <Badge variant="success" className="text-sm font-bold flex items-center px-3 py-1">
                                <span className="mr-1 text-[10px]">▲</span> 46.4%
                            </Badge>
                        </div>
                    </div>
                    <div className="p-5 text-center flex flex-col justify-center">
                        <div className="text-xs text-text-secondary mb-1">Today's Change</div>
                        <div className="text-lg font-bold text-success">+₹3,240</div>
                    </div>
                    <div className="p-5 text-center flex flex-col justify-center relative group">
                        <div className="text-xs text-text-secondary mb-1 flex items-center justify-center">
                            XIRR
                            <Info size={12} className="ml-1 text-text-muted cursor-help" />
                        </div>
                        <div className="text-lg font-bold text-text-primary">28.3%</div>

                        {/* Tooltip */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 w-48 text-center">
                            Extended IRR — annualized returns
                        </div>
                    </div>
                </div>
            </Card>

            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-start">

                {/* LEFT COMPONENT (Allocation) ~ 40% */}
                <div className="lg:col-span-5 h-[480px]">
                    <Card className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-text-primary">Allocation</h3>
                            <div className="flex bg-page p-1 rounded-lg">
                                <button
                                    onClick={() => setAllocTab('By Player')}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${allocTab === 'By Player' ? 'bg-white shadow border border-border text-brand' : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    By Player
                                </button>
                                <button
                                    onClick={() => setAllocTab('By Role')}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${allocTab === 'By Role' ? 'bg-white shadow border border-border text-brand' : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                >
                                    By Role
                                </button>
                            </div>
                        </div>

                        <div className="h-[200px] flex justify-center mb-6 relative">
                            <ResponsiveContainer width={240} height="100%">
                                <PieChart>
                                    <Pie
                                        data={currentAllocation}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {currentAllocation.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `₹${value.toLocaleString()}`}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xs text-text-muted font-medium">Total</span>
                                <span className="text-lg font-bold text-text-primary">₹{totalAllocationValue / 1000}k</span>
                            </div>
                        </div>

                        {/* Custom Legend */}
                        <div className="space-y-3 px-2 flex-grow overflow-y-auto custom-scrollbar">
                            {currentAllocation.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center">
                                        <span
                                            className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                        ></span>
                                        <span className="text-text-secondary font-medium">{item.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-text-primary font-semibold mr-3">
                                            {((item.value / totalAllocationValue) * 100).toFixed(1)}%
                                        </span>
                                        <span className="text-text-muted text-xs">₹{item.value.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RIGHT COMPONENT (Holdings) ~ 60% */}
                <div className="lg:col-span-7 h-[480px]">
                    <Card className="h-full flex flex-col justify-between overflow-hidden relative">
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-text-primary">Holdings</h3>
                                <span className="text-sm text-text-muted">{holdings.length} players</span>
                            </div>

                            <div className="overflow-x-auto w-full pb-4">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-border bg-page text-xs uppercase text-text-muted tracking-wide">
                                            <th className="pb-3 font-medium min-w-[150px]">Player</th>
                                            <th className="pb-3 font-medium text-right">Shares</th>
                                            <th className="pb-3 font-medium text-right">Avg Price</th>
                                            <th className="pb-3 font-medium text-right">LTP</th>
                                            <th className="pb-3 font-medium text-right">Value</th>
                                            <th className="pb-3 font-medium text-right">P&L</th>
                                            <th className="pb-3 font-medium text-right min-w-[80px]">P&L %</th>
                                            <th className="pb-3 font-medium text-center pl-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {holdings.map(pos => {
                                            const pnlColor = pos.pnl >= 0 ? 'text-success' : 'text-danger';
                                            const pnlSign = pos.pnl >= 0 ? '+' : '';
                                            return (
                                                <tr key={pos.id} className="border-b border-border hover:bg-page transition-colors">
                                                    <td className="py-3">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 rounded-full bg-brand-light text-brand text-xs font-bold flex items-center justify-center shrink-0">
                                                                {pos.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-text-primary leading-none">{pos.name}</div>
                                                                <div className="text-[10px] text-text-muted mt-1">{pos.role}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right font-medium text-text-primary">{pos.shares}</td>
                                                    <td className="py-3 text-right text-text-secondary">₹{pos.avgPrice.toFixed(2)}</td>
                                                    <td className="py-3 text-right font-semibold text-text-primary">₹{pos.ltp.toFixed(2)}</td>
                                                    <td className="py-3 text-right font-medium text-text-primary">₹{pos.value.toLocaleString()}</td>
                                                    <td className={`py-3 text-right font-bold ${pnlColor}`}>{pnlSign}₹{Math.abs(pos.pnl).toLocaleString()}</td>
                                                    <td className={`py-3 text-right font-bold ${pnlColor}`}>{pnlSign}{pos.pnlPct.toFixed(1)}%</td>
                                                    <td className="py-3 text-center pl-4">
                                                        <Button variant="outline" size="sm" className="h-7 text-xs border-border text-text-secondary hover:border-brand hover:text-brand px-3">
                                                            Trade
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total Row */}
                        <div className="bg-page border-t border-border -mx-5 -mb-5 px-5 py-4 flex justify-between items-center z-10 sticky bottom-0">
                            <span className="font-bold text-text-primary uppercase tracking-wider text-sm">Total Holdings</span>
                            <div className="flex space-x-6 text-sm">
                                <div className="text-right">
                                    <span className="text-text-muted text-xs mr-2">Investment</span>
                                    <span className="font-bold text-text-primary">₹85,000</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-text-muted text-xs mr-2">Value</span>
                                    <span className="font-bold text-text-primary">₹1,24,500</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-text-muted text-xs mr-2">Returns</span>
                                    <span className="font-bold text-success">+₹39,500</span>
                                </div>
                            </div>
                        </div>

                    </Card>
                </div>

            </div>

            {/* DIVIDEND INCOME */}
            <Card className="mb-5 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center text-text-primary">
                        <IndianRupee size={20} className="text-brand mr-2" />
                        <h3 className="font-bold">Dividend Income</h3>
                    </div>
                    <div>
                        <span className="text-sm text-text-secondary mr-2">Total details earned:</span>
                        <span className="text-lg font-semibold text-success">₹4,820</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-1 h-[180px] px-2 flex flex-col justify-end">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dividendChart} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                                <Bar dataKey="amount" fill="var(--color-brand)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                    <LabelList dataKey="amount" position="top" fill="var(--color-text-secondary)" fontSize={10} formatter={(v) => `₹${v}`} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="lg:col-span-2 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-border bg-page text-xs uppercase text-text-muted tracking-wide">
                                    <th className="pb-3 font-medium">Date</th>
                                    <th className="pb-3 font-medium">Player</th>
                                    <th className="pb-3 font-medium">Match/Event</th>
                                    <th className="pb-3 font-medium text-right">Div/Share</th>
                                    <th className="pb-3 font-medium text-right">Shares</th>
                                    <th className="pb-3 font-medium text-right">Total Earned</th>
                                    <th className="pb-3 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {dividendHistory.map((div, i) => (
                                    <tr key={i} className="border-b border-border hover:bg-page transition-colors">
                                        <td className="py-3 text-text-secondary">{div.date}</td>
                                        <td className="py-3 font-medium text-text-primary">{div.player}</td>
                                        <td className="py-3 text-text-secondary">{div.event}</td>
                                        <td className="py-3 text-right text-text-primary">₹{div.perShare.toFixed(2)}</td>
                                        <td className="py-3 text-right text-text-secondary">{div.shares}</td>
                                        <td className="py-3 text-right font-bold text-success">₹{div.total.toFixed(2)}</td>
                                        <td className="py-3 text-right">
                                            <Badge variant="success" className="text-[10px]">{div.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </Card>

            {/* TRANSACTION HISTORY */}
            <Card>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
                    <h3 className="font-bold text-text-primary">Transaction History</h3>
                    <div className="flex space-x-2">
                        {['All', 'Buy', 'Sell', 'Dividend'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => handleTxFilter(filter)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${txFilter === filter
                                    ? 'bg-brand-light text-brand'
                                    : 'bg-page text-text-secondary hover:bg-border/50'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto w-full mb-4">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-border bg-page text-xs uppercase text-text-muted tracking-wide">
                                <th className="py-3 px-2 font-medium">Date</th>
                                <th className="py-3 px-2 font-medium">Player</th>
                                <th className="py-3 px-2 font-medium text-center">Type</th>
                                <th className="py-3 px-2 font-medium text-right">Qty</th>
                                <th className="py-3 px-2 font-medium text-right">Price</th>
                                <th className="py-3 px-2 font-medium text-right">Amount</th>
                                <th className="py-3 px-2 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-sm">
                            {paginatedTx.map(tx => {
                                let typeVariant = 'brand';
                                if (tx.type === 'Buy') typeVariant = 'success';
                                if (tx.type === 'Sell') typeVariant = 'danger';

                                return (
                                    <tr key={tx.id} className="border-b border-border hover:bg-page transition-colors">
                                        <td className="py-3 px-2 text-text-secondary">{tx.date}</td>
                                        <td className="py-3 px-2 font-medium text-text-primary">{tx.player}</td>
                                        <td className="py-3 px-2 text-center">
                                            <Badge variant={typeVariant} className="text-[10px] w-16 inline-block text-center">{tx.type}</Badge>
                                        </td>
                                        <td className="py-3 px-2 text-right text-text-secondary">{tx.qty}</td>
                                        <td className="py-3 px-2 text-right text-text-secondary">{tx.price !== '-' ? `₹${tx.price.toFixed(2)}` : '-'}</td>
                                        <td className="py-3 px-2 text-right font-semibold text-text-primary">₹{tx.amount.toLocaleString()}</td>
                                        <td className="py-3 px-2 text-right">
                                            <Badge variant={tx.status === 'Completed' ? 'success' : 'gold'} className="text-[10px]">
                                                {tx.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {paginatedTx.length === 0 && (
                        <div className="py-8 text-center text-text-muted text-sm">
                            No transactions found for this filter.
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center border-t border-border pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="text-text-secondary flex items-center"
                        >
                            <ChevronLeft size={16} className="mr-1" /> Prev
                        </Button>

                        <span className="text-xs font-semibold text-text-muted">
                            Page {page} of {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="text-text-secondary flex items-center"
                        >
                            Next <ChevronRight size={16} className="ml-1" />
                        </Button>
                    </div>
                )}
            </Card>

        </div>
    );
}
