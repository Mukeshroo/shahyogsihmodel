import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { Booking, Invoice } from '../types/index.ts';
import {
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Star,
  MessageSquare,
  Sparkles,
  Phone,
  RefreshCw,
  Award
} from 'lucide-react';

interface CustomerDashboardPageProps {
  onOpenPayment: (booking: Booking) => void;
  onOpenInvoice: (invoice: Invoice) => void;
  onOpenBooking: () => void;
}

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({
  onOpenPayment,
  onOpenInvoice,
  onOpenBooking
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { showToast, fetchNotifications } = useNotifications();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalBooking, setRatingModalBooking] = useState<Booking | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [complaintModalBooking, setComplaintModalBooking] = useState<Booking | null>(null);
  const [complaintSubject, setComplaintSubject] = useState<string>('');
  const [complaintDesc, setComplaintDesc] = useState<string>('');

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/bookings?customerId=${user?.id || 'user-cust-1'}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRate = async () => {
    if (!ratingModalBooking) return;
    try {
      const res = await fetch(`/api/v1/bookings/${ratingModalBooking.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingScore, comment: ratingComment })
      });
      if (res.ok) {
        showToast('Thank you for rating your cooperative worker!');
        setRatingModalBooking(null);
        setRatingComment('');
        loadBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplaint = async () => {
    if (!complaintModalBooking) return;
    try {
      const res = await fetch('/api/v1/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: complaintModalBooking.id,
          customerId: user?.id || 'user-cust-1',
          subject: complaintSubject,
          description: complaintDesc
        })
      });
      if (res.ok) {
        showToast('Complaint submitted to Cooperative Secretary for resolution.');
        setComplaintModalBooking(null);
        setComplaintSubject('');
        setComplaintDesc('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadInvoice = async (booking: Booking) => {
    try {
      const res = await fetch(`/api/v1/invoices/${booking.id}`);
      if (res.ok) {
        const inv: Invoice = await res.json();
        onOpenInvoice(inv);
      } else {
        showToast('Invoice is generating, please wait a moment.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stepsList = [
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'ON_THE_WAY', label: 'On The Way' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 0;
      case 'ACCEPTED': return 1;
      case 'ON_THE_WAY': return 2;
      case 'ARRIVED': return 2;
      case 'IN_PROGRESS': return 3;
      case 'COMPLETED': return 4;
      default: return 0;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#12304A]">
            {language === 'hi' ? 'मेरी बुकिंग्स व सेवा ट्रैकर' : 'My Bookings & Service Tracker'}
          </h1>
          <p className="text-xs text-slate-500">
            Real-time status updates with OTP verification and 90/10 cooperative invoice
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadBookings}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh Bookings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenBooking}
            className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer shadow-xs"
          >
            + Book New Service
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">No bookings found yet.</p>
          <p className="text-xs text-slate-400">Need household maintenance? Book an electrician, plumber, or cleaning technician in Kanpur.</p>
          <button
            onClick={onOpenBooking}
            className="mt-2 bg-[#087F5B] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
          >
            Book Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const currentStepIdx = getStepIndex(booking.status);
            const isFinished = booking.status === 'COMPLETED';

            return (
              <div
                key={booking.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-5"
              >
                {/* Top Row: Code, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      #{booking.bookingCode}
                    </span>
                    {booking.isEmergency && (
                      <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded">
                        🚨 EMERGENCY SOS
                      </span>
                    )}
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-xs text-slate-500">{new Date(booking.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        booking.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : booking.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Worker & Service Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: Service & Address */}
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-base font-bold text-slate-900">{booking.serviceName}</h3>
                    <p className="text-xs text-slate-600 italic">"{booking.description}"</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                      <span>{booking.address} ({booking.area})</span>
                    </div>

                    {/* Fair Allocation Explanation Badge */}
                    {booking.allocationDetails && (
                      <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg p-2 text-[11px] text-emerald-800 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                        <span>{booking.allocationDetails.explanation}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Assigned Worker & OTP Card */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    {booking.assignedWorkerId ? (
                      <div>
                        <div className="flex items-center gap-2.5">
                          <img
                            src={booking.workerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                            alt={booking.workerName || 'Worker'}
                            className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">{booking.workerName}</p>
                            <p className="text-[11px] text-slate-500">Verified Cooperative Worker</p>
                          </div>
                        </div>

                        {/* Customer Safety OTP (Crucial feature) */}
                        {!isFinished && (
                          <div className="mt-2 pt-2 border-t border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">
                              Customer Verification OTP
                            </span>
                            <span className="font-mono text-xl font-black text-[#087F5B] tracking-widest">
                              {booking.otpCode}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">Share with worker when they arrive.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-slate-500">
                        <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1 animate-spin" />
                        <span>Matching nearest verified technician...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="pt-2">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {stepsList.map((st, i) => {
                      const isPassed = i <= currentStepIdx;
                      const isCurrent = i === currentStepIdx;
                      return (
                        <div key={st.key} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isPassed ? 'bg-[#087F5B]' : 'bg-slate-200'
                            }`}
                          />
                          <span
                            className={`text-[10px] block truncate font-semibold ${
                              isCurrent ? 'text-[#087F5B]' : isPassed ? 'text-slate-700' : 'text-slate-400'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">Total:</span>
                    <span className="font-bold text-slate-900 text-sm">₹{booking.totalAmount}</span>
                    <span className="text-slate-400">·</span>
                    <span className={booking.paymentStatus === 'PAID' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {booking.paymentStatus === 'PAID' ? '✓ Paid' : 'Pending Payment'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Pay Button if not paid */}
                    {booking.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => onOpenPayment(booking)}
                        className="bg-[#087F5B] hover:bg-[#066347] text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay ₹{booking.totalAmount} (UPI/Card)</span>
                      </button>
                    )}

                    {/* Download Invoice Button */}
                    {booking.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleDownloadInvoice(booking)}
                        className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Download Invoice</span>
                      </button>
                    )}

                    {/* Rate Worker Button */}
                    {booking.status === 'COMPLETED' && !booking.rating && (
                      <button
                        onClick={() => setRatingModalBooking(booking)}
                        className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Rate Worker</span>
                      </button>
                    )}

                    {/* Raise Grievance */}
                    <button
                      onClick={() => setComplaintModalBooking(booking)}
                      className="text-slate-400 hover:text-slate-600 font-medium px-2 py-1.5 cursor-pointer text-[11px]"
                    >
                      Need Help / Dispute?
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RATING MODAL */}
      {ratingModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Rate {ratingModalBooking.workerName}
            </h3>
            <p className="text-xs text-slate-500">
              Your feedback directly impacts cooperative fair work distribution.
            </p>

            <div className="flex justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingScore(star)}
                  className="p-1 cursor-pointer transition transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingScore
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Write a brief review (e.g. Arrived on time, very polite and skilled)..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#087F5B] focus:outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRatingModalBooking(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRate}
                className="px-4 py-2 bg-[#087F5B] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINT MODAL */}
      {complaintModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Submit Grievance to Cooperative Secretary
            </h3>
            <p className="text-xs text-slate-500">
              Cooperative Secretary Alok Nath Mishra will investigate and resolve within 24 hours.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                value={complaintSubject}
                onChange={(e) => setComplaintSubject(e.target.value)}
                placeholder="E.g., Pricing mismatch or incomplete cleaning"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Details</label>
              <textarea
                rows={3}
                value={complaintDesc}
                onChange={(e) => setComplaintDesc(e.target.value)}
                placeholder="Provide details of the dispute..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setComplaintModalBooking(null)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleComplaint}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                File Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
