import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { SkillCertificate } from '../types/index.ts';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  Building2,
  ExternalLink,
  Printer,
  QrCode,
  Search
} from 'lucide-react';

interface PublicVerifyPageProps {
  initialCertificateId?: string;
}

export const PublicVerifyPage: React.FC<PublicVerifyPageProps> = ({ initialCertificateId }) => {
  const [certId, setCertId] = useState<string>(initialCertificateId || 'CERT-KNP-2026-ELEC-0492');
  const [certificate, setCertificate] = useState<SkillCertificate | null>(null);
  const [workerData, setWorkerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const verifyCertificate = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v1/certificates/verify/${idToVerify.trim()}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCertificate(null);
        setWorkerData(null);
        setErrorMsg(data.message || 'Invalid or revoked certificate in SAHYOG registry.');
      } else {
        setCertificate(data.certificate);
        setWorkerData(data.worker);

        const verifyUrl = `${window.location.origin}/verify/${data.certificate.certificateNumber}`;
        QRCode.toDataURL(verifyUrl, { width: 140, margin: 1 })
          .then((url) => setQrDataUrl(url))
          .catch(() => {});
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to verification server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certId) {
      verifyCertificate(certId);
    }
  }, [certId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#087F5B] text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>Government of UP Cooperative Societies Registry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#12304A]">
          Public Worker Skill & Identity Verification
        </h1>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Verify digital credentials, background check validation, and certified skills for any cooperative technician in Kanpur.
        </p>
      </div>

      {/* Certificate Search / Input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400 pl-1" />
        <input
          type="text"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="Enter Certificate ID (e.g. CERT-KNP-2026-ELEC-0492)"
          className="flex-1 text-xs sm:text-sm py-1.5 focus:outline-none font-mono"
        />
        <button
          onClick={() => verifyCertificate(certId)}
          className="bg-[#087F5B] hover:bg-[#066347] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition"
        >
          Verify Online
        </button>
      </div>

      {/* Verification Result Card */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Validating cryptographic registry...</div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-rose-900">Certificate Verification Failed</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMsg}</p>
        </div>
      ) : certificate && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-xl space-y-6">
          {/* Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">OFFICIALLY VERIFIED & ACTIVE</span>
                <span className="text-[10px] text-emerald-700">Aadhaar verified · Police cleared · Cooperative member</span>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-800">
              #{certificate.certificateNumber}
            </span>
          </div>

          {/* Worker Info */}
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={workerData?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
              alt={certificate.workerName}
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
            />
            <div>
              <h2 className="text-xl font-black text-slate-900">{certificate.workerName}</h2>
              <p className="text-xs text-slate-600 font-medium">{certificate.cooperativeName}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span>⭐ {workerData?.rating || '4.9'} rating</span>
                <span>·</span>
                <span>{workerData?.completedJobs || 142} verified gigs completed</span>
                <span>·</span>
                <span>{workerData?.experienceYears || 8} years experience</span>
              </div>
            </div>
          </div>

          {/* Approved Trade Skills */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Certified Trade Proficiencies
            </span>
            <div className="flex flex-wrap gap-2">
              {certificate.skills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-200"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Issue & Expiry Dates</span>
              <span className="font-semibold text-slate-800">{certificate.issueDate} to {certificate.expiryDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Issuing Authority</span>
              <span className="font-semibold text-slate-800">{certificate.authorizedBy}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cryptographic Digital Signature (SHA-256)</span>
              <span className="font-mono text-[10px] text-slate-600 break-all">{certificate.signatureHash}</span>
            </div>
          </div>

          {/* Scannable Stamp */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-medium">
              Registered with UP Cooperative Societies Portal
            </span>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer font-semibold text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Validation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
