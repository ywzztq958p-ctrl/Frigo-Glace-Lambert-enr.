/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  IceCream, 
  Calendar, 
  Calculator, 
  CheckCircle, 
  AlertCircle,
  X,
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import { ProductionEntry } from '../types';
import { POCKET_PRICE, BAG_PRICE, formatCurrency } from '../utils';

interface ProductionManagerProps {
  entries: ProductionEntry[];
  onAddEntry: (entry: Omit<ProductionEntry, 'id' | 'createdAt'>) => void;
  onUpdateEntry: (id: string, updated: Partial<ProductionEntry>) => void;
  onDeleteEntry: (id: string) => void;
}

export default function ProductionManager({ 
  entries, 
  onAddEntry, 
  onUpdateEntry, 
  onDeleteEntry 
}: ProductionManagerProps) {
  
  // State for Form inputs
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pockets12kg, setPockets12kg] = useState<number>(0);
  const [bags27kg, setBags27kg] = useState<number>(0);
  const [status, setStatus] = useState<'Non payé' | 'Payé'>('Non payé');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search state
  const [searchDate, setSearchDate] = useState<string>('');
  
  // Delete confirm state
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

    if (!date) {
      showFeedback('error', 'Veuillez sélectionner une date valide.');
      return;
    }

    if (editingId) {
      // Edit mode
      onUpdateEntry(editingId, {
        date,
        pockets12kg,
        bags27kg,
        status
      });
      showFeedback('success', 'Entrée de production mise à jour avec succès.');
      setEditingId(null);
    } else {
      // Add mode
      // Check if entry for date already exists
      const duplicate = entries.find(e => e.date === date);
      if (duplicate) {
        showFeedback('error', `Une entrée existe déjà pour le ${date}. Modifiez-la à la place.`);
        return;
      }

      onAddEntry({
        date,
        pockets12kg,
        bags27kg,
        status
      });
      showFeedback('success', 'Nouvelle production créée avec succès.');
    }

    // Reset fields except date to facilitate consecutive logging
    setPockets12kg(0);
    setBags27kg(0);
    setStatus('Non payé');
  };

  // Trigger edit mode
  const startEdit = (entry: ProductionEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setPockets12kg(entry.pockets12kg);
    setBags27kg(entry.bags27kg);
    setStatus(entry.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setPockets12kg(0);
    setBags27kg(0);
    setStatus('Non payé');
  };

  // Handle Delete
  const triggerDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      onDeleteEntry(confirmDeleteId);
      showFeedback('success', "L'entrée de production a été supprimée définitivement.");
      setConfirmDeleteId(null);
    }
  };

  // Filter entries
  const filteredEntries = entries
    .filter(entry => {
      if (!searchDate) return true;
      return entry.date.includes(searchDate);
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  // Current calculated amounts in input form for real-time visual joy
  const formPocketEarnings = pockets12kg * POCKET_PRICE;
  const formBagEarnings = bags27kg * BAG_PRICE;
  const formTotalEarnings = formPocketEarnings + formBagEarnings;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="production-manager-tab">
      
      {/* COLUMN 1: EDIT / CREATE ENTRIES FORM (id: production-form-col) */}
      <div className="lg:col-span-5 space-y-4" id="production-form-col">
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm sticky top-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center">
              <PlusCircle className="mr-2 text-blue-500" size={18} />
              {editingId ? 'Modifier la Production' : 'Nouvelle Production'}
            </h2>
            {editingId && (
              <button 
                type="button" 
                onClick={cancelEdit} 
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold flex items-center border border-slate-200 px-2 py-1 rounded"
              >
                <X size={12} className="mr-1" /> Annuler
              </button>
            )}
          </div>

          {/* Feedback banners */}
          {message && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 text-xs mb-4 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              <span className="font-semibold">{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input: Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Date de Production
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-800 focus:outline-hidden focus:border-blue-400 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Input Counts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Poches de 12 kg (0,40$)
                </label>
                <input 
                  type="number" 
                  value={pockets12kg || ''}
                  onChange={(e) => setPockets12kg(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-800 focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Sacs de 2,7 kg (0,30$)
                </label>
                <input 
                  type="number" 
                  value={bags27kg || ''}
                  onChange={(e) => setBags27kg(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-800 focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
                  required
                />
              </div>
            </div>

            {/* Input: Pay Status (For manually creating or toggling paid status directly) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Statut Initial de Paye
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Non payé')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 border ${
                    status === 'Non payé' 
                      ? 'bg-red-50 text-red-600 border-red-200' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
                  Non payé
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Payé')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 border ${
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

            {/* Calculations Panel (Dynamic calculations on the fly) */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex flex-col justify-between">
              <span className="text-xs font-extrabold text-blue-900 tracking-wider uppercase mb-2 flex items-center">
                <Calculator size={13} className="mr-1 text-blue-500" /> Estimation du jour
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
                <div className="border-t border-blue-100/60 pt-2 flex justify-between font-bold text-blue-900 text-sm">
                  <span>Total brut estimé :</span>
                  <span className="font-mono">{formatCurrency(formTotalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Button */}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
            >
              {editingId ? <Edit2 size={16} /> : <Plus size={16} />}
              <span>{editingId ? 'Mettre à jour l\'entrée' : 'Enregistrer la journée'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* COLUMN 2: LIST EXECUTED LOGS & MODIFICATION TOOLS (id: production-list-col) */}
      <div className="lg:col-span-7 space-y-4" id="production-list-col">
        
        {/* Real-time Filter & Search Header */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Historique de Production</h3>
            <p className="text-xs text-slate-400">Entre et ajuste tes chiffres journaliers</p>
          </div>
          <div className="relative max-w-xs w-full sm:w-60">
            <input 
              type="text" 
              placeholder="Filtrer par date (ex: 2026-06...)" 
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-hidden focus:border-blue-400 focus:bg-white font-mono"
            />
            <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
          </div>
        </div>

        {/* Entries Loop */}
        <div className="space-y-2.5" id="entries-loop">
          {filteredEntries.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-xl p-8 text-center text-slate-400">
              <Calendar className="mx-auto mb-2 opacity-50" size={28} />
              <p className="text-xs font-semibold">Aucune production enregistrée pour cette recherche.</p>
              {searchDate && (
                <button 
                  onClick={() => setSearchDate('')}
                  className="text-xs text-blue-500 underline mt-1 font-semibold"
                >
                  Effacer le filtre
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map(entry => {
              const dayTotalValue = (entry.pockets12kg * POCKET_PRICE) + (entry.bags27kg * BAG_PRICE);
              
              return (
                <div 
                  key={entry.id} 
                  className={`bg-white border border-slate-100 rounded-xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row justify-between sm:items-center gap-3 relative overflow-hidden ${
                    entry.status === 'Payé' ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-rose-400 animate-pulse-subtle'
                  }`}
                  id={`entry-card-${entry.id}`}
                >
                  
                  {/* Info Column */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-800 font-mono tracking-tight">{entry.date}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                        entry.status === 'Payé' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {entry.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1 text-slate-500">
                      <div className="flex items-center space-x-1">
                        <IceCream size={13} className="text-blue-500 shrink-0" />
                        <span className="text-xs font-semibold">
                          Poches (12kg): <strong className="text-slate-800 font-mono">{entry.pockets12kg}</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <IceCream size={13} className="text-cyan-400 shrink-0 select-none opacity-80" />
                        <span className="text-xs font-semibold">
                          Sacs (2.7kg): <strong className="text-slate-800 font-mono">{entry.bags27kg}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing / Actions Column */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Salaire du jour</p>
                      <span className="text-base font-extrabold text-blue-950 font-mono">
                        {formatCurrency(dayTotalValue)}
                      </span>
                    </div>

                    {/* Modification ✏️ & Delete 🗑️ */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Modifier l'entrée"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => triggerDelete(entry.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Supprimer la production"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* DELETE SAFE GUARD DIALOG */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="delete-confirmation-overlay">
          <div className="bg-white border border-slate-100 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Confirmer la suppression</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Es-tu sûr de vouloir supprimer définitivement cette entrée de production ? Cette action est irréversible et affectera ton solde de paye à recevoir.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2 border-t border-slate-50">
              <button 
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200 transition"
              >
                Annuler
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs hover:shadow-sm transition"
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
