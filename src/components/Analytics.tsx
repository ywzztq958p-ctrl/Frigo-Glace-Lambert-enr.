/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  IceCream, 
  Calendar, 
  Coins 
} from 'lucide-react';
import { ProductionEntry } from '../types';
import { POCKET_PRICE, BAG_PRICE, getWeekString, getMonthString } from '../utils';

interface AnalyticsProps {
  entries: ProductionEntry[];
}

export default function Analytics({ entries }: AnalyticsProps) {
  const [metricType, setMetricType] = useState<'both' | 'pockets' | 'bags' | 'wages'>('both');

  // Colors mapping for charts
  const ICE_BLUE = '#3b82f6'; // pockets blue
  const ICE_CYAN = '#22d3ee'; // bags cyan
  const COIN_AMBER = '#f59e0b'; // wages amber
  const COIN_GREEN = '#10b981'; // wages green
  const COLORS = [ICE_BLUE, ICE_CYAN, COIN_AMBER, COIN_GREEN];

  // Process Daily Data
  const dailyData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14) // Last 14 days
    .map(entry => {
      const wagesPockets = entry.pockets12kg * POCKET_PRICE;
      const wagesBags = entry.bags27kg * BAG_PRICE;
      const totalWages = wagesPockets + wagesBags;
      return {
        date: entry.date.split('-').slice(1).join('/'), // format as MM/DD
        Poches: entry.pockets12kg,
        Sacs: entry.bags27kg,
        Gains: parseFloat(totalWages.toFixed(2)),
      };
    });

  // Process Weekly Data
  const weeklyDataMap: Record<string, { pockets: number; bags: number; wages: number }> = {};
  entries.forEach(entry => {
    const week = getWeekString(entry.date);
    const wages = (entry.pockets12kg * POCKET_PRICE) + (entry.bags27kg * BAG_PRICE);
    if (!weeklyDataMap[week]) {
      weeklyDataMap[week] = { pockets: 0, bags: 0, wages: 0 };
    }
    weeklyDataMap[week].pockets += entry.pockets12kg;
    weeklyDataMap[week].bags += entry.bags27kg;
    weeklyDataMap[week].wages += wages;
  });

  const weeklyData = Object.keys(weeklyDataMap)
    .sort()
    .map(week => ({
      name: week,
      Poches: weeklyDataMap[week].pockets,
      Sacs: weeklyDataMap[week].bags,
      Gains: parseFloat(weeklyDataMap[week].wages.toFixed(2)),
    }));

  // Process Monthly Data
  const monthlyDataMap: Record<string, { pockets: number; bags: number; wages: number }> = {};
  entries.forEach(entry => {
    const month = getMonthString(entry.date);
    const wages = (entry.pockets12kg * POCKET_PRICE) + (entry.bags27kg * BAG_PRICE);
    if (!monthlyDataMap[month]) {
      monthlyDataMap[month] = { pockets: 0, bags: 0, wages: 0 };
    }
    monthlyDataMap[month].pockets += entry.pockets12kg;
    monthlyDataMap[month].bags += entry.bags27kg;
    monthlyDataMap[month].wages += wages;
  });

  const monthlyData = Object.keys(monthlyDataMap)
    .sort()
    .map(month => ({
      name: month,
      Poches: monthlyDataMap[month].pockets,
      Sacs: monthlyDataMap[month].bags,
      Gains: parseFloat(monthlyDataMap[month].wages.toFixed(2)),
    }));

  // Process Pie Data (Volume and earnings distribution)
  const totalPockets = entries.reduce((sum, e) => sum + e.pockets12kg, 0);
  const totalBags = entries.reduce((sum, e) => sum + e.bags27kg, 0);
  const totalPocketWages = totalPockets * POCKET_PRICE;
  const totalBagWages = totalBags * BAG_PRICE;

  const pieVolumeData = [
    { name: 'Poches (12 kg)', value: totalPockets },
    { name: 'Sacs (2,7 kgs)', value: totalBags }
  ];

  const pieWagesData = [
    { name: 'Gains Poches ($)', value: parseFloat(totalPocketWages.toFixed(2)) },
    { name: 'Gains Sacs ($)', value: parseFloat(totalBagWages.toFixed(2)) }
  ];

  return (
    <div className="space-y-6" id="analytics-tab">
      
      {/* Title & Control rail */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center">
            <Activity className="mr-2 text-blue-500" size={18} />
            Statistiques & Graphiques de Production
          </h2>
          <p className="text-xs text-slate-400">Analyses en visuel par jour, semaine et mois</p>
        </div>

        {/* Chart View filter toggles */}
        <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 max-w-sm">
          <button
            onClick={() => setMetricType('both')}
            className={`flex-1 py-1 px-3 text-[11px] rounded-md font-bold transition whitespace-nowrap ${
              metricType === 'both' ? 'bg-white text-blue-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sacs & Poches
          </button>
          <button
            onClick={() => setMetricType('wages')}
            className={`flex-1 py-1 px-3 text-[11px] rounded-md font-bold transition whitespace-nowrap ${
              metricType === 'wages' ? 'bg-white text-emerald-600 shadow-3xs' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Salaire ($)
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-slate-400">
          <TrendingUp size={36} className="mx-auto text-slate-300 mb-2" />
          <h4 className="text-xs font-bold text-slate-800">Aucune statistique à modéliser</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
            Une fois que tu auras ajouté tes journées de travail dans l'onglet "Production", les graphiques d'analyse s'afficheront ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CHART A: DAILY PRODUCTION BAR */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center">
              <Calendar size={14} className="mr-1 text-blue-500" />
              Production Journalière (Mon pays en direct)
            </h3>
            <div className="h-64" id="daily-bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#f1f5f9' }}
                    formatter={(value) => [`${value}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {metricType === 'both' ? (
                    <>
                      <Bar dataKey="Poches" fill={ICE_BLUE} radius={[4, 4, 0, 0]} name="Poches (12kg)" />
                      <Bar dataKey="Sacs" fill={ICE_CYAN} radius={[4, 4, 0, 0]} name="Sacs (2,7kg)" />
                    </>
                  ) : (
                    <Bar dataKey="Gains" fill={COIN_GREEN} radius={[4, 4, 0, 0]} name="Salaire ($)" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART B: WEEKLY PERFORMANCE LINE */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center">
              <TrendingUp size={14} className="mr-1 text-indigo-500" />
              Tendance Hebdomadaire
            </h3>
            <div className="h-64" id="weekly-line-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#f1f5f9' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {metricType === 'both' ? (
                    <>
                      <Line type="monotone" dataKey="Poches" stroke={ICE_BLUE} strokeWidth={2.5} name="Total Poches" />
                      <Line type="monotone" dataKey="Sacs" stroke={ICE_CYAN} strokeWidth={2.5} name="Total Sacs" />
                    </>
                  ) : (
                    <Line type="monotone" dataKey="Gains" stroke={COIN_AMBER} strokeWidth={2.5} name="Salaire cumulé ($)" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART C: MONTHLY VOLUME SUMMARY */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center">
              <Coins size={14} className="mr-1 text-emerald-500" />
              Sommaire de Production par Mois
            </h3>
            <div className="h-64" id="monthly-bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: '#f1f5f9' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {metricType === 'both' ? (
                    <>
                      <Bar dataKey="Poches" fill={ICE_BLUE} radius={[4, 4, 0, 0]} name="Poches" />
                      <Bar dataKey="Sacs" fill={ICE_CYAN} radius={[4, 4, 0, 0]} name="Sacs" />
                    </>
                  ) : (
                    <Bar dataKey="Gains" fill={COIN_GREEN} radius={[4, 4, 0, 0]} name="Revenus cumulés ($)" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART D: PROPORTIONS PIE / DONUT */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400 flex items-center">
              <IceCream size={14} className="mr-1 text-cyan-500" />
              Proportions Volume vs Balance Financière
            </h3>
            <div className="h-64 flex flex-col justify-center" id="pie-donut-chart">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricType === 'both' ? pieVolumeData : pieWagesData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(metricType === 'both' ? pieVolumeData : pieWagesData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-slate-400 font-medium">
                {metricType === 'both' 
                  ? `Volume total: ${totalPockets + totalBags} pièces` 
                  : `Valeur nette totale: ${totalPocketWages + totalBagWages} $CAD`}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
