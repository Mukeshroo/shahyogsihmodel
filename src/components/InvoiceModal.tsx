import React from 'react';
import { Invoice } from '../types/index.ts';
import { X, Printer, Download, CheckCircle, FileText, Shield } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Invoice Sheet */}
        <div id="invoice-sheet" className="p-4 sm:p-6 border border-slate-200 rounded-xl bg-white">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-start pb-6 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-tight text-[#12304A]">
                  SAHYOG
                </span>
                <span className="text-xs font-bold text-[#087F5B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  COOPERATIVE INVOICE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{invoice.cooperativeName}</p>
              <p className="text-[11px] text-slate-400">GSTIN / Reg No: {invoice.cooperativeGst} · Kanpur Nagar, UP</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-semibold">INVOICE NO.</span>
              <span className="font-mono text-xs font-bold text-slate-900">{invoice.invoiceNumber}</span>
              <p className="text-[11px] text-slate-500 mt-1">Date: {new Date(invoice.issuedAt).toLocaleDateString()}</p>
              <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs font-bold mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{invoice.paymentStatus}</span>
              </div>
            </div>
          </div>

          {/* Customer & Worker Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Billed To (Customer)</span>
              <p className="font-bold text-slate-900">{invoice.customerName}</p>
              <p className="text-slate-600">{invoice.customerPhone}</p>
              <p className="text-slate-500 mt-0.5">{invoice.customerAddress}</p>
            </div>

            <div>
              <span className="text-slate-400 uppercase font-bold text-[10px] block mb-1">Service Performed By</span>
              <p className="font-bold text-slate-900">{invoice.workerName}</p>
              <p className="text-emerald-700 font-semibold font-mono text-[11px]">QR Cert: {invoice.workerCertificateId}</p>
              <p className="text-slate-500">{invoice.cooperativeName}</p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold text-[10px] uppercase text-left">
                  <th className="py-2">Service Description</th>
                  <th className="py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3">
                    <p className="font-bold text-slate-800">{invoice.serviceName}</p>
                    <p className="text-[11px] text-slate-500">Booking Code: #{invoice.bookingCode}</p>
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-800">
                    ₹{invoice.baseAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transparent Cooperative Ledger Breakdown */}
          <div className="mt-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 mb-2 text-[#087F5B] font-bold">
              <Shield className="w-4 h-4" />
              <span>Transparent Cooperative Financial Split</span>
            </div>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Worker Direct Share (90%):</span>
                <span className="font-bold text-emerald-800">₹{invoice.workerShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cooperative Operations & Tech (8%):</span>
                <span>₹{invoice.platformCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Worker Welfare & Insurance Pool (2%):</span>
                <span>₹{invoice.welfareContribution.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-extrabold text-sm">
                <span>Total Paid:</span>
                <span>₹{invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Payment Method: {invoice.paymentMethod}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Thank you for supporting community worker cooperatives in Kanpur. Every gig directly empowers local tradespeople.
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
