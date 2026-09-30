import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import {
  Bell,
  Globe,
  Mic,
  AlertTriangle,
  Menu,
  X,
  Shield,
  Briefcase,
  TrendingUp,
  HeartHandshake,
  CheckCircle,
  FileCheck2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSos: () => void;
  onOpenVoice: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSos,
  onOpenVoice
}) => {
  const { user, workerProfile, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const getNavLinks = () => {
    const common = [
      { id: 'home', label: t('home') },
      { id: 'search', label: t('findServices') }
    ];

    if (user?.role === 'customer') {
      common.push({ id: 'customer', label: t('myBookings') });
    } else if (user?.role === 'worker') {
      common.push({ id: 'worker', label: t('workerPortal') });
    } else if (user?.role === 'secretary') {
      common.push({ id: 'secretary', label: t('secretaryPortal') });
    } else if (user?.role === 'federation') {
      common.push({ id: 'federation', label: t('federationPortal') });
    } else if (user?.role === 'admin') {
      common.push({ id: 'admin', label: t('superAdmin') });
    }

    common.push({ id: 'forecast', label: t('aiForecast') });
    common.push({ id: 'welfare', label: t('welfareInsurance') });
    return common;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white border-b border-slate-200/80 sticky top-[33px] z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-10 h-10 rounded-xl bg-[#087F5B] flex items-center justify-center text-white shadow-xs">
              <svg className="w-6 h-6" viewBox="0 0 512 512" fill="none">
                <circle cx="256" cy="160" r="48" fill="#F4B942" />
                <path d="M140 380 C 140 280, 200 240, 256 240 C 312 240, 372 280, 372 380 Z" fill="#FFFFFF" fillOpacity="0.95"/>
                <path d="M190 280 L 256 340 L 322 280" stroke="#087F5B" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="256" cy="340" r="16" fill="#F4B942"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-[#12304A]">
                  SAHYOG
                </span>
                <span className="text-xs font-semibold text-[#087F5B] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  सहयोग
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                {language === 'hi' ? 'स्थानीय हुनर · निष्पक्ष काम · 90% हिस्सेदारी' : 'Cooperative Gig Platform · 90% to Workers'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition cursor-pointer ${
                    isActive
                      ? 'text-[#087F5B] bg-emerald-50/80 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Right Action Icons: Voice, SOS, Language, Notification, User */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Voice Booking Button */}
            <button
              onClick={onOpenVoice}
              title={t('voiceSearch')}
              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition flex items-center gap-1.5 text-xs font-medium"
            >
              <Mic className="w-4 h-4 text-[#087F5B]" />
              <span className="hidden sm:inline text-slate-700 font-semibold">बोलें</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              onClick={onOpenSos}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>SOS</span>
            </button>

            {/* Language Toggle (EN / हिन्दी) */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 border border-slate-200 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-[#087F5B]" />
              <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {language === 'hi' ? 'सूचनाएं' : 'Notifications'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {unreadCount} unread
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.actionUrl) {
                              onNavigate(n.actionUrl.replace('/', ''));
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${
                            !n.read ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-800">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {n.channel === 'WHATSAPP' ? '📱 WhatsApp' : '🔔 App'}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar / Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={user?.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-xs text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{user?.role} · {user?.district}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate(user?.role || 'customer');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Dashboard ({user?.role})
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('welfare');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Welfare & Insurance
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('verify');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Verify Skill Certificate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu hamburger */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentView === link.id
                  ? 'text-[#087F5B] bg-emerald-50 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Logged in: {user?.name} ({user?.role})</span>
          </div>
        </div>
      )}
    </nav>
  );
};
