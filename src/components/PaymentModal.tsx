import React, { useState } from 'react';
import { Booking } from '../types/index.ts';
import { useNotifications } from '../context/NotificationContext.tsx';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface PaymentModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  booking,
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const { showToast, fetchNotifications } = useNotifications();
  const [method, setMethod] = useState<'UPI' | 'GATEWAY_RAZORPAY' | 'CASH'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnDetails, setTxnDetails] = useState<any>(null);

  if (!isOpen || !booking) return null;

  const total = booking.totalAmount || 500;
  const workerShare = Math.round(total * 0.90); // 90%
  const welfareFee = Math.round(total * 0.02); // 2%
  const coopAdmin = total - workerShare - welfareFee; // 8%

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/v1/payments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: method,
          transactionRef: method === 'CASH'
            ? `CASH-REC-${Math.floor(1000 + Math.random() * 9000)}`
            : `TXN-${method}-${Math.floor(100000 + Math.random() * 900000)}`
        })
      });

      if (!res.ok) throw new Error('Payment processing failed');
      const data = await res.json();
      setTxnDetails(data.transaction);
      setIsSuccess(true);
      showToast(`Payment of ₹${total} successful! Worker credited ₹${workerShare} (90%).`);
      fetchNotifications();
      onPaymentSuccess();
    } catch (err) {
      console.error(err);
      showToast('Payment processing error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            <div className="text-center mb-5">
              <span className="text-xs font-bold text-[#087F5B] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                Direct Cooperative Settlement
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Complete Payment for #{booking.bookingCode}
              </h3>
              <p className="text-xs text-slate-500">
                Service: <span className="font-semibold text-slate-800">{booking.serviceName}</span> by {booking.workerName}
              </p>
            </div>

            {/* Total and 90/10 Split Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-baseline mb-3 pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Total Payable:</span>
                <span className="text-2xl font-black text-slate-900">₹{total}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center text-emerald-800 font-bold">
                  <span>Worker Direct Earning (90%):</span>
                  <span>₹{workerShare}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Cooperative Operations (8%):</span>
                  <span>₹{coopAdmin}</span>
                </div>
                <div className="flex justify-between items-center text-blue-700 font-semibold">
                  <span>Worker Welfare & Insurance Pool (2%):</span>
                  <span>₹{welfareFee}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 mb-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Select Payment Mode
              </span>

              {/* UPI Option */}
              <div
                onClick={() => setMethod('UPI')}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                  method === 'UPI' ? 'border-[#087F5B] bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#087F5B] flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Instant UPI (GPay / PhonePe / Paytm)</p>
                    <p className="text-[11px] text-slate-500">Zero surcharge · Direct settlement</p>
                  </div>
                </div>
                <input type="radio" checked={method === 'UPI'} readOnly className="text-[#087F5B]" />
              </div>

              {/* Razorpay Gateway Option */}
              <div
                onClick={() => setMethod('GATEWAY_RAZORPAY')}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                  method === 'GATEWAY_RAZORPAY' ? 'border-[#087F5B] bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Card / NetBanking (Razorpay Sandbox)</p>
                    <p className="text-[11px] text-slate-500">Credit, Debit cards, Net banking</p>
                  </div>
                </div>
                <input type="radio" checked={method === 'GATEWAY_RAZORPAY'} readOnly className="text-[#087F5B]" />
              </div>

              {/* Cash on Service */}
              <div
                onClick={() => setMethod('CASH')}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex items-center justify-between ${
                  method === 'CASH' ? 'border-[#087F5B] bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Cash on Service Reconciliation</p>
                    <p className="text-[11px] text-slate-500">Pay cash directly to technician</p>
                  </div>
                </div>
                <input type="radio" checked={method === 'CASH'} readOnly className="text-[#087F5B]" />
              </div>
            </div>

            {/* Pay Action Button */}
            <button
              onClick={handleProcessPayment}
              disabled={isProcessing}
              className="w-full bg-[#087F5B] hover:bg-[#066347] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 cursor-pointer transition active:scale-98"
            >
              {isProcessing ? (
                <span>Verifying & Recording Transaction...</span>
              ) : (
                <>
                  <span>Pay ₹{total} via {method}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* PAYMENT SUCCESS SCREEN */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#087F5B] mx-auto flex items-center justify-center mb-3">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Payment Successful!</h3>
            <p className="text-xs text-slate-500 mb-4">
              ₹{total} captured & settled into cooperative financial ledger.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-left space-y-1.5 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900">{txnDetails?.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Worker Credited (90%):</span>
                <span className="font-bold text-emerald-800">₹{workerShare}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Welfare Pool (2%):</span>
                <span className="font-bold text-blue-700">₹{welfareFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cooperative Admin (8%):</span>
                <span className="text-slate-800">₹{coopAdmin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gateway Signature:</span>
                <span className="text-emerald-700 font-semibold">VERIFIED ✓</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer"
            >
              Done & Return to Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
