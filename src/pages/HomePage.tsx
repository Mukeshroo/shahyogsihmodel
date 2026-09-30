import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ServiceCategory, Worker, Booking } from '../types/index.ts';
import {
  Search,
  Mic,
  AlertTriangle,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  HeartHandshake,
  Users,
  CheckCircle,
  Award,
  Zap,
  Wrench,
  Cpu,
  Hammer,
  Sparkle,
  Paintbrush
} from 'lucide-react';

interface HomePageProps {
  categories: ServiceCategory[];
  workers: Worker[];
  onSelectCategory: (catId: string) => void;
  onSelectWorker: (worker: Worker) => void;
  onOpenSos: () => void;
  onOpenVoice: () => void;
  onOpenBooking: (catId?: string, worker?: Worker) => void;
  onViewCertificate: (worker: Worker) => void;
  onNavigate: (view: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  workers,
  onSelectCategory,
  onSelectWorker,
  onOpenSos,
  onOpenVoice,
  onOpenBooking,
  onViewCertificate,
  onNavigate
}) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Kalyanpur');

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nameHi.includes(searchQuery)
  );

  const approvedWorkers = workers.filter((w) => w.status === 'APPROVED');

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'cat-electrician': return <Zap className="w-5 h-5 text-amber-500" />;
      case 'cat-plumber': return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'cat-appliance': return <Cpu className="w-5 h-5 text-purple-500" />;
      case 'cat-carpenter': return <Hammer className="w-5 h-5 text-orange-500" />;
      case 'cat-cleaner': return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'cat-painter': return <Paintbrush className="w-5 h-5 text-rose-500" />;
      default: return <Sparkles className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-b from-emerald-900 via-[#12304A] to-[#12304A] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-xl overflow-hidden">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F4B942_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kanpur Nagar Cooperative Pilot · Kalyanpur & Swaroop Nagar</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {language === 'hi'
              ? 'स्थानीय हुनर · निष्पक्ष काम · मजबूत समुदाय'
              : 'Verified Local Technicians Owned by Their Cooperative'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal">
            {t('heroSubtitle')}
          </p>

          {/* Search & Voice Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl flex items-center gap-2 border border-slate-200">
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 text-slate-900 text-xs sm:text-sm py-2 focus:outline-none placeholder:text-slate-400"
            />
            <button
              onClick={onOpenVoice}
              title={t('voiceSearch')}
              className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#087F5B] transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">बोलें</span>
            </button>
            <button
              onClick={() => onNavigate('search')}
              className="bg-[#087F5B] hover:bg-[#066347] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shadow-md shadow-emerald-900/20"
            >
              {language === 'hi' ? 'खोजें' : 'Search'}
            </button>
          </div>

          {/* Area Selector and SOS Callout */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <MapPin className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>Pilot Zone:</span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="bg-transparent text-[#F4B942] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Kalyanpur" className="bg-slate-900">Kalyanpur (Ward 24)</option>
                <option value="Swaroop Nagar" className="bg-slate-900">Swaroop Nagar (Ward 18)</option>
                <option value="Civil Lines" className="bg-slate-900">Civil Lines (Ward 12)</option>
                <option value="Kidwai Nagar" className="bg-slate-900">Kidwai Nagar (Ward 35)</option>
              </select>
            </div>

            <button
              onClick={onOpenSos}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'घरेलू इमरजेंसी SOS (त्वरित सहायता)' : 'Emergency Household SOS (Under 15 Mins)'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* COOPERATIVE SPLIT COMPARISON BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white rounded-2xl p-5 sm:p-6 border border-emerald-200/80 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2">
              <div className="inline-flex items-center gap-1 text-[#087F5B] text-xs font-bold uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4" />
                <span>The 90/10 Cooperative Guarantee</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#12304A]">
                {language === 'hi' ? 'निजी कंपनियों के 30% कमीशन के खिलाफ सहकारी क्रांति' : 'Fair Pay: 90% Direct to Worker, Not Big Tech Aggregators'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('fairShareSubtitle')}
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-xs space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Total Service Value:</span>
                <span className="font-bold text-slate-900">₹1,000</span>
              </div>
              <div className="flex justify-between items-center text-emerald-800 font-extrabold text-sm">
                <span>Worker Direct Share (90%):</span>
                <span>₹900</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Cooperative Administration (8%):</span>
                <span>₹80</span>
              </div>
              <div className="flex justify-between items-center text-blue-700 font-semibold border-t border-slate-100 pt-1.5">
                <span>Worker Insurance & Welfare (2%):</span>
                <span>₹20</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#12304A] tracking-tight">
              {t('categoriesTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'सत्यापित ट्रेड कौशल व मानकीकृत न्यूनतम दरें' : 'Verified trade skills with transparent cooperative base pricing'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-xs text-[#087F5B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                onOpenBooking(cat.id);
              }}
              className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-[#087F5B] hover:shadow-md transition cursor-pointer text-center group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-emerald-50 mx-auto flex items-center justify-center transition mb-3">
                  {getCategoryIcon(cat.id)}
                </div>
                <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#087F5B] transition">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {language === 'hi' ? cat.nameHi : cat.turnaroundTime}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Starts</span>
                <span className="font-extrabold text-[#087F5B]">₹{cat.basePrice}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEARBY VERIFIED WORKERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#12304A] tracking-tight">
              {t('nearbyWorkers')}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'आधार व पुलिस जांच से सत्यापित सक्रिय सदस्य' : 'Aadhaar & Police verified active cooperative members in Kanpur'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="text-xs text-[#087F5B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'hi' ? 'मानचित्र पर देखें' : 'View on Map'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedWorkers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition space-y-4"
            >
              {/* Worker Top Info */}
              <div className="flex items-start gap-3">
                <img
                  src={worker.avatar}
                  alt={worker.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{worker.name}</h3>
                    <span title="Verified Cooperative Technician">
                      <ShieldCheck className="w-4 h-4 text-[#087F5B] shrink-0" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{worker.cooperativeName}</p>

                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{worker.rating}</span>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{worker.completedJobs} jobs</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{worker.experienceYears} yrs exp</span>
                  </div>
                </div>
              </div>

              {/* Skills and Location */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
                <span className="font-medium">{worker.area}, Kanpur</span>
                <span className="text-slate-400">·</span>
                <span className={worker.isAvailable ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                  {worker.isAvailable ? '● Available Now' : '○ Busy'}
                </span>
              </div>

              {/* Actions: Verify QR Certificate and Book */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewCertificate(worker)}
                  className="text-xs text-slate-600 hover:text-[#087F5B] font-semibold flex items-center gap-1 cursor-pointer py-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-[#087F5B]" />
                  <span>{t('verifyQr')}</span>
                </button>

                <button
                  onClick={() => {
                    onSelectWorker(worker);
                    onOpenBooking(worker.approvedSkills[0], worker);
                  }}
                  className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                >
                  {t('bookNow')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORM METRICS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#12304A] text-white rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#F4B942]">354+</p>
              <p className="text-xs text-slate-300 mt-1">Verified Workers in Kanpur</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">₹14.8 Lakh</p>
              <p className="text-xs text-slate-300 mt-1">90% Direct Worker Payouts</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">96.8%</p>
              <p className="text-xs text-slate-300 mt-1">Fair Allocation Rotation Score</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">₹32,400</p>
              <p className="text-xs text-slate-300 mt-1">Worker Welfare & Insurance Fund</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
