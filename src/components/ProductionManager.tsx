/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  IceCream, 
  Calendar, 
  Calculator, 
  CheckCircle, 
  AlertCircle,
  X,
  PlusCircle,
  Clock,
  Check
} from 'lucide-react';
import { ProductionEntry } from '../types';
import { formatCurrency } from '../utils';

interface ProductionManagerProps {
  entries: ProductionEntry[];
  onAddEntry: (entry: Omit<ProductionEntry, 'id' | 'createdAt'>) => void;
  onUpdateEntry: (id: string, updated: Partial<ProductionEntry>) => void;
  onDeleteEntry: (id: string) => void;
  pocketPrice: number;
  bagPrice: number;
}

export default function ProductionManager({ 
  entries, 
  onAddEntry, 
  onUpdateEntry, 
  onDeleteEntry,
  pocketPrice,
  bagPrice
}: ProductionManagerProps) {
  
  // State for Form inputs
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
  });
  const [pockets12kg, setPockets12kg] = useState<number>(0);
  const [bags27kg, setBags27kg] = useState<number>(0);
  const [status, setStatus] = useState<'Non payé' | 'Payé'>('Non payé');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search / filter state
  const [searchDate, setSearchDate] = useState<string>('');
  
  // Selection state for multiple items deletions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Delete confirm state for single entry
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Feedback messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Set message helper with auto-clear
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Form submit (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pockets12kg < 0 || bags27kg < 0) {
      showFeedback('error', 'Le nombre de poches ou sacs ne peut pas être négatif.');
      return;
    }

    if (pockets12kg === 0 && bags27kg === 0) {
      showFeedback('error', 'Veuillez saisir au moins une quantité de poches ou de sacs.');
      return;
    }

    if (!date) {
      showFeedback('error', 'Veuillez sélectionner une date valide.');
      return;
    }

    if (editingId) {
      // Edit mode
      onUpdateEntry(editingId, {
        date,
        time,
        pockets12kg,
        bags27kg,
        status
      });
      showFeedback('success', 'Entrée de production mise à jour avec succès.');
      setEditingId(null);
    } else {
      // Add mode - duplicate check on both date and time (shifts)
      const duplicate = entries.find(e => e.date === date && e.time === time);
      if (duplicate) {
        showFeedback('error', `Une entrée existe déjà pour le ${date} à ${time}.`);
        return;
      }

      onAddEntry({
        date,
        time,
        pockets12kg,
        bags27kg,
        status
      });
      showFeedback('success', 'Nouvelle production créée avec succès.');
    }

    // Reset counts but keep date & time for continuous tracking ease
    setPockets12kg(0);
    setBags27kg(0);
    setStatus('Non payé');
  };

  // Trigger edit mode
  const startEdit = (entry: ProductionEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setTime(entry.time || '12:00');
    setPockets12kg(entry.pockets12kg);
    setBags27kg(entry.bags27kg);
    setStatus(entry.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setTime(() => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      return `${hrs}:${mins}`;
    });
    setPockets12kg(0);
    setBags27kg(0);
    setStatus('Non payé');
  };

  // Handle Delete triggers
  const triggerDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      onDeleteEntry(confirmDeleteId);
      setSelectedIds(prev => prev.filter(item => item !== confirmDeleteId));
      showFeedback('success', "L'entrée de production a été supprimée définitivement.");
      setConfirmDeleteId(null);
    }
  };

  // Multiple selections delete trigger
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    
    if (window.confirm(`Es-tu sûr de vouloir supprimer définitivement les ${selectedIds.length} entrées de production sélectionnées ?`)) {
      selectedIds.forEach(id => {
        onDeleteEntry(id);
      });
      setSelectedIds([]);
      showFeedback('success', `${selectedIds.length} entrées supprimées avec succès.`);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Toggle select all
  const handleToggleSelectAll = (filteredList: ProductionEntry[]) => {
    const filteredIds = filteredList.map(e => e.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const unique = new Set([...prev, ...filteredIds]);
        return Array.from(unique);
      });
    }
  };

  // Filter entries
  const filteredEntries = entries
    .filter(entry => {
      if (!searchDate) return true;
      return entry.date.includes(searchDate);
    })
    .sort((a, b) => {
      // Sort primarily by date desc, then by time desc
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      const tA = a.time || '00:00';
      const tB = b.time || '00:00';
      return tB.localeCompare(tA);
    });

  // Calculations for current inputs
  const formPocketEarnings = pockets12kg * pocketPrice;
  const formBagEarnings = bags27kg * bagPrice;
  const formTotalEarnings = formPocketEarnings + formBagEarnings;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="production-manager-tab">
      
      {/* COLUMN 1: EDIT / CREATE ENTRIES FORM */}
      <div className="lg:col-span-5 space-y-4" id="production-form-col">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center">
              <PlusCircle className="mr-2 text-blue-600" size={18} />
              {editingId ? 'Modifier l\'Entrée' : 'Saisir une Production'}
            </h2>
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center border border-slate-200 px-2.5 py-1 rounded-xl bg-slate-50"
              >
                <X size={12} className="mr-1" /> Annuler
              </button>
            )}
          </div>

          {/* Feedback messages */}
          {message && (
            <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs mb-4 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              <span className="font-bold">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input: Date and Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Date
                </label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-800 focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Heure de visite
                </label>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-800 focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
                  required
                />
              </div>
            </div>

            {/* Input Counts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Poches 12 kg (0,40$)
                </label>
                <input 
                  type="number" 
                  value={pockets12kg || ''}
                  onChange={(e) => setPockets12kg(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-800 focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Sacs 2,7 kg (0,30$)
                </label>
                <input 
                  type="number" 
                  value={bags27kg || ''}
                  onChange={(e) => setBags27kg(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-800 focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
                />
              </div>
            </div>

            {/* Input: Pay Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Statut de Paiement
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Non payé')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 border ${
                    status === 'Non payé' 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-pulse" />
                  Non payé
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Payé')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 border ${
                    status === 'Payé' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                  Déjà payé
                </button>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="bg-blue-50/30 rounded-2xl p-4 border border-blue-100 flex flex-col justify-between">
              <span className="text-[10px] font-black text-blue-800 tracking-wider uppercase mb-2 flex items-center">
                <Calculator size={13} className="mr-1 text-blue-500" /> Coûts réels estimés
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-slate-600">
                  <span>Poches ({pockets12kg} × 0,40$) :</span>
                  <span>{formatCurrency(formPocketEarnings)}</span>
                </div>
                <div className="flex justify-between font-mono text-slate-600">
                  <span>Sacs ({bags27kg} × 0,30$) :</span>
                  <span>{formatCurrency(formBagEarnings)}</span>
                </div>
                <div className="border-t border-blue-100/60 pt-2 flex justify-between font-black text-blue-900 text-sm">
                  <span>Total brut estimé :</span>
                  <span className="font-mono">{formatCurrency(formTotalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm hover:shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>{editingId ? '✏️ Mettre à jour' : '⚡ Enregistrer l\'Entrée'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* COLUMN 2: LIST WITH MULTIPLE SELECTIONS & ACTIONS */}
      <div className="lg:col-span-7 space-y-4" id="production-list-col">
        
        {/* Filter header with bulk controls */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">Tableau de Saisie de Production</h3>
              <p className="text-xs text-slate-400">Gère tes rapports de production glacier</p>
            </div>
            
            <div className="relative max-w-xs w-full sm:w-56">
              <input 
                type="text" 
                placeholder="Rechercher par date YYYY-MM..." 
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
            </div>
          </div>

          {/* Bulk Controls Row */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            {filteredEntries.length > 0 && (
              <button
                type="button"
                onClick={() => handleToggleSelectAll(filteredEntries)}
                className="text-xs text-blue-600 hover:text-blue-700 font-extrabold"
              >
                {filteredEntries.every(e => selectedIds.includes(e.id)) ? 'Désélectionner tout' : 'Sélectionner tout filtré'}
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-3xs cursor-pointer"
              >
                <span>🗑️</span> Supprimer la sélection ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Entries Loop */}
        <div className="space-y-3" id="entries-loop">
          {filteredEntries.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 shadow-sm">
              <Calendar className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-xs font-semibold">Aucun rapport de production trouvé.</p>
              {searchDate && (
                <button 
                  onClick={() => setSearchDate('')}
                  className="text-xs text-blue-600 underline mt-1 font-bold"
                >
                  Réinitialiser le filtre
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map(entry => {
              const dayTotalValue = (entry.pockets12kg * pocketPrice) + (entry.bags27kg * bagPrice);
              const isChecked = selectedIds.includes(entry.id);
              
              return (
                <div 
                  key={entry.id} 
                  className={`bg-white border rounded-2xl p-4 shadow-3xs transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 relative min-h-24 ${
                    isChecked ? 'border-blue-400 bg-blue-50/10' : 'border-slate-200 hover:border-slate-350'
                  }`}
                  id={`entry-card-${entry.id}`}
                >
                  
                  {/* Select box + Info */}
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div 
                      onClick={() => handleToggleSelect(entry.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 cursor-pointer mt-0.5 ${
                        isChecked 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-300 bg-white hover:border-blue-400'
                      }`}
                    >
                      {isChecked && <Check size={11} className="stroke-[3]" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 font-mono tracking-tight">
                          {entry.date} {entry.time ? `@ ${entry.time}` : ''}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                          entry.status === 'Payé' 
                            ? 'bg-emerald-50 text-emerald-800' 
                            : 'bg-amber-50 text-amber-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-500 pt-0.5">
                        <div className="flex items-center gap-1">
                          <IceCream size={13} className="text-blue-500 shrink-0" />
                          <span>Poches (12kg): <strong className="text-slate-800 font-mono">{entry.pockets12kg}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IceCream size={13} className="text-cyan-400 shrink-0" />
                          <span>Sacs (2.7kg): <strong className="text-slate-800 font-mono">{entry.bags27kg}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing / Actions Column */}
                  <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Salaire</p>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {formatCurrency(dayTotalValue)}
                      </span>
                    </div>

                    {/* MODIFICATION ✏️ (bleu) & SUPPRESSION 🗑️ (rouge) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(entry)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-3xs cursor-pointer"
                        title="Modifier cette journée"
                      >
                        <span>✏️</span>
                        <span className="hidden sm:inline">Modifier</span>
                      </button>
                      
                      <button
                        onClick={() => triggerDelete(entry.id)}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-3xs cursor-pointer"
                        title="Supprimer cette journée"
                      >
                        <span>🗑️</span>
                        <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* DELETE DIALOG SAFE GUARD */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-confirmation-overlay">
          <div className="bg-white border border-slate-150 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <span>🗑️</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-950">Confirmer la suppression</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Es-tu sûr de vouloir supprimer définitivement cette entrée de production ? Cette action est irréversible et modifiera le solde de paye correspondant.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition"
              >
                Annuler
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
