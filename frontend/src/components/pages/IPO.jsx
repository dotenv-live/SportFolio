import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Tag from '../ui/Tag';
import StatBox from '../ui/StatBox';
import ProgressBar from '../ui/ProgressBar';
import EmptyState from '../ui/EmptyState';
import { Rocket, Calendar, Search, Sparkles, IndianRupee } from 'lucide-react';

// --- MOCK DATA ---
const featuredIPO = {
    id: '15',
    name: 'Yash Rathore',
    role: 'Opening Batsman',
    age: 19,
    region: 'Rajasthan',
    bio: 'Ranked #3 U-19 batsman in India. 3 consecutive centuries in Ranji Trophy 2024.',
    tags: ['Cricket', 'High Potential'],
    price: 34,
    minInvest: 340,
    shares: '1,00,000',
    target: '34L',
    raisedAmount: '28.9L',
    progress: 85,
    investors: '84,985',
    daysLeft: 3,
    // Target date for countdown (3 days from now)
    closesAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).getTime(),
};

const openIPOs = [
    { id: '16', name: 'Ravi Kumar', role: 'Fast Bowler', age: 21, price: 28, target: '25L', progress: 91, daysLeft: 2 },
    { id: '17', name: 'Alok Singh', role: 'Wicketkeeper', age: 20, price: 22, target: '18L', progress: 67, daysLeft: 5 },
    { id: '18', name: 'Meera Das', role: 'All-rounder', age: 23, price: 45, target: '40L', progress: 45, daysLeft: 8 },
];

const upcomingIPOs = [
    { id: '19', name: 'Ishan Ali', role: 'Spin Bowler', state: 'Delhi', price: '₹18 - ₹22', date: '14 Oct 2025' },
    { id: '20', name: 'Kavya Reddy', role: 'Opening Batsman', state: 'Andhra', price: '₹30 - ₹35', date: '21 Oct 2025' },
    { id: '21', name: 'Samar Jain', role: 'All-rounder', state: 'MP', price: '₹25 - ₹28', date: '05 Nov 2025' },
];

const howItWorks = [
    { step: 1, icon: Search, title: 'Scout', desc: 'AI identifies high-potential cricketers' },
    { step: 2, icon: Sparkles, title: 'Value', desc: 'AI engine sets a fair IPO price' },
    { step: 3, icon: Rocket, title: 'Invest', desc: 'You buy shares in their career' },
    { step: 4, icon: IndianRupee, title: 'Earn', desc: 'Get dividends from match fees' },
];

