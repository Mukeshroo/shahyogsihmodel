import React, { useState, useEffect } from 'react';
import { DemandForecast } from '../types/index.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import {
  TrendingUp,
  AlertTriangle,
  Brain,
  CheckCircle,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';

export const AiForecastPage: React.FC = () => {
  const { language } = useLanguage();
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/forecasts')
      .then((res) => res.json())
      .then((data) => {
        setForecasts(data.forecasts || []);
        setSummary(data.summary || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#12304A] text-white rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <Brain className="w-4 h-4" />
            <span>AI Predictive Analytics Microservice · Kanpur Pilot</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            AI Demand Forecasting & Worker Supply Shortage Alerts
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Hybrid Prophet-XGBoost model predicting weekly trade spikes across Kanpur municipal wards.
          </p>
        </div>

        {/* Model Confidence Metric */}
        <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Model Validation Accuracy</span>
          <span className="text-2xl font-black text-emerald-400">94.2%</span>
          <span className="text-[10px] text-slate-400 block">RMSE: 4.8 · MAE: 3.2</span>
        </div>
      </div>

      {/* SHORTAGE WARNING CARDS */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span>Active Cooperative Worker Shortage Alerts (Action Required)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecasts.filter((f) => f.shortageWarning).map((f) => (
            <div
              key={f.id}
              className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-5 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Critical Shortage Warning
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 mt-1">{f.areaName}</h3>
                  <p className="text-xs text-slate-600">Category: <span className="font-semibold text-slate-800">{f.serviceCategory}</span></p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-rose-600 flex items-center gap-0.5 justify-end">
                    <ArrowUpRight className="w-4 h-4" />
                    +{f.growthPercentage}% Demand Spike
                  </span>
                  <span className="text-[10px] text-slate-500 block">Projected for Next Week</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-amber-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Current Supply</span>
                  <span className="font-bold text-slate-800">{f.workerSupplyCount} Active</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Expected Jobs</span>
                  <span className="font-bold text-slate-800">{f.forecastedWeeklyDemand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Workers Needed</span>
                  <span className="font-bold text-rose-600">+{f.shortageWorkersNeeded} Recruits</span>
                </div>
              </div>

              <p className="text-[11px] text-amber-900 font-medium">
                Recommendation: Cooperative Secretary advised to onboard {f.shortageWorkersNeeded} certified {f.serviceCategory} technicians before Monday.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* WARD-BY-WARD PROJECTIONS TABLE */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Kanpur Pilot Ward Forecasts (Next 7-14 Days)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Architecture: Prophet-XGB-Hybrid-v2.6</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-left">
                <th className="py-2.5">Ward / Area</th>
                <th className="py-2.5">Service Trade</th>
                <th className="py-2.5 text-center">Current Wk Demand</th>
                <th className="py-2.5 text-center">Forecasted Demand</th>
                <th className="py-2.5 text-center">Growth Rate</th>
                <th className="py-2.5 text-center">Worker Pool</th>
                <th className="py-2.5 text-right">Supply Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forecasts.map((f) => (
                <tr key={f.id}>
                  <td className="py-3 font-bold text-slate-900">{f.areaName}</td>
                  <td className="py-3 text-slate-700">{f.serviceCategory}</td>
                  <td className="py-3 text-center text-slate-600">{f.currentWeeklyDemand}</td>
                  <td className="py-3 text-center font-bold text-slate-900">{f.forecastedWeeklyDemand}</td>
                  <td className="py-3 text-center font-semibold text-emerald-700">+{f.growthPercentage}%</td>
                  <td className="py-3 text-center text-slate-700">{f.workerSupplyCount}</td>
                  <td className="py-3 text-right">
                    {f.shortageWarning ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Shortage (-{f.shortageWorkersNeeded})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Adequate Pool ✓
                      </span>
                    )}
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
