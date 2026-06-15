/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wallet as WalletIcon, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  FileDown, 
  Info,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Clock,
  IceCream,
  Activity,
  User,
  PlusCircle,
  X
} from 'lucide-react';
import { ProductionEntry, PayPayment } from '../types';
import { POCKET_PRICE, BAG_PRICE, formatCurrency } from '../utils';

interface WalletProps {
  production: ProductionEntry[];
  payments: PayPayment[];
  onMarkAsPaid: (entryIds: string[], notes: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onNavigate?: (tab: string) => void;
}

export default function Wallet({ 
  production, 
  payments, 
  onMarkAsPaid, 
  onDeletePayment,
  onNavigate
}: WalletProps) {
  
  // Selection of entries to cash out
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [cashoutNotes, setCashoutNotes] = useState<string>('');
  
  // PDF Generator / Print states
  const [activePrintPayment, setActivePrintPayment] = useState<PayPayment | null>(null);
  const [customRangePrint, setCustomRangePrint] = useState<boolean>(false);
  const [printStartDate, setPrintStartDate] = useState<string>('');
  const [printEndDate, setPrintEndDate] = useState<string>('');
  
  // Feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter non-paid
  const unpaidEntries = production
    .filter(e => e.status === 'Non payé')
    .sort((a, b) => b.date.localeCompare(a.date));

  // Totals calculations
  const totalUnpaid = unpaidEntries.reduce((sum, e) => {
    return sum + (e.pockets12kg * POCKET_PRICE) + (e.bags27kg * BAG_PRICE);
  }, 0);

  const totalPaid = production
    .filter(e => e.status === 'Payé')
    .reduce((sum, e) => {
      return sum + (e.pockets12kg * POCKET_PRICE) + (e.bags27kg * BAG_PRICE);
    }, 0);

  const grandTotal = totalUnpaid + totalPaid;

  // Weekly Stats Helper (Monday to Sunday containing June 14, 2026 or current active date)
  const getWeeklyStats = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    // Filter entries inside this week
    const weeklyEntries = production.filter(entry => entry.date >= startStr && entry.date <= endStr);
    const totalPockets = weeklyEntries.reduce((sum, entry) => sum + entry.pockets12kg, 0);
    const totalBags = weeklyEntries.reduce((sum, entry) => sum + entry.bags27kg, 0);
    const totalAmount = (totalPockets * POCKET_PRICE) + (totalBags * BAG_PRICE);

    return {
      pockets: totalPockets,
      bags: totalBags,
      amount: totalAmount,
      start: startStr,
      end: endStr
    };
  };

  const weeklyStats = getWeeklyStats();

  // Toggle selection for payees
  const handleToggleEntry = (id: string) => {
    if (selectedEntryIds.includes(id)) {
      setSelectedEntryIds(selectedEntryIds.filter(item => item !== id));
    } else {
      setSelectedEntryIds([...selectedEntryIds, id]);
    }
  };

  // Toggle selection for all unpaid
  const handleSelectAllUnpaid = () => {
    if (selectedEntryIds.length === unpaidEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(unpaidEntries.map(e => e.id));
    }
  };