export default function IPOZone() {
    const [activeTab, setActiveTab] = useState('Open IPOs');
    const [reminders, setReminders] = useState({}); // Tracking reminder states { id: true/false }

    // Countdown Timer Logic
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const difference = featuredIPO.closesAt - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000),
                });
            } else {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const toggleReminder = (id) => {
        setReminders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="pb-8 max-w-[1200px] mx-auto">

            {/* PAGE HEADER */}
            <div className="mb-6">
                <div className="flex items-center space-x-2 mb-1">
                    <Rocket size={24} className="text-brand" />
                    <h1 className="text-2xl font-bold text-text-primary">IPO Zone</h1>
                </div>
                <p className="text-text-secondary">Be the first to back India's next cricket star</p>
            </div>

            {/* TABS */}
            <div className="flex border-b border-border mb-6">
                {['Open IPOs', 'Upcoming', 'Closed'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm transition-colors ${activeTab === tab
                            ? 'border-b-2 border-brand text-brand font-medium'
                            : 'text-text-secondary hover:text-text-primary font-medium hover:bg-page border-b-2 border-transparent'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'Open IPOs' && (
                <>
                    {/* FEATURED IPO */}
                    <Card className="relative p-6 border-brand/20">
                        <Badge variant="gold" className="absolute top-0 left-0 rounded-tl-xl rounded-tr-none rounded-bl-none rounded-br-lg px-3 py-1 font-bold tracking-wider">
                            FEATURED
                        </Badge>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">

                            {/* Left Details (60%) */}
                            <div className="lg:col-span-7 flex flex-col justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-text-primary mb-1">{featuredIPO.name}</h2>
                                    <p className="text-sm text-text-secondary mb-3">
                                        {featuredIPO.role} &middot; Age {featuredIPO.age} &middot; {featuredIPO.region}
                                    </p>

                                    <div className="flex space-x-2 mb-4">
                                        <Tag>Cricket</Tag>
                                        <Badge variant="brand">High Potential</Badge>
                                    </div>

                                    <p className="text-sm text-text-primary font-medium italic mb-6 border-l-2 border-brand pl-3 py-1 bg-page/50 rounded-r">
                                        "{featuredIPO.bio}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <StatBox label="IPO Price" value={`₹${featuredIPO.price}/share`} className="shadow-none border border-border" />
                                    <StatBox label="Min Investment" value={`₹${featuredIPO.minInvest}`} className="shadow-none border border-border" />
                                    <StatBox label="Total Shares" value={featuredIPO.shares} className="shadow-none border border-border" />
                                    <StatBox label="Target Raise" value={`₹${featuredIPO.target}`} className="shadow-none border border-border" />
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-semibold text-text-primary">
                                            ₹{featuredIPO.raisedAmount} raised <span className="text-text-secondary font-normal">of ₹{featuredIPO.target} target</span>
                                        </span>
                                        <span className="text-sm font-bold text-brand">{featuredIPO.progress}%</span>
                                    </div>
                                    <ProgressBar value={featuredIPO.progress} className="h-2 mb-2" />
                                    <div className="text-xs text-text-muted">
                                        {featuredIPO.investors} investors &middot; {featuredIPO.daysLeft} days left
                                    </div>

                                    <div className="flex space-x-3 mt-6">
                                        <Button variant="primary" size="lg" className="flex-1 font-bold">Apply for IPO</Button>
                                        <Button variant="outline" size="lg" className="flex-1">View Full Profile</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Countdown Chart (40%) */}
                            <div className="lg:col-span-5 flex flex-col items-center border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8">
                                <div className="w-full bg-page rounded-xl p-6 text-center h-full flex flex-col items-center justify-center border border-border">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-6">IPO Closes In</h3>

                                    <div className="flex items-center justify-center space-x-2 md:space-x-4">
                                        <div className="flex flex-col items-center bg-white border border-border rounded-lg p-3 w-16 shadow-sm">
                                            <span className="text-2xl font-bold text-brand leading-none mb-1">
                                                {String(timeLeft.days).padStart(2, '0')}
                                            </span>
                                            <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">Days</span>
                                        </div>
                                        <span className="text-2xl font-bold text-border pb-4">:</span>
                                        <div className="flex flex-col items-center bg-white border border-border rounded-lg p-3 w-16 shadow-sm">
                                            <span className="text-2xl font-bold text-text-primary leading-none mb-1">
                                                {String(timeLeft.hours).padStart(2, '0')}
                                            </span>
                                            <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">Hours</span>
                                        </div>
                                        <span className="text-2xl font-bold text-border pb-4">:</span>
                                        <div className="flex flex-col items-center bg-white border border-border rounded-lg p-3 w-16 shadow-sm">
                                            <span className="text-2xl font-bold text-text-primary leading-none mb-1">
                                                {String(timeLeft.minutes).padStart(2, '0')}
                                            </span>
                                            <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">Mins</span>
                                        </div>
                                        <span className="text-2xl font-bold text-border pb-4">:</span>
                                        <div className="flex flex-col items-center bg-white border border-border rounded-lg p-3 w-16 shadow-sm">
                                            <span className="text-2xl font-bold text-text-primary leading-none mb-1">
                                                {String(timeLeft.seconds).padStart(2, '0')}
                                            </span>
                                            <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider">Secs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </Card>

                    {/* OPEN IPOs GRID */}
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
                            More Open IPOs
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {openIPOs.map(ipo => (
                                <Card key={ipo.id} className="flex flex-col transition-all hover:border-brand/40">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-lg text-text-primary truncate">{ipo.name}</h4>
                                        <Badge variant={ipo.daysLeft <= 3 ? 'gold' : 'neutral'} className="shrink-0 text-[10px]">
                                            {ipo.daysLeft} days left
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-text-secondary mb-4">
                                        {ipo.role} &middot; Age {ipo.age}
                                    </p>

                                    <div className="flex justify-between items-center bg-page p-3 rounded-lg mb-4 text-sm">
                                        <div>
                                            <div className="text-xs text-text-muted">IPO Price</div>
                                            <div className="font-bold text-text-primary">₹{ipo.price}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-text-muted">Target</div>
                                            <div className="font-semibold text-text-primary">₹{ipo.target}</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-text-primary">{ipo.progress}% funded</span>
                                        </div>
                                        <ProgressBar value={ipo.progress} className="mb-4" colorClass={ipo.progress >= 90 ? 'bg-success' : 'bg-brand'} />
                                        <Button variant="primary" size="sm" className="w-full">Apply Now</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* UPCOMING IPO TAB (if selected) or render below for demo */}
            {activeTab === 'Upcoming' && (
                <Card noPadding className="mt-4 overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center bg-page/30">
                        <Calendar size={20} className="text-text-secondary mr-2" />
                        <h2 className="text-lg font-bold text-text-primary">Upcoming IPOs</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border bg-page text-xs uppercase tracking-wide text-text-muted">
                                    <th className="px-5 py-3 font-medium">Player</th>
                                    <th className="px-5 py-3 font-medium">Role</th>
                                    <th className="px-5 py-3 font-medium">State</th>
                                    <th className="px-5 py-3 font-medium text-right">Expected Price</th>
                                    <th className="px-5 py-3 font-medium text-right">IPO Date</th>
                                    <th className="px-5 py-3 font-medium text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {upcomingIPOs.map(ipo => {
                                    const isReminded = reminders[ipo.id];
                                    return (
                                        <tr key={ipo.id} className="border-b border-border hover:bg-page transition-colors">
                                            <td className="px-5 py-4 font-bold text-text-primary">{ipo.name}</td>
                                            <td className="px-5 py-4 text-sm text-text-secondary">{ipo.role}</td>
                                            <td className="px-5 py-4 text-sm text-text-secondary">{ipo.state}</td>
                                            <td className="px-5 py-4 text-sm font-semibold text-text-primary text-right">{ipo.price}</td>
                                            <td className="px-5 py-4 text-sm font-medium text-text-primary text-right">{ipo.date}</td>
                                            <td className="px-5 py-4 text-center">
                                                <Button
                                                    variant={isReminded ? 'success' : 'outline'}
                                                    size="sm"
                                                    className="w-32 py-1.5 text-xs font-semibold"
                                                    onClick={() => toggleReminder(ipo.id)}
                                                >
                                                    {isReminded ? '✓ Reminded' : 'Set Reminder'}
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

            {activeTab === 'Closed' && (
                <div className="mt-4">
                    <EmptyState
                        icon={Rocket}
                        title="No closed IPOs yet"
                        message="The platform is new. Past IPOs will appear here."
                    />
                </div>
            )}

            {/* HOW IT WORKS SECTION (Always visible) */}
            <div className="mt-12 pt-10 border-t border-border">
                <h2 className="text-xl font-bold text-text-primary text-center mb-10">
                    How SportFolio IPO Works
                </h2>

                <div className="relative flex flex-col md:flex-row justify-between max-w-4xl mx-auto">
                    {/* Dashed Line Background (hidden on mobile) */}
                    <div className="hidden md:block absolute top-[15px] left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-border z-0"></div>

                    {howItWorks.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                            <div key={idx} className="flex flex-col items-center w-full md:w-1/4 mb-8 md:mb-0 relative z-10">
                                <div className="w-8 h-8 rounded-full bg-brand text-white font-bold flex items-center justify-center mb-4 shadow-sm border-[3px] border-white">
                                    {step.step}
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center mb-3">
                                    <Icon size={24} />
                                </div>
                                <h3 className="font-bold text-text-primary mb-2 text-center">{step.title}</h3>
                                <p className="text-xs text-text-secondary text-center px-4">
                                    {step.desc}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    );
}
