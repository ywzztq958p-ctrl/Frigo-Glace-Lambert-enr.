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
  Trash2, 
  Calendar, 
  FileDown, 
  Info,
  DollarSign,
  Undo2,
  Lock,
  PlusCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { ProductionEntry, PayPayment } from '../types';
import { POCKET_PRICE, BAG_PRICE, formatCurrency } from '../utils';

interface WalletProps {
  production: ProductionEntry[];
  payments: PayPayment[];
  onMarkAsPaid: (entryIds: string[], notes: string) => void;
  onDeletePayment: (paymentId: string) => void;
}

export default function Wallet({ 
  production, 
  payments, 
  onMarkAsPaid, 
  onDeletePayment 
}: WalletProps) {
  
  // Selection of entries to cash out / cash in
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [cashoutNotes, setCashoutNotes] = useState<string>('');
  
  // PDF Generator state
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

  // Toggle selection for payees
  const handleToggleEntry = (id: string) => {
    if (selectedEntryIds.includes(id)) {
      setSelectedEntryIds(selectedEntryIds.filter(item => item !== id));
    } else {
      setSelectedEntryIds([...selectedEntryIds, id]);
    }
  };

  // Select all unpaid helpers
  const handleSelectAllUnpaid = () => {
    if (selectedEntryIds.length === unpaidEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(unpaidEntries.map(e => e.id));
    }
  };

  // Submit cashout / Mark as paid
  const handleMarkSelectedAsPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEntryIds.length === 0) {
      alert("Veuillez sélectionner au moins une journée de production.");
      return;
    }

    onMarkAsPaid(selectedEntryIds, cashoutNotes || "Acompte régulier de paye");
    
    // Clear status
    setSelectedEntryIds([]);
    setCashoutNotes('');
    setFeedback("Félicitations ! Les journées sélectionnées ont été archivées sous le statut 'Payé'.");
    setTimeout(() => setFeedback(null), 4000);
  };

  // Trigger browser print dialog tailored specifically for the invoice
  const triggerNativePrint = () => {
    window.print();
  };

  // Select custom dates for custom printing range
  const handleCustomRangePrintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!printStartDate || !printEndDate) {
      alert("Veuillez spécifier la date de début et de fin.");
      return;
    }
    triggerNativePrint();
  };

  // Helper inside PDF renderer to filter print entries
  const getPrintEntries = (): ProductionEntry[] => {
    if (activePrintPayment) {
      // Print specific historic payment
      return production.filter(e => activePrintPayment.includedEntries.includes(e.id));
    } else if (customRangePrint) {
      // Print arbitrary range
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
      
      {/* 3 Prominent Numeric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="wallet-metrics-summary">
        {/* Unpaid Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <WalletIcon size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">À Recevoir</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gains en cours d'accumulation
            </p>
          </div>
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
              Total des primes & payes acquittées
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
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {formatCurrency(grandTotal)}
              </div>
              <p className="text-xs text-blue-300 mt-1">
                Tous types de paye confondus
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

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE UNPAID SHIFTS LOGGER (CASH OUT ACTIONS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <DollarSign size={18} className="text-blue-500 mr-1.5" />
                  Prêts à encaisser (Journées à payer)
                </h3>
                <p className="text-xs text-slate-400">Sélectionne les journées de travail pour enregistrer ta remise de paye</p>
              </div>

              {unpaidEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllUnpaid}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline shrink-0"
                >
                  {selectedEntryIds.length === unpaidEntries.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                </button>
              )}
            </div>

            {unpaidEntries.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={32} />
                <h4 className="text-xs font-bold text-slate-800">Tout est à jour !</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                  Tu as été payé pour toutes tes journées de production enregistrées. Félicitations !
                </p>
              </div>
            ) : (
              <form onSubmit={handleMarkSelectedAsPaid} className="space-y-4">
                {/* Scrollable list of cards with checkboxes */}
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {unpaidEntries.map(entry => {
                    const value = (entry.pockets12kg * POCKET_PRICE) + (entry.bags27kg * BAG_PRICE);
                    const isChecked = selectedEntryIds.includes(entry.id);

                    return (
                      <div 
                        key={entry.id}
                        onClick={() => handleToggleEntry(entry.id)}
                        className={`p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'bg-blue-50/50 border-blue-400 shadow-2xs' 
                            : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Checkbox item */}
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                            isChecked 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <CheckCircle size={12} className="stroke-[3]" />}
                          </div>

                          <div>
                            <span className="text-xs font-bold text-slate-800 font-mono">{entry.date}</span>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5 space-x-2">
                              <span>Poches (12kg): <strong className="font-mono text-slate-700">{entry.pockets12kg}</strong></span>
                              <span>•</span>
                              <span>Sacs (2.7kg): <strong className="font-mono text-slate-700">{entry.bags27kg}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <span className="text-xs font-black text-blue-950 font-mono">
                            {formatCurrency(value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Notes Input & Action button */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      Note de paye additionnelle (ex: Chèque, Cash, Semaine active)
                    </label>
                    <input 
                      type="text"
                      placeholder="Ex: Paye reçue en argent le vendredi"
                      value={cashoutNotes}
                      onChange={(e) => setCashoutNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs leading-tight text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs">
                      <span className="text-slate-500">Sélection : </span>
                      <strong className="text-blue-900 font-mono">{selectedEntryIds.length} jour(s)</strong>
                    </div>
                    <button
                      type="submit"
                      disabled={selectedEntryIds.length === 0}
                      className={`font-semibold py-2 px-4 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-sm ${
                        selectedEntryIds.length > 0 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      <span>Marquer comme payé</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORIC COINS & CUSTOM PRINT REPORTS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Custom period PDF exporter selector */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-blue-900 flex items-center">
                <FileDown size={16} className="mr-1.5 text-blue-600" />
                Rapport de paye PDF personnalisé
              </h3>
              <p className="text-[11px] text-blue-700 mt-1">Sélectionne une période pour exporter un relevé de paye au format PDF réglementaire.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-blue-800 mb-0.5">Date Début</label>
                <input 
                  type="date"
                  value={printStartDate}
                  onChange={(e) => setPrintStartDate(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-md py-1 px-2 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-blue-800 mb-0.5">Date Fin</label>
                <input 
                  type="date"
                  value={printEndDate}
                  onChange={(e) => setPrintEndDate(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-md py-1 px-2 text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!printStartDate || !printEndDate) {
                  alert("Veuillez sélectionner les dates de début et de fin.");
                  return;
                }
                setCustomRangePrint(true);
                setActivePrintPayment(null);
                setTimeout(triggerNativePrint, 300);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs leading-loose transition text-center flex items-center justify-center space-x-1"
            >
              <FileText size={13} />
              <span>Générer & Exporter PDF</span>
            </button>
          </div>

          {/* HISTORICAL REMIS list */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <FileText size={16} className="text-slate-500 mr-1.5" />
              Payes remises (Historique)
            </h3>
            
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {payments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Aucun historique de paye remis pour le moment.
                </div>
              ) : (
                payments.map(pay => (
                  <div key={pay.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-slate-700 font-mono">Remis le {pay.datePaye}</span>
                        <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">"{pay.notes}"</p>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 font-mono">
                        {formatCurrency(pay.amountTotal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/50">
                      <span>{pay.includedEntries.length} journées incluses</span>
                      
                      {/* Action trigger standard printable and Undo */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomRangePrint(false);
                            setActivePrintPayment(pay);
                            setTimeout(triggerNativePrint, 300);
                          }}
                          className="text-blue-600 hover:underline font-bold flex items-center text-[10px]"
                        >
                          <FileText size={11} className="mr-0.5" /> PDF
                        </button>
                        <span>|</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Es-tu sûr de vouloir supprimer cet archivage de paye ? Cela remettra toutes les journées incluses dans la catégorie 'Non payé'.")) {
                              onDeletePayment(pay.id);
                            }
                          }}
                          className="text-rose-600 hover:underline font-bold flex items-center text-[10px]"
                        >
                          <Trash2 size={11} className="mr-0.5" /> Annuler
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
      <div className="hidden print:block fixed inset-0 bg-white text-slate-800 p-8 z-100 max-w-4xl mx-auto" id="printable-sheet-report">
        
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
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Note d'approbation réglementaire</span>
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
            <span className="block mt-4 font-script text-base text-slate-600 italic">Zachary Martel</span>
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
