import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { SkillCertificate, Worker } from '../types/index.ts';
import { ShieldCheck, X, Download, Printer, CheckCircle, ExternalLink, Award } from 'lucide-react';

interface CertificateModalProps {
  certificate: SkillCertificate | null;
  worker?: Worker | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  certificate,
  worker,
  isOpen,
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (certificate) {
      const verifyUrl = `${window.location.origin}/verify/${certificate.certificateNumber}`;
      QRCode.toDataURL(verifyUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#12304A',
          light: '#FFFFFF'
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [certificate]);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Container with Decorative Border */}
        <div className="border-4 border-double border-[#087F5B]/40 rounded-xl p-6 bg-radial from-emerald-50/20 via-white to-amber-50/10">
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="inline-flex items-center gap-2 mb-1">
              <Award className="w-6 h-6 text-[#087F5B]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#087F5B]">
                Sahyog Cooperative Registry
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#12304A] tracking-tight">
              SKILL & TRADE CERTIFICATE
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Registered Under UP Cooperative Societies Act 1965 · Kanpur Nagar District
            </p>
          </div>

          {/* Certificate Body */}
          <div className="py-5 text-center">
            <p className="text-xs text-slate-500 italic mb-1">This is to certify that</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              {certificate.workerName}
            </h3>
            <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
              has completed verified background verification, Aadhaar authentication, and technical trade skill appraisal with
            </p>
            <p className="text-sm font-bold text-[#087F5B] mt-1">
              {certificate.cooperativeName}
            </p>

            {/* Approved Skills */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {certificate.skills.map((skill, i) => (
                <span
                  key={i}
                  className="bg-emerald-100/70 text-[#087F5B] text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-200"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>

            {/* Certificate Details & QR */}
            <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center text-left">
              {/* Left Column: Metadata */}
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificate Number</span>
                  <span className="font-mono font-bold text-slate-800">{certificate.certificateNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    <CheckCircle className="w-3 h-3" />
                    <span>VERIFIED & ACTIVE</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Valid Period</span>
                  <span className="text-slate-700 font-medium">{certificate.issueDate} to {certificate.expiryDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized Signatory</span>
                  <span className="text-slate-700 font-medium">{certificate.authorizedBy}</span>
                </div>
              </div>

              {/* Right Column: Scannable QR Code */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Verification" className="w-28 h-28 object-contain" />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 animate-pulse rounded" />
                )}
                <span className="text-[10px] text-slate-500 font-mono mt-1 text-center font-medium">
                  Scan to verify online
                </span>
              </div>
            </div>

            {/* Cryptographic SHA-256 Hash Footprint */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono break-all text-left">
              <span className="font-bold">Digital Signature SHA-256: </span>
              {certificate.signatureHash}
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <a
            href={certificate.verificationUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#087F5B] hover:underline font-semibold flex items-center gap-1"
          >
            <span>Open Public Verification Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => {
                if (qrDataUrl) {
                  const link = document.createElement('a');
                  link.download = `${certificate.certificateNumber}.png`;
                  link.href = qrDataUrl;
                  link.click();
                }
              }}
              className="px-3 py-1.5 bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
