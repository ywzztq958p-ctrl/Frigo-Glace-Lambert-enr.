/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Coins, 
  TrendingUp, 
  Calendar, 
  ClipboardList, 
  Menu, 
  X, 
  IceCream, 
  Activity,
  User
} from 'lucide-react';

import { StorageAPI } from './utils';
import { ProductionEntry, PayPayment, EventCategory, CalendarEvent, QuickNote } from './types';

// Importing Custom Views
import Dashboard from './components/Dashboard';
import ProductionManager from './components/ProductionManager';
import Wallet from './components/Wallet';
import Analytics from './components/Analytics';
import CalendarNotes from './components/CalendarNotes';

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core synchronized persistent states
  const [production, setProduction] = useState<ProductionEntry[]>([]);
  const [payments, setPayments] = useState<PayPayment[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);

  // Load from Storage API on boot
  useEffect(() => {
    setProduction(StorageAPI.getProduction());
    setPayments(StorageAPI.getPayments());
    setCategories(StorageAPI.getCategories());
    setEvents(StorageAPI.getEvents());
    setNotes(StorageAPI.getNotes());
  }, []);

  // PRODUCTION MANAGEMENT EVENT CALLBACKS
  const handleAddEntry = (newEntry: Omit<ProductionEntry, 'id' | 'createdAt'>) => {
    const freshEntry: ProductionEntry = {
      ...newEntry,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [freshEntry, ...production];
    setProduction(updated);
    StorageAPI.saveProduction(updated);
  };

  const handleUpdateEntry = (id: string, updatedFields: Partial<ProductionEntry>) => {
    const updated = production.map(item => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      return item;
    });
    setProduction(updated);
    StorageAPI.saveProduction(updated);
  };

  const handleDeleteEntry = (id: string) => {
    // Revert state
    const updated = production.filter(item => item.id !== id);
    setProduction(updated);
    StorageAPI.saveProduction(updated);

    // If deleted entry was associated with a payment, remove it or adjust payment sum
    const matchingPayment = payments.find(p => p.includedEntries.includes(id));
    if (matchingPayment) {
      // Re-calculate the payment amount total or remove the item from it
      const entryToSubtractBeforeRemoval = production.find(e => e.id === id);
      if (entryToSubtractBeforeRemoval) {
        const valueToSubtract = (entryToSubtractBeforeRemoval.pockets12kg * 0.40) + (entryToSubtractBeforeRemoval.bags27kg * 0.30);
        
        const adjustedPayments = payments.map(pay => {
          if (pay.id === matchingPayment.id) {
            return {
              ...pay,
              amountTotal: Math.max(0, pay.amountTotal - valueToSubtract),
              includedEntries: pay.includedEntries.filter(itemId => itemId !== id)
            };
          }
          return pay;
        }).filter(p => p.includedEntries.length > 0); // Delete payment if it gets empty

        setPayments(adjustedPayments);
        StorageAPI.savePayments(adjustedPayments);
      }
    }
  };

  // WALLET PAYMENT STATUS CHANGERS
  const handleMarkAsPaid = (entryIds: string[], notesText: string) => {
    // Find wages sum
    let aggregateSalary = 0;
    const itemsToMark = production.map(item => {
      if (entryIds.includes(item.id)) {
        aggregateSalary += (item.pockets12kg * 0.40) + (item.bags27kg * 0.30);
        return { ...item, status: 'Payé' as const };
      }
      return item;
    });

    const paymentId = `pay-${Date.now()}`;
    const newPayment: PayPayment = {
      id: paymentId,
      datePaye: new Date().toISOString().split('T')[0],
      amountTotal: aggregateSalary,
      includedEntries: entryIds,
      notes: notesText
    };

    // Append Payment reference inside production logs
    const mappedWithPayId = itemsToMark.map(item => {
      if (entryIds.includes(item.id)) {
        return { ...item, payId: paymentId };
      }
      return item;
    });

    setProduction(mappedWithPayId);
    StorageAPI.saveProduction(mappedWithPayId);

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    StorageAPI.savePayments(updatedPayments);
  };

  const handleDeletePayment = (paymentId: string) => {
    // Locate payment
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    // Reset all production units with this payId back into Status = Non payé
    const restoredProduction = production.map(item => {
      if (item.payId === paymentId || payment.includedEntries.includes(item.id)) {
        return { ...item, status: 'Non payé' as const, payId: null };
      }
      return item;
    });

    setProduction(restoredProduction);
    StorageAPI.saveProduction(restoredProduction);

    const refreshedPayments = payments.filter(p => p.id !== paymentId);
    setPayments(refreshedPayments);
    StorageAPI.savePayments(refreshedPayments);
  };

  // CATEGORIES CALLBACKS
  const handleAddCategory = (newCat: Omit<EventCategory, 'id'>) => {
    const freshCat: EventCategory = {
      ...newCat,
      id: `cat-${Date.now()}`
    };
    const updated = [...categories, freshCat];
    setCategories(updated);
    StorageAPI.saveCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    StorageAPI.saveCategories(updated);
  };

  // CALENDAR EVENTS CALLBACKS
  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const freshEvent: CalendarEvent = {
      ...newEvent,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [freshEvent, ...events];
    setEvents(updated);
    StorageAPI.saveEvents(updated);
  };

  const handleUpdateEvent = (id: string, updatedFields: Partial<CalendarEvent>) => {
    const updated = events.map(item => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      return item;
    });
    setEvents(updated);
    StorageAPI.saveEvents(updated);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(item => item.id !== id);
    setEvents(updated);
    StorageAPI.saveEvents(updated);
  };

  // NOTES CALLBACKS
  const handleAddNote = (newNote: Omit<QuickNote, 'id'>) => {
    const freshNote: QuickNote = {
      ...newNote,
      id: `note-${Date.now()}`
    };
    const updated = [freshNote, ...notes];
    setNotes(updated);
    StorageAPI.saveNotes(updated);
  };

  const handleUpdateNote = (id: string, updatedFields: Partial<QuickNote>) => {
    const updated = notes.map(item => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      return item;
    });
    setNotes(updated);
    StorageAPI.saveNotes(updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter(item => item.id !== id);
    setNotes(updated);
    StorageAPI.saveNotes(updated);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 overflow-x-hidden">
      
      {/* Sidebar Navigation - Displayed on desktop (md and larger) */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 sticky top-0 h-screen shrink-0 print:hidden hidden md:flex">
        <div className="p-6">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 text-white mb-8 select-none">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <IceCream size={22} className="text-white shrink-0 stroke-[2.5]" />
            </div>
            <h1 className="text-sm font-extrabold leading-tight tracking-tight uppercase">
              Production Glace<br />
              <span className="text-blue-400 text-[10px] font-bold tracking-widest leading-none mt-0.5 block normal-case">
                Lambert enr.
              </span>
            </h1>
          </div>
          
          {/* Main Navigation Links with modern curved/rounded styles */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Tableau de Bord</span>
            </button>

            <button
              onClick={() => setActiveTab('production')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left ${
                activeTab === 'production' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList size={16} />
              <span>Saisie Production</span>
            </button>

            <button
              onClick={() => setActiveTab('portefeuille')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left ${
                activeTab === 'portefeuille' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Coins size={16} />
              <span>Portefeuille (Payes)</span>
            </button>

            <button
              onClick={() => setActiveTab('graphiques')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left ${
                activeTab === 'graphiques' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp size={16} />
              <span>Graphiques</span>
            </button>

            <button
              onClick={() => setActiveTab('calendrier')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left ${
                activeTab === 'calendrier' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar size={16} />
              <span>Agenda & Notes</span>
            </button>
          </nav>
        </div>
        
        {/* Calculators Bottom Widget */}
        <div className="mt-auto p-6">
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">Calculateurs</p>
            <div className="space-y-1 text-xs text-slate-200">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Poche 12kg</span>
                <span className="text-blue-400 font-mono font-bold">0,40$</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Sac 2,7kg</span>
                <span className="text-blue-400 font-mono font-bold">0,30$</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Header Unit - Desktops & Tablets */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30 print:hidden shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Salut Zachary 👋</h2>
            <p className="text-xs text-slate-400 font-bold capitalize">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Active module category identifier pill */}
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'production' && 'Saisie de production'}
              {activeTab === 'portefeuille' && 'Portefeuille & Payes'}
              {activeTab === 'graphiques' && 'Analyses & Graphiques'}
              {activeTab === 'calendrier' && 'Agenda & Calendrier'}
            </span>
            <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center font-bold text-white text-sm select-none">
              Z
            </div>
          </div>
        </header>

        {/* Mobile Navigation Header - Small Screens only (hidden with print and md) */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sticky top-0 z-40 print:hidden md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
              <IceCream size={16} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 uppercase leading-none block">
                Production Glace
              </span>
              <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest leading-none block mt-0.5">
                Lambert enr.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Panel Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden border-b border-slate-200 bg-white px-3 py-3 space-y-1 block shadow-lg sticky top-16 z-30 print:hidden"
            >
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition ${
                  activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={15} /> <span>Tableau de Bord</span>
              </button>
              <button
                onClick={() => { setActiveTab('production'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition ${
                  activeTab === 'production' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ClipboardList size={15} /> <span>Saisie de Production</span>
              </button>
              <button
                onClick={() => { setActiveTab('portefeuille'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition ${
                  activeTab === 'portefeuille' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coins size={15} /> <span>Portefeuille (Payes)</span>
              </button>
              <button
                onClick={() => { setActiveTab('graphiques'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition ${
                  activeTab === 'graphiques' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingUp size={15} /> <span>Graphiques de Performance</span>
              </button>
              <button
                onClick={() => { setActiveTab('calendrier'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition ${
                  activeTab === 'calendrier' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar size={15} /> <span>Agenda & Notes</span>
              </button>

              <div className="border-t border-slate-100 pt-2 pb-1 px-3 mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[9px]">Z</div>
                  <span className="text-[10px] font-bold">Zachary Martel</span>
                </div>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">Employé</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dedicated Main Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  production={production} 
                  events={events} 
                  notes={notes} 
                  onNavigate={(tab) => { setActiveTab(tab); }}
                />
              )}

              {activeTab === 'production' && (
                <ProductionManager
                  entries={production}
                  onAddEntry={handleAddEntry}
                  onUpdateEntry={handleUpdateEntry}
                  onDeleteEntry={handleDeleteEntry}
                />
              )}

              {activeTab === 'portefeuille' && (
                <Wallet
                  production={production}
                  payments={payments}
                  onMarkAsPaid={handleMarkAsPaid}
                  onDeletePayment={handleDeletePayment}
                />
              )}

              {activeTab === 'graphiques' && (
                <Analytics 
                  entries={production}
                />
              )}

              {activeTab === 'calendrier' && (
                <CalendarNotes
                  categories={categories}
                  events={events}
                  notes={notes}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onAddEvent={handleAddEvent}
                  onUpdateEvent={handleUpdateEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer component */}
        <footer className="bg-white border-t border-slate-100 py-4 print:hidden shrink-0 mt-auto">
          <div className="px-6 text-center text-[10px] text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Production Glace – Lambert enr. Tous droits réservés. Outil de gestion privée pour Zachary Martel.
          </div>
        </footer>

      </div>
    </div>
  );
}
