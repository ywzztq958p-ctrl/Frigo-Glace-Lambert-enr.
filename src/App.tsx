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
  User,
  LogIn,
  LogOut,
  Cloud,
  RefreshCw,
  Settings
} from 'lucide-react';

import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logOut, signInWithEmail, signUpWithEmail } from './firebase';
import { FirebaseSync } from './firebaseSync';
import { StorageAPI } from './utils';
import { ProductionEntry, PayPayment, EventCategory, CalendarEvent, QuickNote, AppSettings } from './types';

// Importing Custom Views
import Dashboard from './components/Dashboard';
import ProductionManager from './components/ProductionManager';
import Wallet from './components/Wallet';
import Analytics from './components/Analytics';
import CalendarNotes from './components/CalendarNotes';
import SettingsView from './components/Settings';
import EmailAuthForm from './components/EmailAuthForm';

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
  const [settings, setSettings] = useState<AppSettings>({
    id: 'default',
    userId: 'default',
    darkMode: false,
    pocketPrice: 0.40,
    bagPrice: 0.30
  });

  // Dark mode side effect
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Auth & Sync State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Load from Storage API or Firestore depending on auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setSyncStatus('syncing');
        try {
          // Sync any existing local storage state to cloud on first login
          const localProd = StorageAPI.getProduction();
          const localPay = StorageAPI.getPayments();
          const localCat = StorageAPI.getCategories();
          const localEvt = StorageAPI.getEvents();
          const localNote = StorageAPI.getNotes();

          await FirebaseSync.syncLocalStorageToCloud(currentUser.uid, {
            production: localProd,
            payments: localPay,
            categories: localCat,
            events: localEvt,
            notes: localNote
          });
          setSyncStatus('synced');
        } catch (syncErr) {
          console.error("Erreur de synchronisation initiale:", syncErr);
          setSyncStatus('error');
        }

        // Setup live subscriptions
        const unsubProd = FirebaseSync.subscribeProduction(currentUser.uid, setProduction);
        const unsubPay = FirebaseSync.subscribePayments(currentUser.uid, setPayments);
        const unsubCat = FirebaseSync.subscribeCategories(currentUser.uid, setCategories);
        const unsubEvt = FirebaseSync.subscribeEvents(currentUser.uid, setEvents);
        const unsubNote = FirebaseSync.subscribeNotes(currentUser.uid, setNotes);
        const unsubSettings = FirebaseSync.subscribeSettings(currentUser.uid, async (remoteSettings) => {
          if (remoteSettings) {
            setSettings(remoteSettings);
          } else {
            const localSettings = StorageAPI.getSettings();
            await FirebaseSync.saveSettings(currentUser.uid, {
              darkMode: localSettings.darkMode,
              pocketPrice: localSettings.pocketPrice,
              bagPrice: localSettings.bagPrice
            });
          }
        });

        return () => {
          unsubProd();
          unsubPay();
          unsubCat();
          unsubEvt();
          unsubNote();
          unsubSettings();
        };
      } else {
        // Guest mode fallback
        setProduction(StorageAPI.getProduction());
        setPayments(StorageAPI.getPayments());
        setCategories(StorageAPI.getCategories());
        setEvents(StorageAPI.getEvents());
        setNotes(StorageAPI.getNotes());
        setSettings(StorageAPI.getSettings());
        setSyncStatus('idle');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateSettings = async (updatedFields: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updatedFields };
    setSettings(newSettings);
    StorageAPI.saveSettings(newSettings);

    if (user) {
      await FirebaseSync.saveSettings(user.uid, {
        darkMode: newSettings.darkMode,
        pocketPrice: newSettings.pocketPrice,
        bagPrice: newSettings.bagPrice
      });
    }
  };

  const getGreetingName = () => {
    if (user) {
      if (user.displayName) return user.displayName.split(' ')[0];
      if (user.email) return user.email.split('@')[0];
    }
    return 'Zachary';
  };

  // PRODUCTION MANAGEMENT EVENT CALLBACKS
  const handleAddEntry = async (newEntry: Omit<ProductionEntry, 'id' | 'createdAt'>) => {
    const freshEntry: ProductionEntry = {
      ...newEntry,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    };
    if (user) {
      await FirebaseSync.saveProductionEntry(user.uid, freshEntry);
    } else {
      const updated = [freshEntry, ...production];
      setProduction(updated);
      StorageAPI.saveProduction(updated);
    }
  };

  const handleUpdateEntry = async (id: string, updatedFields: Partial<ProductionEntry>) => {
    const target = production.find(item => item.id === id);
    if (!target) return;
    const updatedUserEntry = { ...target, ...updatedFields };
    if (user) {
      await FirebaseSync.saveProductionEntry(user.uid, updatedUserEntry);
    } else {
      const updated = production.map(item => {
        if (item.id === id) {
          return updatedUserEntry;
        }
        return item;
      });
      setProduction(updated);
      StorageAPI.saveProduction(updated);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (user) {
      // Revert states in DB
      await FirebaseSync.deleteProductionEntry(id);

      // If deleted entry was associated with a payment, remove it or adjust payment sum
      const matchingPayment = payments.find(p => p.includedEntries.includes(id));
      if (matchingPayment) {
        const entryToSubtractBeforeRemoval = production.find(e => e.id === id);
        if (entryToSubtractBeforeRemoval) {
          const valueToSubtract = (entryToSubtractBeforeRemoval.pockets12kg * settings.pocketPrice) + (entryToSubtractBeforeRemoval.bags27kg * settings.bagPrice);
          const updatedEntries = matchingPayment.includedEntries.filter(itemId => itemId !== id);
          if (updatedEntries.length > 0) {
            const updatedPayment: PayPayment = {
              ...matchingPayment,
              amountTotal: Math.max(0, matchingPayment.amountTotal - valueToSubtract),
              includedEntries: updatedEntries
            };
            await FirebaseSync.savePayment(user.uid, updatedPayment);
          } else {
            await FirebaseSync.deletePayment(matchingPayment.id);
          }
        }
      }
    } else {
      // Local state fallback
      const updated = production.filter(item => item.id !== id);
      setProduction(updated);
      StorageAPI.saveProduction(updated);

      // If deleted entry was associated with a payment, remove it or adjust payment sum
      const matchingPayment = payments.find(p => p.includedEntries.includes(id));
      if (matchingPayment) {
        const entryToSubtractBeforeRemoval = production.find(e => e.id === id);
        if (entryToSubtractBeforeRemoval) {
          const valueToSubtract = (entryToSubtractBeforeRemoval.pockets12kg * settings.pocketPrice) + (entryToSubtractBeforeRemoval.bags27kg * settings.bagPrice);
          
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
    }
  };

  // WALLET PAYMENT STATUS CHANGERS
  const handleMarkAsPaid = async (entryIds: string[], notesText: string) => {
    // Find wages sum
    let aggregateSalary = 0;
    const itemsToMark = production.map(item => {
      if (entryIds.includes(item.id)) {
        aggregateSalary += (item.pockets12kg * settings.pocketPrice) + (item.bags27kg * settings.bagPrice);
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

    if (user) {
      // In cloud mode, write modifications to database
      for (const entry of mappedWithPayId) {
        if (entryIds.includes(entry.id)) {
          await FirebaseSync.saveProductionEntry(user.uid, entry);
        }
      }
      await FirebaseSync.savePayment(user.uid, newPayment);
    } else {
      setProduction(mappedWithPayId);
      StorageAPI.saveProduction(mappedWithPayId);

      const updatedPayments = [newPayment, ...payments];
      setPayments(updatedPayments);
      StorageAPI.savePayments(updatedPayments);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
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

    if (user) {
      for (const entryRef of restoredProduction) {
        if (entryRef.payId === paymentId || payment.includedEntries.includes(entryRef.id)) {
          await FirebaseSync.saveProductionEntry(user.uid, entryRef);
        }
      }
      await FirebaseSync.deletePayment(paymentId);
    } else {
      setProduction(restoredProduction);
      StorageAPI.saveProduction(restoredProduction);

      const refreshedPayments = payments.filter(p => p.id !== paymentId);
      setPayments(refreshedPayments);
      StorageAPI.savePayments(refreshedPayments);
    }
  };

  // CATEGORIES CALLBACKS
  const handleAddCategory = async (newCat: Omit<EventCategory, 'id'>) => {
    const freshCat: EventCategory = {
      ...newCat,
      id: `cat-${Date.now()}`
    };
    if (user) {
      await FirebaseSync.saveCategory(user.uid, freshCat);
    } else {
      const updated = [...categories, freshCat];
      setCategories(updated);
      StorageAPI.saveCategories(updated);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (user) {
      await FirebaseSync.deleteCategory(id);
    } else {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      StorageAPI.saveCategories(updated);
    }
  };

  // CALENDAR EVENTS CALLBACKS
  const handleAddEvent = async (newEvent: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const freshEvent: CalendarEvent = {
      ...newEvent,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    if (user) {
      await FirebaseSync.saveEvent(user.uid, freshEvent);
    } else {
      const updated = [freshEvent, ...events];
      setEvents(updated);
      StorageAPI.saveEvents(updated);
    }
  };

  const handleUpdateEvent = async (id: string, updatedFields: Partial<CalendarEvent>) => {
    const target = events.find(item => item.id === id);
    if (!target) return;
    const updatedUserEvent = { ...target, ...updatedFields };
    if (user) {
      await FirebaseSync.saveEvent(user.uid, updatedUserEvent);
    } else {
      const updated = events.map(item => {
        if (item.id === id) {
          return updatedUserEvent;
        }
        return item;
      });
      setEvents(updated);
      StorageAPI.saveEvents(updated);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (user) {
      await FirebaseSync.deleteEvent(id);
    } else {
      const updated = events.filter(item => item.id !== id);
      setEvents(updated);
      StorageAPI.saveEvents(updated);
    }
  };

  // NOTES CALLBACKS
  const handleAddNote = async (newNote: Omit<QuickNote, 'id'>) => {
    const freshNote: QuickNote = {
      ...newNote,
      id: `note-${Date.now()}`
    };
    if (user) {
      await FirebaseSync.saveNote(user.uid, freshNote);
    } else {
      const updated = [freshNote, ...notes];
      setNotes(updated);
      StorageAPI.saveNotes(updated);
    }
  };

  const handleUpdateNote = async (id: string, updatedFields: Partial<QuickNote>) => {
    const target = notes.find(item => item.id === id);
    if (!target) return;
    const updatedUserNote = { ...target, ...updatedFields };
    if (user) {
      await FirebaseSync.saveNote(user.uid, updatedUserNote);
    } else {
      const updated = notes.map(item => {
        if (item.id === id) {
          return updatedUserNote;
        }
        return item;
      });
      setNotes(updated);
      StorageAPI.saveNotes(updated);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (user) {
      await FirebaseSync.deleteNote(id);
    } else {
      const updated = notes.filter(item => item.id !== id);
      setNotes(updated);
      StorageAPI.saveNotes(updated);
    }
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
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left cursor-pointer ${
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
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left cursor-pointer ${
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
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left cursor-pointer ${
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
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left cursor-pointer ${
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
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left cursor-pointer ${
                activeTab === 'calendrier' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar size={16} />
              <span>Agenda & Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-xs select-none text-left cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={16} />
              <span>Réglages</span>
            </button>
          </nav>
        </div>

        {/* Auth Sync Sidebar Panel */}
        <div className="p-6 pt-0 mt-2 border-t border-slate-800">
          <div className="mt-6 bg-slate-800/60 rounded-2xl p-4 border border-slate-850">
            {authLoading ? (
              <div className="flex items-center justify-center py-2 text-slate-400 text-xs">
                <RefreshCw size={14} className="animate-spin mr-2 text-blue-500" />
                Chargement...
              </div>
            ) : user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="w-8 h-8 rounded-full border border-slate-700 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                      {getGreetingName().substring(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-white truncate leading-none">
                      {user.displayName || 'Mon Compte'}
                    </p>
                    <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                      <Cloud size={10} className="stroke-[2.5]" />
                      Cloud Sync Actif
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={async () => {
                    await logOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all select-none cursor-pointer"
                >
                  <LogOut size={11} />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1">
                    <Cloud size={10} className="text-amber-500" />
                    Sauvegarde Cloud
                  </p>
                  <p className="text-[10.5px] text-slate-400 font-bold leading-relaxed">
                    Accédez à vos données n'importe où ! Si la connexion Google ne fonctionne pas sur votre iPhone, utilisez l'option Email ci-dessous.
                  </p>
                </div>
                
                <button
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer shadow-md shadow-blue-900/30"
                >
                  <LogIn size={11} />
                  <span>Connexion Google</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-2 text-[8px] text-slate-500 uppercase font-black">OU</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <EmailAuthForm isDarkBg={true} />
              </div>
            )}
          </div>
        </div>
        
        {/* Calculators Bottom Widget */}
        <div className="mt-auto p-6">
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">Calculateurs</p>
            <div className="space-y-1 text-xs text-slate-200">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Poche 12kg</span>
                <span className="text-blue-400 font-mono font-bold">{settings.pocketPrice.toFixed(2)}$</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Sac 2,7kg</span>
                <span className="text-blue-400 font-mono font-bold">{settings.bagPrice.toFixed(2)}$</span>
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
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Salut {getGreetingName()} 👋</h2>
            <p className="text-xs text-slate-400 font-bold capitalize">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Active module category identifier pill */}
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest leading-none">
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'production' && 'Saisie de production'}
              {activeTab === 'portefeuille' && 'Portefeuille & Payes'}
              {activeTab === 'graphiques' && 'Analyses & Graphiques'}
              {activeTab === 'calendrier' && 'Agenda & Calendrier'}
              {activeTab === 'settings' && 'Réglages & Taux'}
            </span>
            {user && user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border border-slate-200 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center font-bold text-white text-sm select-none uppercase">
                {getGreetingName().substring(0, 1)}
              </div>
            )}
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
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors cursor-pointer"
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
              className="md:hidden border-b border-slate-200 bg-white px-3 py-4 space-y-1 block shadow-lg sticky top-16 z-30 print:hidden max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={15} /> <span>Tableau de Bord</span>
              </button>
              <button
                onClick={() => { setActiveTab('production'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition cursor-pointer ${
                  activeTab === 'production' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ClipboardList size={15} /> <span>Saisie de Production</span>
              </button>
              <button
                onClick={() => { setActiveTab('portefeuille'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition cursor-pointer ${
                  activeTab === 'portefeuille' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Coins size={15} /> <span>Portefeuille (Payes)</span>
              </button>
              <button
                onClick={() => { setActiveTab('graphiques'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition cursor-pointer ${
                  activeTab === 'graphiques' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TrendingUp size={15} /> <span>Graphiques de Performance</span>
              </button>
              <button
                onClick={() => { setActiveTab('calendrier'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition cursor-pointer ${
                  activeTab === 'calendrier' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar size={15} /> <span>Agenda & Notes</span>
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-2.5 transition cursor-pointer ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Settings size={15} /> <span>Réglages</span>
              </button>

              <div className="border-t border-slate-100 pt-3 pb-1 mt-3">
                {authLoading ? (
                  <div className="flex items-center justify-center py-2 text-slate-400 text-xs">
                    <RefreshCw size={13} className="animate-spin mr-2 text-blue-500" />
                    Chargement...
                  </div>
                ) : user ? (
                  <div className="flex items-center justify-between px-3">
                    <div className="flex items-center space-x-2">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Avatar" 
                          className="w-6 h-6 rounded-full border border-slate-200" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-black">
                          {getGreetingName().substring(0, 1)}
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-black text-slate-700 block leading-none">
                          {user.displayName || 'Utilisateur'}
                        </span>
                        <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                          <Cloud size={8} /> Données synchronisées
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await logOut();
                        setMobileMenuOpen(false);
                      }}
                      className="p-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-black uppercase rounded-lg border border-red-100 cursor-pointer transition whitespace-nowrap"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 px-3">
                    <p className="text-[9px] text-slate-400 font-bold">Connectez-vous pour conserver vos données et y accéder sur d'autres appareils :</p>
                    <button
                      onClick={async () => {
                        try {
                          await signInWithGoogle();
                          setMobileMenuOpen(false);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <LogIn size={11} /> Connexion Google
                    </button>

                    <div className="relative flex py-0.5 items-center">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-2 text-[8px] text-slate-450 uppercase font-bold">OU</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <EmailAuthForm onSuccess={() => setMobileMenuOpen(false)} isDarkBg={false} />
                  </div>
                )}
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
                  pocketPrice={settings.pocketPrice}
                  bagPrice={settings.bagPrice}
                />
              )}

              {activeTab === 'production' && (
                <ProductionManager
                  entries={production}
                  onAddEntry={handleAddEntry}
                  onUpdateEntry={handleUpdateEntry}
                  onDeleteEntry={handleDeleteEntry}
                  pocketPrice={settings.pocketPrice}
                  bagPrice={settings.bagPrice}
                />
              )}

              {activeTab === 'portefeuille' && (
                <Wallet
                  production={production}
                  payments={payments}
                  onMarkAsPaid={handleMarkAsPaid}
                  onDeletePayment={handleDeletePayment}
                  onNavigate={(tab) => { setActiveTab(tab); }}
                  pocketPrice={settings.pocketPrice}
                  bagPrice={settings.bagPrice}
                />
              )}

              {activeTab === 'graphiques' && (
                <Analytics 
                  entries={production}
                  pocketPrice={settings.pocketPrice}
                  bagPrice={settings.bagPrice}
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

              {activeTab === 'settings' && (
                <SettingsView 
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  user={user}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer component */}
        <footer className="bg-white border-t border-slate-100 py-4 print:hidden shrink-0 mt-auto">
          <div className="px-6 text-center text-[10px] text-slate-400 font-medium font-sans">
            &copy; {new Date().getFullYear()} Production Glace – Lambert enr. Tous droits réservés. Outil de gestion privée pour Zachary Martel.
          </div>
        </footer>

      </div>
    </div>
  );
}