  // Submit bulk cashout
  const handleMarkSelectedAsPaid = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedEntryIds.length === 0) {
      alert("Veuillez sélectionner au moins une journée de production.");
      return;
    }

    onMarkAsPaid(selectedEntryIds, cashoutNotes || "Régularisation groupée de paye");
    
    // Clear selection
    setSelectedEntryIds([]);
    setCashoutNotes('');
    setFeedback("Félicitations ! Les journées sélectionnées ont été marquées comme payées.");
    setTimeout(() => setFeedback(null), 4000);
  };

  // Trigger quick cashout for a single card
  const handleMarkSingleAsPaid = (id: string, date: string) => {
    onMarkAsPaid([id], `Paye pour la journée du ${date}`);
    setFeedback(`La journée du ${date} a été marquée comme payée avec succès !`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Printing trigger
  const triggerNativePrint = () => {
    window.print();
  };

  // Get printed entries helper
  const getPrintEntries = (): ProductionEntry[] => {
    if (activePrintPayment) {
      return production.filter(e => activePrintPayment.includedEntries.includes(e.id));
    } else if (customRangePrint) {
      return production.filter(e => {
        return e.date >= printStartDate && e.date <= printEndDate;
      }).sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  };

  const printEntries = getPrintEntries();
  const printPockets = printEntries.reduce((sum, e) => sum + e.pockets12kg, 0);
  const printBags = printEntries.reduce((sum, e) => sum + e.bags27kg, 0);
  const printTotal = (printPockets * POCKET_PRICE) + (printBags * BAG_PRICE);

  return (
    <div className="space-y-6 print:hidden" id="wallet-tab">
      
      {/* 1. Header with User Context & Greeting */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-600 bg-blue-100/50 px-2.5 py-1 rounded-full uppercase">
              Espace Portefeuille Privé
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              Salut Zachary Martel 👋
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Suis tes gains cumulés, vérifie tes statistiques de production hebdomadaire et valide tes paiements d'un seul clic.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {/* Quick Navigation Button to Graphiques */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('graphiques')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <TrendingUp size={14} />
                <span>Accéder aux Graphiques</span>
              </button>
            )}
            
            {/* Direct Trigger to Exporter PDF Range option */}
            <button
              onClick={() => {
                setCustomRangePrint(true);
                setActivePrintPayment(null);
                setPrintStartDate(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]); // 30 days ago
                setPrintEndDate(new Date().toISOString().split('T')[0]);
                setTimeout(triggerNativePrint, 400);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <FileDown size={14} />
              <span>Exporter ma paye en PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3 Prominent Numeric Cards (Ice blue, white, gray, minimalist layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="wallet-metrics-summary">
        {/* Unpaid Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
              <WalletIcon size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">À Recevoir</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3.5xl font-black text-slate-900 font-mono">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gains en cours d'accumulation (non réglés)
            </p>
          </div>
        </div>

        {/* Paid Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs border-b-4 border-b-emerald-500 flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Déjà Remis</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3.5xl font-black text-emerald-600 font-mono">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total des soldes archivés & déjà payés
            </p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Cumulé</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3.5xl font-black text-white font-mono">
                {formatCurrency(grandTotal)}
              </div>
              <p className="text-xs text-blue-300 mt-1">
                Tous gains confondus pour la saison
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10 translate-x-4 translate-y-4 select-none pointer-events-none">
            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 4.5l7.5 13h-15L12 6.5z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Statistiques rapides (Total pockets, bags, dollar of the week) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Statistiques Rapides de la Semaine
            </h3>
            <p className="text-xs text-slate-400">Période du {weeklyStats.start} au {weeklyStats.end}</p>
          </div>
          <div className="text-right text-xs text-slate-400 font-medium">
            Tarifs : 0,40$/poche | 0,30$/sac
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total des Poches (12kg)</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{weeklyStats.pockets}</p>
            <p className="text-[10px] text-slate-500 mt-1">Valeur brute : {formatCurrency(weeklyStats.pockets * POCKET_PRICE)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total des Sacs (2,7kg)</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{weeklyStats.bags}</p>
            <p className="text-[10px] text-slate-500 mt-1">Valeur brute : {formatCurrency(weeklyStats.bags * BAG_PRICE)}</p>
          </div>
          <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
            <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Total $ de la Semaine</p>
            <p className="text-2xl font-black text-blue-700 mt-1 font-mono">{formatCurrency(weeklyStats.amount)}</p>
            <p className="text-[10px] text-blue-500 mt-1">Somme brute générée</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main split dashboard: Unpaid production & Payment history */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE UNPAID SHIFTS LOGGER (CASH OUT ACTIONS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-950 flex items-center text-sm">
                  <DollarSign size={16} className="text-blue-500 mr-1" />
                  Journées non payées
                </h3>
                <p className="text-xs text-slate-400">Marque les journées réglées individuellement, ou sélectionne-bises pour un paiement groupé.</p>
              </div>

              {unpaidEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllUnpaid}
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition"
                >
                  {selectedEntryIds.length === unpaidEntries.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>

            {unpaidEntries.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={36} />
                <h4 className="text-sm font-bold text-slate-800">Tout est payé !</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Aucun gain en souffrance. Toutes les productions enregistrées ont été réglées.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Quick Header Action for multiple payments */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">
                    Saisie groupée : <strong className="font-mono text-blue-600">{selectedEntryIds.length}</strong> / {unpaidEntries.length} sélectionné(s)
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleMarkSelectedAsPaid}
                    disabled={selectedEntryIds.length === 0}
                    className={`px-4.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                      selectedEntryIds.length > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Marquer plusieurs journées comme payées</span>
                  </button>
                </div>

                {/* 2. Unpaid Entries Grid / Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {unpaidEntries.map(entry => {
                    const value = (entry.pockets12kg * POCKET_PRICE) + (entry.bags27kg * BAG_PRICE);
                    const isChecked = selectedEntryIds.includes(entry.id);

                    return (
                      <div 
                        key={entry.id}
                        onClick={() => handleToggleEntry(entry.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                          isChecked 
                            ? 'bg-blue-50/40 border-blue-500 shadow-2xs' 
                            : 'bg-white hover:bg-slate-50/50 border-slate-200 shadow-3xs'
                        }`}
                      >
                        {/* Top Line: Date, Checkbox, Value */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {/* Checkbox circle */}
                            <div 
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                                isChecked 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <CheckCircle className="stroke-[3]" size={12} />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 font-mono">
                                {entry.date}
                              </span>
                              {entry.time && (
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  {entry.time}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {formatCurrency(value)}
                          </span>
                        </div>

                        {/* Mid Row details */}
                        <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-xl">
                          <div className="flex justify-between">
                            <span>Poches 12kg :</span>
                            <strong className="font-mono text-slate-700">{entry.pockets12kg}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Sacs 2,7kg :</span>
                            <strong className="font-mono text-slate-700">{entry.bags27kg}</strong>
                          </div>
                        </div>

                        {/* Direct paying trigger button inside card */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid toggling checkbox double trigger
                            handleMarkSingleAsPaid(entry.id, entry.date);
                          }}
                          className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1 shadow-3xs"
                        >
                          <CheckCircle size={12} />
                          <span>Marquer comme payé</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Additional payment notes */}
                {selectedEntryIds.length > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">
                      Note de paye optionnelle (ex. chèque #123)
                    </label>
                    <input 
                      type="text"
                      placeholder="Commentaire de paye..."
                      value={cashoutNotes}
                      onChange={(e) => setCashoutNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs leading-tight font-medium"
                    />
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORICAL COINS & CUSTOM REPORTS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Custom Date PDF Report form */}
          <div className="bg-gradient-to-br from-blue-50/50 via-slate-50/30 to-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-3xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <FileDown size={15} className="text-blue-600" />
                Générateur de rapport de paye
              </h3>
              <p className="text-[10.5px] text-slate-400">Configure la plage de dates pour générer un relevé officiel d'activités.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Date Début</label>
                <input 
                  type="date"
                  value={printStartDate}
                  onChange={(e) => setPrintStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Date Fin</label>
                <input 
                  type="date"
                  value={printEndDate}
                  onChange={(e) => setPrintEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!printStartDate || !printEndDate) {
                  alert("Veuillez d'abord choisir les dates.");
                  return;
                }
                setCustomRangePrint(true);
                setActivePrintPayment(null);
                setTimeout(triggerNativePrint, 400);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition text-center flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <FileDown size={13} />
              <span>Générer & Exporter PDF</span>
            </button>
          </div>

          {/* HISTORICAL PAYMENTS LIST WITH 🗑️ RED BUTTON FOR DELETIONS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-950 flex items-center text-sm">
              <FileText size={16} className="text-slate-500 mr-1" />
              Tableau des Payes Remises
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {payments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic">
                  Aucun versement enregistré pour le moment.
                </div>
              ) : (
                payments.map(pay => (
                  <div key={pay.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-2xl flex flex-col gap-2.5 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 font-mono">
                          Reçu le {pay.datePaye}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold italic mt-0.5">
                          "{pay.notes}"
                        </p>
                      </div>
                      <span className="text-sm font-black text-emerald-600 font-mono">
                        {formatCurrency(pay.amountTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80">
                      <span className="text-slate-500 font-medium">
                        {pay.includedEntries.length} jour(s) inclus
                      </span>
                      
                      {/* Action triggers with RED 🗑️ Suppression button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomRangePrint(false);
                            setActivePrintPayment(pay);
                            setTimeout(triggerNativePrint, 400);
                          }}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center transition"
                        >
                          <FileText size={11} className="mr-0.5" /> Fiche PDF
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Confirmer la suppression de cet archivage de paye ? Toutes les journées de production de cette paye redeviendront sous le statut 'Non payé'.")) {
                              onDeletePayment(pay.id);
                            }
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center transition shadow-3xs"
                          title="Supprimer la paye de l'historique"
                        >
                          <span className="mr-0.5">🗑️</span> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FULL PRINTABLE SHEET BLOCK DIRECT OVERLAY (ONLY DRAWN FOR window.print()) */}
      {/* Target elements gets visible exclusively on media print as specified on tailwind classes below */}
      <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-8 z-[9999] max-w-4xl mx-auto" id="printable-sheet-report">
        
        {/* Header Block */}
        <div className="border-b-2 border-blue-500 pb-5 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-blue-900 tracking-tight uppercase">Résumé de Paye</h1>
            <p className="text-xs text-slate-500 font-semibold tracking-wider">Frigo Glace Lambert enr.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Date du rapport</span>
            <span className="text-xs font-mono font-bold">{new Date().toISOString().split('T')[0]}</span>
          </div>
        </div>

        {/* Selected Period info */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-100">
          <p><strong className="text-slate-600">Bénéficiaire :</strong> Zachary Martel</p>
          {activePrintPayment ? (
            <>
              <p><strong className="text-slate-600">ID du Paiement :</strong> {activePrintPayment.id}</p>
              <p><strong className="text-slate-600">Statut :</strong> Payé & Remis le {activePrintPayment.datePaye}</p>
              {activePrintPayment.notes && <p><strong className="text-slate-600">Note :</strong> {activePrintPayment.notes}</p>}
            </>
          ) : (
            <>
              <p><strong className="text-slate-600">Période du :</strong> {printStartDate} <strong className="text-slate-600">au :</strong> {printEndDate}</p>
              <p><strong className="text-slate-600">Statut de la période :</strong> Filtre sur demande</p>
            </>
          )}
        </div>

        {/* Detailed production records table */}
        <div className="mb-6">
          <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-2">Détail des journées incluses</h2>
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-2 border border-slate-200 font-extrabold">Date</th>
                <th className="p-2 border border-slate-200 font-extrabold text-center">Poches (12kg)</th>
                <th className="p-2 border border-slate-200 font-extrabold text-center">Sacs (2.7kg)</th>
                <th className="p-2 border border-slate-200 font-extrabold text-right">Salaire accumulé</th>
              </tr>
            </thead>
            <tbody>
              {printEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-400 italic">Aucune journée sélectionnée pour ce rapport.</td>
                </tr>
              ) : (
                printEntries.map(entry => {
                  const entryTotal = (entry.pockets12kg * POCKET_PRICE) + (entry.bags27kg * BAG_PRICE);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="p-2 border border-slate-200 font-mono">{entry.date}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{entry.pockets12kg}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{entry.bags27kg}</td>
                      <td className="p-2 border border-slate-200 text-right font-mono font-bold">{formatCurrency(entryTotal)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Calculations / Financial overview details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Note d'approbation réglementaire</span>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-1 italic">
              Ce document fait office de relevé officiel d'activités pour Zachary Martel chez Frigo Glace Lambert enr. Les taux d'accumulation de 0,40$ par poche de 12kg et 0,30$ par sac de 2,7kg sont appliqués.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200 self-start">
            <div className="flex justify-between text-xs text-slate-600 font-mono">
              <span>Total Poches ({printPockets} × {POCKET_PRICE.toFixed(2)}$) :</span>
              <span>{formatCurrency(printPockets * POCKET_PRICE)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-mono border-b border-slate-200 pb-2">
              <span>Total Sacs ({printBags} × {BAG_PRICE.toFixed(2)}$) :</span>
              <span>{formatCurrency(printBags * BAG_PRICE)}</span>
            </div>
            <div className="flex justify-between text-sm text-blue-900 font-sans font-black">
              <span>Règlement final :</span>
              <span>{formatCurrency(printTotal)}</span>
            </div>
          </div>
        </div>

        {/* Signature Line block */}
        <div className="mt-12 grid grid-cols-2 gap-8 pt-8">
          <div className="border-t border-slate-300 pt-2 text-center text-xs">
            <span className="block text-[10px] tracking-wider uppercase text-slate-400">Signature de l'employé</span>
            <span className="block mt-4 font-semibold text-slate-700 italic">Zachary Martel</span>
          </div>
          <div className="border-t border-slate-300 pt-2 text-center text-xs">
            <span className="block text-[10px] tracking-wider uppercase text-slate-400">Approbation du superviseur</span>
            <span className="block mt-4 font-mono text-xs text-slate-300">[ Signature Frigo Glace Lambert enr. ]</span>
          </div>
        </div>

      </div>

    </div>
  );
}
