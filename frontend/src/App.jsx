import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './components/pages/Dashboard';
import Markets from './components/pages/Markets';
import PlayerProfile from './components/pages/PlayerProfile';
import IPOZone from './components/pages/IPO';
import Portfolio from './components/pages/Portfolio';
import AIScout from './components/pages/AIScout';
import EmptyState from './components/ui/EmptyState';
import { Star, ArrowLeftRight } from 'lucide-react';

// Mock Pages
const PlaceholderPage = ({ title, icon }) => (
  <div className="pt-6">
    <EmptyState
      title={title}
      icon={icon}
      message="This feature is currently under development. Please check back later!"
      actionText="Return to Dashboard"
      onAction={() => window.location.href = '/'}
    />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/ipo" element={<IPOZone />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/ai-scout" element={<AIScout />} />
          <Route path="/watchlist" element={<PlaceholderPage title="Watchlist" icon={Star} />} />
          <Route path="/transactions" element={<PlaceholderPage title="Transactions" icon={ArrowLeftRight} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
