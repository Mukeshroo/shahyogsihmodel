import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { Cooperative, Worker } from '../types/index.ts';
import {
  Building2,
  TrendingUp,
  Download,
  ShieldCheck,
  Users,
  CheckCircle,
  RefreshCw,
  Sparkles,
  PieChart,
  Activity,
  Layers
} from 'lucide-react';

export const FederationPortalPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useNotifications();

  const [analytics, setAnalytics] = useState<any>(null);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFederationData = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        fetch('/api/v1/analytics/overview'),
        fetch('/api/v1/cooperatives')
      ]);
      if (aRes.ok) setAnalytics(await aRes.json());
      if (cRes.ok) setCooperatives(await cRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFederationData();
  }, []);

  const exportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Cooperative Name,District,Registration,Members,Commission Rate,Welfare Rate\n' +
      cooperatives
        .map((c) => `"${c.name}","${c.district}","${c.registrationNumber}",${c.memberCount},${c.commissionRate}%,${c.welfareRate}%`)
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sahyog_federation_report_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Federation Data to CSV');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Federation Header */}
      <div className="bg-[#12304A] text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F4B942] bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            State Regulatory Federation Oversight
          </span>
          <h1 className="text-xl sm:text-2xl font-black mt-2">
            UP State Gig & Platform Workers Cooperative Federation
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Federation Director: <span className="text-white font-semibold">{user?.name || 'Dr. Archana Bajpai'}</span> · Regional Head: Kanpur Pilot
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>
          <button
            onClick={loadFederationData}
            className="p-2 border border-slate-700 rounded-xl hover:bg-slate-800 text-slate-300 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Affiliated Cooperatives</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{cooperatives.length}</p>
          <span className="text-[10px] text-emerald-700 block">Kanpur Nagar pilot active</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Total Verified Workers</span>
          <p className="text-2xl font-black text-[#087F5B] mt-1">{analytics?.totalWorkers || 5}</p>
          <span className="text-[10px] text-slate-500 block">100% Aadhaar & Skill Verified</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Worker Payout Volume (90%)</span>
          <p className="text-2xl font-black text-emerald-800 mt-1">₹{analytics?.workerEarnings?.toLocaleString() || '14,800'}</p>
          <span className="text-[10px] text-slate-500 block">Zero corporate leakage</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold block">Worker Welfare Pool (2%)</span>
          <p className="text-2xl font-black text-blue-700 mt-1">₹{analytics?.welfarePool?.toLocaleString() || '1,200'}</p>
          <span className="text-[10px] text-blue-600 block">Accumulated for Group PMSBY</span>
        </div>
      </div>

      {/* FAIR WORK ALLOCATION AUDIT MONITOR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#087F5B]" />
              <h2 className="text-base font-bold text-slate-900">
                Fair Work Allocation & Anti-Monopoly Rotation Engine
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated ranking prevents job concentration among 1-2 star workers, distributing livelihood equitably.
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Current Fairness Rotation Index: 96.8% (Target &gt; 90%)
          </span>
        </div>

        {/* Scoring formula card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-800 block mb-1">Algorithmic Scoring Matrix:</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block">Trade Skill</span>
              <span className="font-bold text-[#087F5B]">30% Weight</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block">Distance (GPS)</span>
              <span className="font-bold text-blue-600">25% Weight</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block">Availability</span>
              <span className="font-bold text-purple-600">15% Weight</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block">Workload Balance</span>
              <span className="font-bold text-amber-600">15% Weight</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block">Rotation Equity</span>
              <span className="font-bold text-rose-600">15% Weight</span>
            </div>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">Recent Fair Allocation Audit Trail:</span>
          <div className="space-y-2">
            {(analytics?.fairAllocationLogs || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No allocations recorded yet.</p>
            ) : (
              (analytics?.fairAllocationLogs || []).map((log: any) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>Booking #{log.bookingId} ({log.serviceCategory})</span>
                    <span className="text-slate-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CROSS-SOCIETY BENCHMARKING TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Affiliated Cooperative Societies in Kanpur Pilot
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-left">
                <th className="py-2.5">Society Name</th>
                <th className="py-2.5">Registration</th>
                <th className="py-2.5">Secretary</th>
                <th className="py-2.5 text-center">Active Members</th>
                <th className="py-2.5 text-right">Fee Split</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cooperatives.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 font-mono text-slate-500">{c.registrationNumber}</td>
                  <td className="py-3 text-slate-700">{c.secretaryName}</td>
                  <td className="py-3 text-center font-bold text-emerald-800">{c.memberCount}</td>
                  <td className="py-3 text-right text-slate-600">
                    90% Worker / {c.commissionRate}% Coop
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
