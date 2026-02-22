import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';
import { Sparkles, Search, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ResponsiveContainer,
    LabelList,
    Cell
} from 'recharts';

// --- MOCK DATA ---
const drivingFactors = [
    { name: 'Match Experience', value: 16 },
    { name: 'Age Factor', value: 22 },
    { name: 'Consistency', value: 28 },
    { name: 'Strike Rate', value: 34 },
];

const undervaluedPicks = [
    { id: 1, name: 'Siddharth Varma', role: 'All-rounder, Age 20', score: 91, why: 'High consistency index, age 20, on rising form trajectory', upside: '+45%' },
    { id: 2, name: 'Tariq Khan', role: 'Fast Bowler, Age 23', score: 88, why: 'Breakout IPL season metrics unmatched by current IPO price', upside: '+32%' },
    { id: 3, name: 'Vikram Singh', role: 'Wicketkeeper, Age 19', score: 85, why: 'Top U-19 scorer, historically correlates with 4x valuation jump', upside: '+50%' },
];

const sentimentData = [
    { label: 'Overall Market', sentiment: 'Bullish', color: 'text-success', val: 72 },
    { label: 'U-19 Talent Pool', sentiment: 'Very Bullish', color: 'text-success', val: 88 },
    { label: 'IPL-linked Players', sentiment: 'Neutral', color: 'text-text-secondary', val: 50 },
    { label: 'Ranji Trophy Picks', sentiment: 'Bullish', color: 'text-success', val: 65 },
];

const quizQuestions = [
    {
        id: 'q1',
        text: "What's your investment horizon?",
        options: ['Short (< 1yr)', 'Medium (1–3 yrs)', 'Long (3+ yrs)'],
    },
    {
        id: 'q2',
        text: "Risk appetite?",
        options: ['Conservative', 'Moderate', 'Aggressive'],
    },
    {
        id: 'q3',
        text: "How well do you follow cricket?",
        options: ['Casually', 'Regularly', 'Obsessively'],
    }
];

