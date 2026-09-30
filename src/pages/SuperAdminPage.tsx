import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { AuditLog, SystemSettings } from '../types/index.ts';
import {
  ShieldAlert,
  Sliders,
  Database,
  Activity,
  Lock,
  RefreshCw,
  Save,
  CheckCircle,
  FileText
} from 'lucide-react';

export const SuperAdminPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [settings, setSettings] = useState<SystemSettings>({
    platformFeePercent: 10,
    workerWelfarePercent: 2,
    cooperativeAdminPercent: 8,
    razorpaySandboxKey: 'rzp_test_SAHYOG_KANPUR_2026',
    emergencySearchRadiusKm: 15,
    autoAllocationTimeoutSec: 60,
    bhashiniVoiceEnabled: true,
    whatsappNotificationsActive: true
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'audit' | 'health'>('settings');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch('/api/v1/admin/settings'),
        fetch('/api/v1/admin/audit-logs')
      ]);
      if (sRes.ok) setSettings(await sRes.json());
      if (aRes.ok) setAuditLogs(await aRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('Platform fee configuration and system settings saved!');
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#12304A] text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-[#F4B942] text-xs font-bold mb-2 border border-slate-700">
            <Lock className="w-3.5 h-3.5" />
            <span>Tier-1 Super Admin Authorization</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            System Administration & Audit Controls
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Super Administrator: <span className="font-semibold text-white">{user?.name || 'Vikramaditya Rao'}</span> · SAHYOG Platform Core
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2 border border-slate-700 rounded-xl hover:bg-slate-800 text-slate-300 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'border-[#087F5B] text-[#087F5B]' : 'border-transparent text-slate-500'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Platform Fee & Rules</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'border-[#087F5B] text-[#087F5B]' : 'border-transparent text-slate-500'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeTab === 'health' ? 'border-[#087F5B] text-[#087F5B]' : 'border-transparent text-slate-500'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System & API Health</span>
        </button>
      </div>

      {/* TAB 1: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900">
            Cooperative Split & Commission Controls
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Platform Commission Fee (%): <span className="text-[#087F5B] font-extrabold">{settings.platformFeePercent}%</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Worker keeps remainder ({100 - settings.platformFeePercent}%)</p>
              <input
                type="range"
                min="5"
                max="15"
                value={settings.platformFeePercent}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings({
                    ...settings,
                    platformFeePercent: val,
                    cooperativeAdminPercent: val - settings.workerWelfarePercent
                  });
                }}
                className="w-full accent-[#087F5B] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Worker Welfare & Insurance Cut (%): <span className="text-blue-700 font-extrabold">{settings.workerWelfarePercent}%</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">Deducted from the 10% platform fee pool</p>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.workerWelfarePercent}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings({
                    ...settings,
                    workerWelfarePercent: val,
                    cooperativeAdminPercent: settings.platformFeePercent - val
                  });
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Razorpay Sandbox Key ID</label>
              <input
                type="text"
                value={settings.razorpaySandboxKey}
                onChange={(e) => setSettings({ ...settings, razorpaySandboxKey: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Emergency Search Radius (km)</label>
              <input
                type="number"
                value={settings.emergencySearchRadiusKm}
                onChange={(e) => setSettings({ ...settings, emergencySearchRadiusKm: Number(e.target.value) })}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save System Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Immutable Audit Trail Stream (Security & Financial Integrity)
          </h2>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 text-xs flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {log.entityType}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">By {log.userName} ({log.role})</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM HEALTH */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Database Engine</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-extrabold text-sm text-slate-900">Persistent Relational Store</p>
            </div>
            <p className="text-[11px] text-slate-500">ACID Transactions · PostGIS Spatial Geocoding · Kanpur Wards</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">REST API Gateway</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-extrabold text-sm text-slate-900">Express Node.js /api/v1</p>
            </div>
            <p className="text-[11px] text-slate-500">17 Endpoint Groups · Signature verification active</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">AI Forecasting Service</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-extrabold text-sm text-slate-900">Prophet-XGB Hybrid v2.6</p>
            </div>
            <p className="text-[11px] text-slate-500">94.2% accuracy · 7-day municipal ward projections</p>
          </div>
        </div>
      )}
    </div>
  );
};
