import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { WorkerWelfare } from '../types/index.ts';
import {
  ShieldCheck,
  HeartHandshake,
  FileCheck2,
  AlertCircle,
  PlusCircle,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const WelfarePage: React.FC = () => {
  const { user, workerProfile } = useAuth();
  const { language } = useLanguage();
  const { showToast } = useNotifications();

  const [welfareList, setWelfareList] = useState<WorkerWelfare[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimType, setClaimType] = useState('Tool accidental damage subsidy');
  const [claimAmount, setClaimAmount] = useState('3000');
  const [showClaimModal, setShowClaimModal] = useState(false);

  const activeWorkerId = workerProfile?.id || 'work-1';

  const loadWelfare = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/welfare');
      if (res.ok) {
        const data = await res.json();
        setWelfareList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWelfare();
  }, []);

  const handleFileClaim = async () => {
    try {
      const res = await fetch(`/api/v1/welfare/${activeWorkerId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: claimType, amount: claimAmount })
      });
      if (res.ok) {
        showToast('Welfare & Insurance claim filed! Under review by Cooperative Secretary.');
        setShowClaimModal(false);
        loadWelfare();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeRecord = welfareList.find((w) => w.workerId === activeWorkerId) || welfareList[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#12304A] text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <HeartHandshake className="w-4 h-4" />
            <span>2% Gig Contribution · Zero Worker Premium Burden</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Worker Welfare, Healthcare & Group Insurance
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Every booking automatically funnels 2% into the Sahyog Community Insurance Pool.
          </p>
        </div>

        <button
          onClick={() => setShowClaimModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>File Welfare / Damage Claim</span>
        </button>
      </div>

      {/* Insurance Policy Highlights */}
      {activeRecord && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Enrolled Member</span>
              <h2 className="text-base font-bold text-slate-900">{activeRecord.workerName}</h2>
              <p className="text-xs text-slate-500">{activeRecord.cooperativeName}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Policy Number</span>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                {activeRecord.policyNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Sum Insured</span>
              <span className="text-base font-black text-slate-900">₹{activeRecord.coverageAmount?.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">Accidental & Critical Disability</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Annual Premium</span>
              <span className="text-base font-black text-slate-900">₹{activeRecord.annualPremium}</span>
              <span className="text-[10px] text-emerald-700 block mt-0.5">100% Subsidized by Sahyog Pool</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Welfare Contributions</span>
              <span className="text-base font-black text-emerald-800">₹{activeRecord.totalContributionsFromGigs || 1692}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">2% accrued from completed gigs</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Policy Status</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">
                ✓ {activeRecord.status}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Renewal: {activeRecord.renewalDate}</span>
            </div>
          </div>

          {/* Scheme Details */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/60 text-xs text-emerald-900">
            <p className="font-bold">Active Scheme: {activeRecord.insuranceScheme}</p>
            <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
              Covers 24/7 on-the-job accidental hospitalization, critical tool breakage replacement subsidy up to ₹5,000, and comprehensive death/disability compensation under the UP State Cooperative Workers Charter.
            </p>
          </div>

          {/* Claims History */}
          <div className="pt-2 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Claims History & Settlements</h3>
            {(activeRecord.claims || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No insurance claims filed yet.</p>
            ) : (
              <div className="space-y-2">
                {activeRecord.claims.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{c.type}</p>
                      <p className="text-[10px] text-slate-400">Filed on: {c.filedDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-800 block">₹{c.amount}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLAIM FILING MODAL */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">File Welfare / Damage Claim</h3>
            <p className="text-xs text-slate-500">
              Submit claim against your 2% cooperative welfare balance or group accidental cover.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Claim Type</label>
              <select
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="Tool accidental damage subsidy">Tool accidental damage subsidy</option>
                <option value="Minor medical reimbursement (on-duty)">Minor medical reimbursement (on-duty)</option>
                <option value="Family emergency education grant">Family emergency welfare aid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Claim Amount (₹)</label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClaimModal(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleFileClaim}
                className="px-4 py-2 bg-[#087F5B] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Submit Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
