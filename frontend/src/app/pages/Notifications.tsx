import { useState } from 'react';
import { Link } from 'react-router';
import { mockNotifications } from '../data/mockData';
import { ArrowLeft, Bell, TrendingUp, DollarSign, Info, Settings as SettingsIcon, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { BottomNavigation } from '../components/BottomNavigation';

type NotificationFilter = 'all' | 'transaction' | 'alert' | 'update' | 'system';

export default function Notifications() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <DollarSign className="w-4 h-4" />;
      case 'alert':
        return <Bell className="w-4 h-4" />;
      case 'update':
        return <TrendingUp className="w-4 h-4" />;
      case 'system':
        return <Info className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'alert':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'update':
        return 'bg-blue-500/10 text-blue-500';
      case 'system':
        return 'bg-neutral-500/10 text-neutral-400';
      default:
        return 'bg-neutral-500/10 text-neutral-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <button className="w-8 h-8 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="font-bold text-base">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-neutral-500">{unreadCount} unread</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-500 font-medium"
              >
                Mark all read
              </button>
            )}
            <Link to="/settings">
              <button className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
                <SettingsIcon className="w-5 h-5 text-neutral-400" />
              </button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {[
            { value: 'all', label: 'All' },
            { value: 'transaction', label: 'Transactions' },
            { value: 'alert', label: 'Alerts' },
            { value: 'update', label: 'Updates' },
            { value: 'system', label: 'System' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as NotificationFilter)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab.value
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-neutral-400 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-2">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">No Notifications</h3>
            <p className="text-sm text-neutral-500">
              You're all caught up! We'll notify you when something happens.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={`py-4 border-b border-white/[0.05] transition-colors ${
                  !notification.read ? 'bg-white/[0.02]' : ''
                }`}
              >
                <Link
                  to={notification.athleteId ? `/athlete/${notification.athleteId}` : '#'}
                  className="block"
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className={`text-sm font-semibold ${!notification.read ? 'text-white' : 'text-neutral-300'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full ml-2 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-600">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {notification.athleteName && (
                          <span className="text-xs text-neutral-600">
                            • {notification.athleteName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State Helper */}
      {filteredNotifications.length > 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-neutral-600">You've reached the end</p>
        </div>
      )}
    </div>
  );
}