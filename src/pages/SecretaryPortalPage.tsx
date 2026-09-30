import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { Worker, Complaint, SkillCertificate, Cooperative } from '../types/index.ts';
import {
  FileCheck2,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Search,
  Check,
  X,
  FileText,
  DollarSign
} from 'lucide-react';

interface SecretaryPortalPageProps {
  onViewCertificate: (worker: Worker) => void;
}

export const SecretaryPortalPage: React.FC<SecretaryPortalPageProps> = ({ onViewCertificate }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { showToast, fetchNotifications } = useNotifications();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [certificates, setCertificates] = useState<SkillCertificate[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'members' | 'complaints' | 'reports'>('queue');
  const [resolutionText, setResolutionText] = useState<{ [id: string]: string }>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [wRes, cRes, certRes, coopRes] = await Promise.all([
        fetch('/api/v1/workers'),
        fetch('/api/v1/complaints'),
        fetch('/api/v1/certificates'),
        fetch('/api/v1/cooperatives')
      ]);

      if (wRes.ok) setWorkers(await wRes.json());
      if (cRes.ok) setComplaints(await cRes.json());
      if (certRes.ok) setCertificates(await certRes.json());
      if (coopRes.ok) setCooperatives(await coopRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveWorker = async (workerId: string) => {
    try {
      const res = await fetch(`/api/v1/workers/${workerId}/approve`, { method: 'POST' });
      if (res.ok) {
        showToast('Worker approved and signed QR Skill Certificate issued!');
        loadData();
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectWorker = async (workerId: string) => {
    try {
      const res = await fetch(`/api/v1/workers/${workerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Documentation incomplete' })
      });
      if (res.ok) {
        showToast('Worker application marked as rejected.');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    const note = resolutionText[complaintId] || 'Cooperative Secretary arbitrated and resolved the dispute satisfactorily.';
    try {
      const res = await fetch(`/api/v1/complaints/${complaintId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNote: note })
      });
      if (res.ok) {
        showToast('Complaint resolved and customer notified.');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingWorkers = workers.filter((w) => w.status === 'UNDER_REVIEW' || w.status === 'PENDING');
  const approvedWorkers = workers.filter((w) => w.status === 'APPROVED');
  const myCoop = cooperatives[0] || {
    name: 'Kalyanpur Shramik Sahyog Samiti Ltd.',
    registrationNumber: 'COOP/UP/KNP/2024/0981',
    memberCount: 148
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Secretary Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-emerald-50 text-[#087F5B] px-2 py-0.5 rounded border border-emerald-200 uppercase">
              Society Secretary Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">Reg: {myCoop.registrationNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#12304A] mt-1">
            {myCoop.name}
          </h1>
          <p className="text-xs text-slate-500">
            Secretary In-Charge: <span className="font-semibold text-slate-800">{user?.name || 'Alok Nath Mishra'}</span> · Kalyanpur Ward 24, Kanpur
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {[
          { id: 'queue', label: `Pending Approvals (${pendingWorkers.length})`, icon: FileCheck2 },
          { id: 'members', label: `Approved Members (${approvedWorkers.length})`, icon: Users },
          { id: 'complaints', label: `Grievances (${complaints.filter((c) => c.status === 'OPEN').length})`, icon: AlertTriangle },
          { id: 'reports', label: 'Cooperative Audit & Financials', icon: DollarSign }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                isActive
                  ? 'border-[#087F5B] text-[#087F5B]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PENDING WORKER APPLICATIONS QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Worker Applications Awaiting Verification & QR Certificate Issuance
            </h2>
          </div>

          {pendingWorkers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800">All applications processed.</p>
              <p>No workers in review queue.</p>
            </div>
          ) : (
            pendingWorkers.map((worker) => (
              <div
                key={worker.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{worker.name}</h3>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                          {worker.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{worker.phone} · {worker.address}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Experience: <span className="font-semibold">{worker.experienceYears} Years</span> · Proposed Skills: {worker.approvedSkills.join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Approve & Issue Signed Certificate */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRejectWorker(worker.id)}
                      className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApproveWorker(worker.id)}
                      className="px-4 py-2 bg-[#087F5B] hover:bg-[#066347] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Award className="w-4 h-4" />
                      <span>Approve & Issue QR Certificate</span>
                    </button>
                  </div>
                </div>

                {/* Submitted Documents Inspection Checklist */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Aadhaar Authenticated ✓</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Police Verification Clear ✓</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>UPI Bank Account Linked ✓</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: APPROVED MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedWorkers.map((w) => (
              <div
                key={w.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img src={w.avatar} alt={w.name} className="w-12 h-12 rounded-full object-cover border border-emerald-500" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-slate-900">{w.name}</p>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#087F5B]" />
                    </div>
                    <p className="text-[11px] font-mono text-emerald-700">{w.qrCertificateId}</p>
                    <p className="text-[11px] text-slate-500">⭐ {w.rating} · {w.completedJobs} jobs</p>
                  </div>
                </div>

                <button
                  onClick={() => onViewCertificate(w)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>Inspect QR</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GRIEVANCES */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          {complaints.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No grievances registered.</p>
          ) : (
            complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-800">#{c.complaintCode}</span>
                    <h3 className="font-bold text-sm text-slate-900 mt-0.5">{c.subject}</h3>
                    <p className="text-xs text-slate-500">Customer: {c.customerName} · Worker: {c.workerName}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  "{c.description}"
                </p>

                {c.status === 'OPEN' ? (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Enter resolution notes (e.g. Worker revisited and resolved)"
                      value={resolutionText[c.id] || ''}
                      onChange={(e) => setResolutionText({ ...resolutionText, [c.id]: e.target.value })}
                      className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none"
                    />
                    <button
                      onClick={() => handleResolveComplaint(c.id)}
                      className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Arbitrate & Resolve
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-800 font-medium">
                    ✓ Resolution Note: {c.resolutionNote}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: AUDIT & FINANCIALS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Cooperative Member Payouts</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">₹4,28,400</p>
              <span className="text-[10px] text-slate-400">90% direct to worker wallets</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Society Administration (8%)</span>
              <p className="text-2xl font-black text-slate-900 mt-1">₹38,080</p>
              <span className="text-[10px] text-slate-400">Cooperative operations & tooling fund</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] text-slate-500 uppercase font-bold block">Worker Welfare Pool (2%)</span>
              <p className="text-2xl font-black text-blue-700 mt-1">₹9,520</p>
              <span className="text-[10px] text-blue-600">PM Suraksha Bima premiums subsidized</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
