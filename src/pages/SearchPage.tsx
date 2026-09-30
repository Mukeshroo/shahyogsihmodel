import React, { useState } from 'react';
import { ServiceCategory, Worker } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { MapViewer } from '../components/MapViewer.tsx';
import {
  Search,
  Filter,
  MapPin,
  Star,
  ShieldCheck,
  Award,
  Layers,
  Map,
  Grid,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SearchPageProps {
  categories: ServiceCategory[];
  workers: Worker[];
  initialCategory?: string;
  onOpenBooking: (catId?: string, worker?: Worker) => void;
  onViewCertificate: (worker: Worker) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  categories,
  workers,
  initialCategory,
  onOpenBooking,
  onViewCertificate
}) => {
  const { language, t } = useLanguage();
  const [selectedCat, setSelectedCat] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [minRating, setMinRating] = useState<number>(0);
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filter workers
  const filteredWorkers = workers.filter((w) => {
    if (w.status !== 'APPROVED') return false;
    if (selectedCat !== 'all' && !w.approvedSkills.includes(selectedCat)) return false;
    if (availableOnly && !w.isAvailable) return false;
    if (minRating > 0 && w.rating < minRating) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = w.name.toLowerCase().includes(q);
      const matchArea = w.area.toLowerCase().includes(q);
      const matchCoop = w.cooperativeName.toLowerCase().includes(q);
      if (!matchName && !matchArea && !matchCoop) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#12304A]">
            {language === 'hi' ? 'कानपुर में सहकारी कारीगर खोजें' : 'Search Verified Cooperative Workers'}
          </h1>
          <p className="text-xs text-slate-500">
            {filteredWorkers.length} certified technicians available across Kalyanpur, Swaroop Nagar & Civil Lines
          </p>
        </div>

        {/* View mode toggle (Grid vs Map) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'map' ? 'bg-white text-[#087F5B] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map View (Kanpur)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Text Search */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by worker name, area (Kalyanpur, Swaroop Nagar)..."
              className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
            />
          </div>

          {/* Trade Category Dropdown */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full text-xs py-2.5 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#087F5B] bg-white cursor-pointer"
            >
              <option value="all">All Service Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Toggle */}
          <button
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              availableOnly
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-emerald-600' : 'bg-slate-400'}`} />
            <span>Available Now Only</span>
          </button>
        </div>

        {/* Distance Slider and Rating Filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">Search Radius:</span>
            <input
              type="range"
              min="2"
              max="20"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-28 sm:w-36 accent-[#087F5B] cursor-pointer"
            />
            <span className="font-bold text-[#087F5B]">{radiusKm} km</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Rating:</span>
            {[0, 4.5, 4.8].map((r) => (
              <button
                key={r}
                onClick={() => setMinRating(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  minRating === r
                    ? 'bg-[#12304A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 0 ? 'All' : `${r}+ ⭐`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN VIEW: MAP OR GRID */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <div className="h-[480px] w-full">
            <MapViewer
              workers={filteredWorkers}
              radiusKm={radiusKm}
              onSelectWorker={(worker) => {
                onOpenBooking(worker.approvedSkills[0], worker);
              }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">
            Click on any emerald marker to inspect the technician's cooperative details and book directly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
              <p className="text-sm font-bold text-slate-700">No technicians found matching this criteria.</p>
              <p className="text-xs text-slate-500 mt-1">Try expanding the search radius or resetting the filters.</p>
              <button
                onClick={() => {
                  setSelectedCat('all');
                  setSearchQuery('');
                  setAvailableOnly(false);
                  setMinRating(0);
                }}
                className="mt-4 bg-[#087F5B] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredWorkers.map((worker) => (
              <div
                key={worker.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-md transition space-y-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={worker.avatar}
                    alt={worker.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{worker.name}</h3>
                      <ShieldCheck className="w-4 h-4 text-[#087F5B] shrink-0" />
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
                      <span className="text-slate-600">{worker.experienceYears} yrs</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#087F5B]" />
                    <span>{worker.area}, Kanpur</span>
                  </div>
                  <span className={`font-semibold ${worker.isAvailable ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {worker.isAvailable ? '● Available' : '○ Busy'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onViewCertificate(worker)}
                    className="text-xs text-slate-600 hover:text-[#087F5B] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#087F5B]" />
                    <span>QR Cert</span>
                  </button>

                  <button
                    onClick={() => onOpenBooking(worker.approvedSkills[0], worker)}
                    className="bg-[#087F5B] hover:bg-[#066347] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                  >
                    Book Worker
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
