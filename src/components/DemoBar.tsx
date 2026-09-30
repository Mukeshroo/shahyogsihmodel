import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { UserRole } from '../types/index.ts';
import { ShieldCheck, UserCheck, RefreshCw, MapPin } from 'lucide-react';

interface DemoBarProps {
  onOpenSos: () => void;
  onOpenVoice: () => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({ onOpenSos, onOpenVoice }) => {
  const { user, switchRole, loading } = useAuth();
  const { language } = useLanguage();

  const roles: { role: UserRole; label: string; desc: string; icon: string }[] = [
    { role: 'customer', label: '1. Customer', desc: 'Priya Sharma (Book services, pay, rate)', icon: '👤' },
    { role: 'worker', label: '2. Worker', desc: 'Ramesh Verma (Accept gigs, verify OTP, earn 90%)', icon: '⚡' },
    { role: 'secretary', label: '3. Secretary', desc: 'Alok Nath Mishra (Approve workers, issue QR certs)', icon: '📋' },
    { role: 'federation', label: '4. Federation', desc: 'Dr. Archana Bajpai (State analytics, fairness)', icon: '🏛️' },
    { role: 'admin', label: '5. Super Admin', desc: 'Vikramaditya Rao (10% fee rules, audit logs)', icon: '⚙️' }
  ];

  return (
    <div className="bg-[#12304A] text-white text-xs border-b border-slate-700/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Hackathon info */}
        <div className="flex items-center gap-2">
          <span className="bg-[#087F5B] text-white font-bold px-2 py-0.5 rounded text-[11px] tracking-wide">
            SIH 2026 #26089
          </span>
          <span className="font-semibold text-slate-200 hidden sm:inline">
            Team CYBER KNIGHTS01
          </span>
          <span className="text-slate-400 hidden md:inline">·</span>
          <span className="flex items-center gap-1 text-slate-300">
            <MapPin className="w-3 h-3 text-[#F4B942]" />
            <span>Kanpur, UP Pilot</span>
          </span>
        </div>

        {/* Center: 1-Click Role Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-slate-400 mr-1 hidden lg:inline font-medium">Switch Role:</span>
          {roles.map((r) => {
            const isActive = user?.role === r.role;
            return (
              <button
                key={r.role}
                onClick={() => switchRole(r.role)}
                disabled={loading}
                title={r.desc}
                className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#087F5B] text-white shadow-sm ring-1 ring-emerald-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Quick SOS trigger & Active user badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSos}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer animate-pulse transition"
          >
            <span>🚨</span>
            <span>SOS</span>
          </button>
          <div className="text-right hidden xl:block">
            <span className="text-slate-300 font-medium">
              {user?.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
