/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Wallet, 
  CheckCircle2, 
  Activity, 
  IceCream, 
  ArrowRight, 
  Calendar, 
  FileText 
} from 'lucide-react';
import { ProductionEntry, CalendarEvent, QuickNote } from '../types';
import { POCKET_PRICE, BAG_PRICE, formatCurrency } from '../utils';

interface DashboardProps {
  production: ProductionEntry[];
  events: CalendarEvent[];
  notes: QuickNote[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ production, events, notes, onNavigate }: DashboardProps) {
  // Calculations
  const unpaidEntries = production.filter(p => p.status === 'Non payé');
  const paidEntries = production.filter(p => p.status === 'Payé');

  const totalUnpaid = unpaidEntries.reduce((acc, curr) => {
    return acc + (curr.pockets12kg * POCKET_PRICE) + (curr.bags27kg * BAG_PRICE);
  }, 0);

  const totalPaid = paidEntries.reduce((acc, curr) => {
    return acc + (curr.pockets12kg * POCKET_PRICE) + (curr.bags27kg * BAG_PRICE);
  }, 0);

  const grandTotal = totalUnpaid + totalPaid;

  // Week statistics
  const getThisWeekStats = () => {
    const today = new Date();
    const oneJan = new Date(today.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((today.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    const currentWeekNo = Math.ceil((today.getDay() + 1 + numberOfDays) / 7);

    // Filter production entries belonging to the current year and week
    const thisWeekEntries = production.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryNumDays = Math.floor((entryDate.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
      const entryWeekNo = Math.ceil((entryDate.getDay() + 1 + entryNumDays) / 7);
      return entryDate.getFullYear() === today.getFullYear() && entryWeekNo === currentWeekNo;
    });

    const pockets = thisWeekEntries.reduce((sum, entry) => sum + entry.pockets12kg, 0);
    const bags = thisWeekEntries.reduce((sum, entry) => sum + entry.bags27kg, 0);
    const money = thisWeekEntries.reduce((sum, entry) => sum + (entry.pockets12kg * POCKET_PRICE + entry.bags27kg * BAG_PRICE), 0);

    return { pockets, bags, money };
  };

  const weekStats = getThisWeekStats();

  // Filter events for today & upcoming
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === todayStr);
  const upcomingEvents = events.filter(e => e.date > todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  // Filter latest notes
  const latestNotes = notes.slice(-3).reverse();

  return (
    <div className="space-y-6" id="dashboard-tab">
      
      {/* Premium Ice Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="relative z-10 space-y-2">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            Frigo Glace Lambert enr.
          </span>
          <h1 className="text-3xl font-extrabold sm:text-4xl tracking-tight">
            Salut Zachary 👋
          </h1>
          <p className="text-blue-100 max-w-xl text-sm sm:text-base">
            Bienvenue dans ton gestionnaire de production et de paye. Suis tes quotas de glace de 12kg et 2,7kg, consulte tes gains accumulés et exporte tes rapports de paye.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-15 transform translate-x-10 translate-y-10 pointer-events-none">
          <IceCream size={240} className="stroke-[1.5]" />
        </div>
      </div>

      {/* Wallet Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="wallet-summary-cards">
        
        {/* Unpaid Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Wallet size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">À Recevoir</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Production cumulée non acquittée
            </p>
          </div>
          <button 
            onClick={() => onNavigate('portefeuille')}
            className="mt-4 flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 transition"
          >
            Voir le détail <ArrowRight size={14} className="ml-1" />
          </button>
        </div>

        {/* Paid Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs border-b-4 border-b-green-500 flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Déjà Remis</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-green-600 font-mono">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total des payes remis par l'employeur
            </p>
          </div>
          <button 
            onClick={() => onNavigate('portefeuille')}
            className="mt-4 flex items-center text-xs font-bold text-green-600 hover:text-green-700 transition"
          >
            Consulter l'historique <ArrowRight size={14} className="ml-1" />
          </button>
        </div>

        {/* Cumulative Total Card */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Cumulé</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {formatCurrency(grandTotal)}
              </div>
              <p className="text-xs text-blue-300 mt-1">
                Saison active de production
              </p>
            </div>
            <button 
              onClick={() => onNavigate('graphiques')}
              className="mt-4 flex items-center text-xs font-bold text-blue-400 hover:text-blue-300 transition"
            >
              Analyser mes statistiques <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10 translate-x-4 translate-y-4 select-none pointer-events-none">
            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 4.5l7.5 13h-15L12 6.5z"/>
            </svg>
          </div>
        </div>

      </div>

      {/* Production Weekly Stats Block */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6" id="fast-stats-block">
        <h3 className="text-sm font-bold text-blue-900 tracking-wider uppercase mb-4 flex items-center">
          <Activity size={16} className="mr-2 text-blue-500" /> Production de la Semaine Active
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-2xs border border-blue-100">
            <p className="text-xs text-slate-500 font-medium">Poches (12 kg)</p>
            <p className="text-lg sm:text-2xl font-extrabold text-blue-900">{weekStats.pockets}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{(weekStats.pockets * POCKET_PRICE).toFixed(2)}$ acquis</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-2xs border border-blue-100">
            <p className="text-xs text-slate-500 font-medium">Sacs (2,7 kg)</p>
            <p className="text-lg sm:text-2xl font-extrabold text-blue-900">{weekStats.bags}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{(weekStats.bags * BAG_PRICE).toFixed(2)}$ acquis</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-2xs border border-blue-100">
            <p className="text-xs text-slate-500 font-medium">Salaire Estimé</p>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-700">{formatCurrency(weekStats.money)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Cette semaine</p>
          </div>
        </div>
      </div>

      {/* Bottom Layout - Events & Quick Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Scheduled shifts and tasks */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <Calendar size={18} className="mr-2 text-blue-500" /> Agenda & Shifts
            </h3>
            <button 
              onClick={() => onNavigate('calendrier')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Gérer l'agenda
            </button>
          </div>

          <div className="space-y-3">
            {todayEvents.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-400 font-medium">Aucun shift de travail planifié pour aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Aujourd'hui</p>
                {todayEvents.map(evt => (
                  <div key={evt.id} className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <div className="flex justify-between items-start text-xs">
                      <span className="font-bold text-blue-900">{evt.title}</span>
                      <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-[10px] text-blue-800">{evt.time} ({evt.duration})</span>
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-slate-600 mt-1 italic">{evt.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {upcomingEvents.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shifts et événements à venir</p>
                {upcomingEvents.map(evt => (
                  <div key={evt.id} className="p-3 bg-slate-50 border-l-4 border-slate-300 rounded-r-lg flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700">{evt.title}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{evt.date} à {evt.time}</p>
                    </div>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-600">
                      {evt.duration}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Notes snippet */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <FileText size={18} className="mr-2 text-cyan-500" /> Notes rapides récentes
            </h3>
            <button 
              onClick={() => onNavigate('calendrier')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Gérer les notes
            </button>
          </div>

          <div className="space-y-3">
            {latestNotes.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-400 font-medium">Aucune note prise pour le moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {latestNotes.map(note => (
                  <div key={note.id} className="p-3 bg-yellow-50/60 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{note.title}</h4>
                      <span className="text-[9px] text-slate-400 font-mono">{note.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 italic">
                      "{note.content}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Work Guidelines Tip Box */}
          <div className="p-3 bg-slate-50 rounded-lg text-slate-600 text-xs text-left border border-slate-100">
            <span className="font-bold text-blue-800">💡 Astuce de production :</span> Chaque poche de 12 kg que tu inscris vaut <span className="font-bold font-mono">0,40 $</span> et chaque sac de 2,7 kg vaut <span className="font-bold font-mono">0,30 $</span>. Garde ton historique à jour pour suivre ta paye brute en direct !
          </div>
        </div>

      </div>

    </div>
  );
}