export default function AIScout() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showValuation, setShowValuation] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Quiz State
    const [answers, setAnswers] = useState({});
    const allAnswered = Object.keys(answers).length === quizQuestions.length;

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        setIsAnalyzing(true);
        setShowValuation(false);

        // Mock network request
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowValuation(true);
        }, 800);
    };

    const handleOptionSelect = (qId, option) => {
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    return (
        <div className="pb-8 max-w-[1000px] mx-auto">

            {/* PAGE HEADER */}
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end space-y-4 md:space-y-0">
                <div>
                    <div className="flex items-center space-x-2 mb-1">
                        <Sparkles size={24} className="text-brand" />
                        <h1 className="text-2xl font-bold text-text-primary">AI Scout</h1>
                    </div>
                    <p className="text-text-secondary">ML-powered talent valuation trained on 10,000+ cricket matches</p>
                </div>
                <div>
                    <span className="bg-brand-light text-brand text-xs rounded-full px-3 py-1 font-medium border border-brand/20 shadow-sm">
                        Model v2.1 &middot; Last trained 2 days ago
                    </span>
                </div>
            </div>

            {/* VALUATION TOOL */}
            <Card className="mb-6 relative overflow-hidden border-brand/20">
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center">
                    Player Valuation Engine
                </h2>

                <div className="flex w-full space-x-2 mb-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Enter player name to get AI valuation..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-page border-2 border-border focus:border-brand rounded-xl pl-10 pr-4 py-3 text-text-primary outline-none transition-colors"
                        />
                    </div>
                    <Button
                        variant="primary"
                        size="lg"
                        className="px-8 whitespace-nowrap"
                        onClick={handleSearch}
                        disabled={isAnalyzing || !searchQuery.trim()}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyse'}
                    </Button>
                </div>

                {/* VALUATION RESULT (Fades in) */}
                {showValuation && (
                    <div className="mt-8 pt-6 border-t border-border animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                            {/* LEFT COLUMN (60%) */}
                            <div className="md:col-span-7">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-brand-light text-brand text-xs font-bold flex items-center justify-center shrink-0">
                                        AS
                                    </div>
                                    <h3 className="text-lg font-bold text-text-primary">Arjun Sharma</h3>
                                    <span className="text-sm text-text-muted">&middot; Batsman &middot; Age 22</span>
                                </div>

                                <div className="mb-4 bg-page p-4 rounded-xl border border-border">
                                    <div className="text-sm text-text-secondary mb-1">Predicted Lifetime Earnings</div>
                                    <div className="text-3xl font-bold text-brand mb-2">₹8.3 Cr</div>
                                    <div className="text-sm text-text-primary font-medium">
                                        Fair IPO Price Range: <span className="text-text-secondary">₹38 &ndash; ₹44 per share</span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4 mb-3">
                                    <Badge variant="gold">Medium Risk</Badge>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-text-primary">84% Confidence</span>
                                        </div>
                                        <ProgressBar value={84} className="h-1.5" colorClass="bg-brand" />
                                    </div>
                                </div>

                                {/* Feature Breakdown Chart */}
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold text-text-primary mb-2">What's driving this valuation?</h4>
                                    <div className="h-[140px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={drivingFactors} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} width={100} />
                                                <Bar dataKey="value" fill="var(--color-brand)" radius={[0, 4, 4, 0]} barSize={16}>
                                                    <LabelList dataKey="value" position="right" formatter={(val) => `${val}%`} fill="var(--color-text-primary)" fontSize={11} fontWeight="bold" />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN (40%) */}
                            <div className="md:col-span-5 flex flex-col justify-between">
                                <div className="bg-page rounded-xl p-5 border border-border h-full">
                                    <h4 className="text-sm font-bold text-text-primary mb-4 pb-2 border-b border-border">Valuation Breakdown</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-text-secondary">IPL Contracts</span>
                                                <span className="font-semibold text-text-primary">₹4.2 Cr (50%)</span>
                                            </div>
                                            <div className="w-full bg-border rounded-full h-1.5">
                                                <div className="bg-brand h-1.5 rounded-full" style={{ width: '50%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-text-secondary">BCCI Match Fees</span>
                                                <span className="font-semibold text-text-primary">₹2.1 Cr (25%)</span>
                                            </div>
                                            <div className="w-full bg-border rounded-full h-1.5">
                                                <div className="bg-brand h-1.5 rounded-full" style={{ width: '25%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-text-secondary">Endorsements (est.)</span>
                                                <span className="font-semibold text-text-primary">₹1.7 Cr (20%)</span>
                                            </div>
                                            <div className="w-full bg-border rounded-full h-1.5">
                                                <div className="bg-brand h-1.5 rounded-full" style={{ width: '20%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-text-secondary">Other</span>
                                                <span className="font-semibold text-text-primary">₹0.3 Cr (5%)</span>
                                            </div>
                                            <div className="w-full bg-border rounded-full h-1.5">
                                                <div className="bg-brand h-1.5 rounded-full" style={{ width: '5%' }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex space-x-3">
                                        <Button variant="outline" className="flex-1 bg-white">Add to Watchlist</Button>
                                        <Button variant="primary" className="flex-1">View Profile</Button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </Card>

            {/* UNDERVALUED PICKS */}
            <Card className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <TrendingUp size={20} className="text-text-primary" />
                        <h2 className="text-lg font-bold text-text-primary">Undervalued Players &middot; AI Detected</h2>
                    </div>
                    <span className="text-xs text-text-muted">Updated 2h ago</span>
                </div>

                <div className="divide-y divide-border">
                    {undervaluedPicks.map((pick) => (
                        <div key={pick.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                    <div className="w-10 h-10 rounded-full bg-page border border-border text-text-secondary text-sm font-bold flex items-center justify-center shrink-0">
                                        {pick.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            <h3 className="font-bold text-text-primary mr-2">{pick.name}</h3>
                                            <span className="text-xs font-bold text-brand bg-brand-light/30 px-2 py-0.5 rounded text-brand">
                                                AI Score: {pick.score}/100
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-secondary">{pick.role}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-text-muted mt-2 sm:ml-13 border-l-[3px] border-border pl-2">
                                    <span className="font-semibold text-text-secondary">Why:</span> {pick.why}
                                </p>
                            </div>
                            <div className="flex items-center space-x-4 sm:ml-4 sm:border-l sm:border-border sm:pl-4 pl-13">
                                <div className="text-right">
                                    <div className="text-[10px] text-text-muted uppercase font-semibold">Upside</div>
                                    <div className="font-bold text-success">{pick.upside}</div>
                                </div>
                                <Button variant="outline" size="sm" className="h-8 text-xs">Invest</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* MARKET SENTIMENT (40%) */}
                <div className="md:col-span-5">
                    <Card className="h-full">
                        <div className="flex items-start space-x-2 mb-2">
                            <TrendingUp size={20} className="text-text-primary mt-0.5" />
                            <div>
                                <h2 className="text-base font-bold text-text-primary">Cricket Market Sentiment</h2>
                                <p className="text-xs text-text-secondary">Based on recent performance trends</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {sentimentData.map((item, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="text-text-secondary font-medium">{item.label}</span>
                                        <span className={`font-bold ${item.color}`}>{item.sentiment}</span>
                                    </div>
                                    <ProgressBar value={item.val} className="h-1.5" colorClass={item.val > 60 ? 'bg-success' : 'bg-border'} />
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-[10px] text-text-muted leading-relaxed">
                            * AI sentiment analysis is indicative only. Not financial advice. Built using SportFolio Proprietary Engine.
                        </div>
                    </Card>
                </div>

                {/* RISK PROFILER (60%) */}
                <div className="md:col-span-7">
                    <Card className="h-full bg-page/30 border-brand/10">
                        <h2 className="text-lg font-bold text-text-primary mb-1">Discover Your Investment Style</h2>
                        <p className="text-sm text-text-secondary mb-6">3 quick questions &mdash; personalised picks in seconds</p>

                        <div className="space-y-5">
                            {quizQuestions.map((q) => (
                                <div key={q.id}>
                                    <h3 className="text-sm font-semibold text-text-primary mb-2">{q.text}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {q.options.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => handleOptionSelect(q.id, opt)}
                                                className={`px-4 py-2 text-xs font-medium rounded-full border transition-all ${answers[q.id] === opt
                                                    ? 'bg-brand text-white border-brand shadow-sm'
                                                    : 'bg-white text-text-secondary border-border hover:border-brand/50'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* QUIZ RESULT (Fades in when all answers selected) */}
                        {allAnswered && (
                            <div className="mt-6 pt-5 border-t border-brand/20 animate-fade-in bg-white p-5 rounded-xl border">
                                <div className="flex items-center space-x-2 mb-4">
                                    <CheckCircle2 size={20} className="text-success" />
                                    <span className="font-bold text-lg text-brand">Your Style: Growth Investor</span>
                                </div>

                                <p className="text-sm text-text-secondary mb-4">
                                    Based on your profile, we recommend building a portfolio heavily weighted towards early-stage talent with high upside potential.
                                </p>

                                <div className="space-y-3 mb-5">
                                    <div className="flex justify-between items-center bg-page p-2 rounded border border-border">
                                        <span className="text-sm font-medium text-text-primary">Siddharth Varma</span>
                                        <Badge variant="brand" className="text-[10px]">91 AI Score</Badge>
                                    </div>
                                    <div className="flex justify-between items-center bg-page p-2 rounded border border-border">
                                        <span className="text-sm font-medium text-text-primary">Tariq Khan</span>
                                        <Badge variant="brand" className="text-[10px]">88 AI Score</Badge>
                                    </div>
                                </div>

                                <Button variant="primary" className="w-full">Explore All AI Picks</Button>
                            </div>
                        )}
                    </Card>
                </div>

            </div>

        </div>
    );
}
