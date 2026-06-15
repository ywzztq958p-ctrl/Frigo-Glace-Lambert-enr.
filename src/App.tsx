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
  Settings,
  Bell
} from 'lucide-react';

interface NotificationAlert {
  id: string;
  eventTitle: string;
  timeLabel: string;
  message: string;
  createdAt: number;
}

import { CustomServerSync, CustomUser } from './customServerSync';
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
  const [user, setUser] = useState<any>({
    uid: 'zachary_martel_datacenter',
    displayName: 'Zachary Martel',
    email: 'zacharymartel80@gmail.com',
    username: 'zachary',
    isCustom: true
  });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Reminders notifications engine state
  const [reminderNotifications, setReminderNotifications] = useState<NotificationAlert[]>([]);
  const [triggeredReminders, setTriggeredReminders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lambert_triggered_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load automatically from Custom Server "Data Center" account for Zachary Martel
  useEffect(() => {
    setSyncStatus('syncing');
    setAuthLoading(true);

    CustomServerSync.load('zachary_martel_datacenter').then((res) => {
      if (res && (res.production?.length > 0 || res.payments?.length > 0 || res.categories?.length > 0 || res.events?.length > 0 || res.notes?.length > 0)) {
        if (res.production) setProduction(res.production);
        if (res.payments) setPayments(res.payments);
        if (res.categories && res.categories.length > 0) {
          setCategories(res.categories);
        } else {
          setCategories(StorageAPI.getCategories());
        }
        if (res.events) setEvents(res.events);
        if (res.notes) setNotes(res.notes);
        if (res.settings) {
          setSettings(res.settings);
        } else {
          setSettings(StorageAPI.getSettings());
        }
        setSyncStatus('synced');
      } else {
        // Migration: If server block is fresh, load local storage and let the background saver back it up
        const localProd = StorageAPI.getProduction();
        const localPay = StorageAPI.getPayments();
        const localCat = StorageAPI.getCategories();
        const localEvt = StorageAPI.getEvents();
        const localNote = StorageAPI.getNotes();
        const localSettings = StorageAPI.getSettings();

        setProduction(localProd);
        setPayments(localPay);
        setCategories(localCat);
        setEvents(localEvt);
        setNotes(localNote);
        setSettings(localSettings);
        setSyncStatus('synced');
      }
      setAuthLoading(false);
    }).catch((err) => {
      console.error("Erreur de synchronisation avec le serveur:", err);
      // Fallback offline (local storage)
      setProduction(StorageAPI.getProduction());
      setPayments(StorageAPI.getPayments());
      setCategories(StorageAPI.getCategories());
      setEvents(StorageAPI.getEvents());
      setNotes(StorageAPI.getNotes());
      setSettings(StorageAPI.getSettings());
      setSyncStatus('error');
      setAuthLoading(false);
    });
  }, []);

  // background autosave for Custom Server "Data Center" profile
  useEffect(() => {
    if (user && user.isCustom) {
      const dataToSave = {
        production,
        payments,
        categories,
        events,
        notes,
        settings
      };
      const saveToCustomServer = async () => {
        try {
          setSyncStatus('syncing');
          await CustomServerSync.save(user.uid, dataToSave);
          setSyncStatus('synced');
        } catch (e) {
          console.error("Auto-sync saving error:", e);
          setSyncStatus('error');
        }
      };

      const timer = setTimeout(saveToCustomServer, 500);
      return () => clearTimeout(timer);
    }
  }, [production, payments, categories, events, notes, settings, user]);

  // Helper to play clean notification sound via Web Audio API synthesizer
  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain2.gain.setValueAtTime(0.001, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (err) {
      console.warn("Could not play synthesized sound:", err);
    }
  };

  // Request native HTML5 browser notification permission cleanly
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Calendar events reminders tracking and triggering loop
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const nowMs = now.getTime();
      
      let updatedTriggered = [...triggeredReminders];
      let triggeredAny = false;
      const newNotifications: NotificationAlert[] = [];

      events.forEach(event => {
        // Must have reminder enabled
        if (!event.reminder || !event.date) return;
        
        const rTime = event.reminderTime || '15m';
        if (rTime === 'none') return;

        // Unique key for this reminder trigger
        const triggerKey = `${event.id}_${rTime}`;
        if (updatedTriggered.includes(triggerKey)) return;

        // Parse event scheduled date and time
        const dateParts = event.date.split('-');
        if (dateParts.length !== 3) return;
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);

        const timeStr = event.time || '00:00';
        const timeParts = timeStr.split(':');
        const hour = timeParts.length >= 2 ? parseInt(timeParts[0], 10) : 0;
        const minute = timeParts.length >= 2 ? parseInt(timeParts[1], 10) : 0;

        const eventDate = new Date(year, month, day, hour, minute, 0, 0);
        const eventTimeMs = eventDate.getTime();

        // Calc offset
        let offsetMs = 0;
        let offsetLabel = "à l'heure de l'événement";
        if (rTime === '15m') {
          offsetMs = 15 * 60 * 1000;
          offsetLabel = "15 minutes avant";
        } else if (rTime === '1h') {
          offsetMs = 60 * 60 * 1000;
          offsetLabel = "1 heure avant";
        } else if (rTime === '1d') {
          offsetMs = 24 * 60 * 60 * 1000;
          offsetLabel = "1 jour avant";
        }

        const triggerTimeMs = eventTimeMs - offsetMs;

        // Only trigger if:
        // 1. Current time meets or exceeds trigger time
        // 2. Current time is not older than 1 hour after standard event start (safety block)
        const isPastTrigger = nowMs >= triggerTimeMs;
        const isRecent = nowMs < eventTimeMs + (60 * 60 * 1000);

        if (isPastTrigger && isRecent) {
          // Trigger this reminder!
          updatedTriggered.push(triggerKey);
          triggeredAny = true;

          newNotifications.push({
            id: `notif-${Date.now()}-${event.id}`,
            eventTitle: event.title,
            timeLabel: offsetLabel,
            message: `Cet événement est programmé à ${timeStr} pour une durée de ${event.duration || 'N/A'}.${event.description ? ` "${event.description}"` : ''}`,
            createdAt: Date.now()
          });

          // Standard browser native popup notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`⏰ Rappel : ${event.title}`, {
                body: `Planifié aujourd'hui à ${timeStr} (${offsetLabel})\n${event.description || ''}`,
                tag: event.id
              });
            } catch (e) {
              console.error("Native notification creation crash ignored: ", e);
            }
          }
        }
      });

      if (triggeredAny) {
        setTriggeredReminders(updatedTriggered);
        try {
          localStorage.setItem('lambert_triggered_reminders', JSON.stringify(updatedTriggered));
        } catch (e) {
          console.error(e);
        }

        if (newNotifications.length > 0) {
          setReminderNotifications(prev => [...prev, ...newNotifications]);
          playNotificationSound();
        }
      }
    };

    // Run first immediate check, then schedule subsequent runs
    checkReminders();
    const intervalId = setInterval(checkReminders, 15000);
    return () => clearInterval(intervalId);
  }, [events, triggeredReminders]);

  const handleCustomUserLoggedIn = async (customUser: CustomUser) => {
    const wrappedUser = {
      uid: customUser.uid,
      displayName: customUser.displayName,
      email: customUser.email,
      username: customUser.username,
      isCustom: true
    };
    localStorage.setItem('lambert_custom_user', JSON.stringify(wrappedUser));
    setUser(wrappedUser);
    setSyncStatus('syncing');

    try {
      // Migrate Offline local records to server if server is empty
      const localProd = StorageAPI.getProduction();
      const localPay = StorageAPI.getPayments();
      const localCat = StorageAPI.getCategories();
      const localEvt = StorageAPI.getEvents();
      const localNote = StorageAPI.getNotes();
      const localSettings = StorageAPI.getSettings();

      const serverDataset = await CustomServerSync.load(customUser.uid);

      const finalDataset = {
        production: serverDataset.production && serverDataset.production.length > 0 ? serverDataset.production : localProd,
        payments: serverDataset.payments && serverDataset.payments.length > 0 ? serverDataset.payments : localPay,
        categories: serverDataset.categories && serverDataset.categories.length > 0 ? serverDataset.categories : localCat,
        events: serverDataset.events && serverDataset.events.length > 0 ? serverDataset.events : localEvt,
        notes: serverDataset.notes && serverDataset.notes.length > 0 ? serverDataset.notes : localNote,
        settings: serverDataset.settings ? serverDataset.settings : localSettings
      };

      await CustomServerSync.save(customUser.uid, finalDataset);

      setProduction(finalDataset.production);
      setPayments(finalDataset.payments);
      setCategories(finalDataset.categories);
      setEvents(finalDataset.events);
      setNotes(finalDataset.notes);
      setSettings(finalDataset.settings);
      setSyncStatus('synced');
    } catch (e) {
      console.error("Erreur d'importation vers le serveur personnalisé:", e);
      setSyncStatus('error');
    }
  };

  const handleLogOut = async () => {
    localStorage.removeItem('lambert_custom_user');
    setUser(null);
    setProduction(StorageAPI.getProduction());
    setPayments(StorageAPI.getPayments());
    setCategories(StorageAPI.getCategories());
    setEvents(StorageAPI.getEvents());
    setNotes(StorageAPI.getNotes());
    setSettings(StorageAPI.getSettings());
    setSyncStatus('idle');
  };

  const handleUpdateSettings = async (updatedFields: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updatedFields };
    setSettings(newSettings);
    StorageAPI.saveSettings(newSettings);
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
    const updated = [freshEntry, ...production];
    setProduction(updated);
    StorageAPI.saveProduction(updated);
  };

  const handleUpdateEntry = async (id: string, updatedFields: Partial<ProductionEntry>) => {
    const target = production.find(item => item.id === id);
    if (!target) return;
    const updatedUserEntry = { ...target, ...updatedFields };
    const updated = production.map(item => {
      if (item.id === id) {
        return updatedUserEntry;
      }
      return item;
    });
    setProduction(updated);
    StorageAPI.saveProduction(updated);
  };

  const handleDeleteEntry = async (id: string) => {
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

    setProduction(mappedWithPayId);
    StorageAPI.saveProduction(mappedWithPayId);

    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    StorageAPI.savePayments(updatedPayments);
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

    setProduction(restoredProduction);
    StorageAPI.saveProduction(restoredProduction);

    const refreshedPayments = payments.filter(p => p.id !== paymentId);
    setPayments(refreshedPayments);
    StorageAPI.savePayments(refreshedPayments);
  };

  // CATEGORIES CALLBACKS
  const handleAddCategory = async (newCat: Omit<EventCategory, 'id'>) => {
    const freshCat: EventCategory = {
      ...newCat,
      id: `cat-${Date.now()}`
    };
    const updated = [...categories, freshCat];
    setCategories(updated);
    StorageAPI.saveCategories(updated);
  };

  const handleDeleteCategory = async (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    StorageAPI.saveCategories(updated);
  };

  // CALENDAR EVENTS CALLBACKS
  const handleAddEvent = async (newEvent: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const freshEvent: CalendarEvent = {
      ...newEvent,
      id: `evt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [freshEvent, ...events];
    setEvents(updated);
    StorageAPI.saveEvents(updated);
  };

  const handleUpdateEvent = async (id: string, updatedFields: Partial<CalendarEvent>) => {
    const target = events.find(item => item.id === id);
    if (!target) return;
    const updatedUserEvent = { ...target, ...updatedFields };
    const updated = events.map(item => {
      if (item.id === id) {
        return updatedUserEvent;
      }
      return item;
    });
    setEvents(updated);
    StorageAPI.saveEvents(updated);
  };

  const handleDeleteEvent = async (id: string) => {
    const updated = events.filter(item => item.id !== id);
    setEvents(updated);
    StorageAPI.saveEvents(updated);
  };

  // NOTES CALLBACKS
  const handleAddNote = async (newNote: Omit<QuickNote, 'id'>) => {
    const freshNote: QuickNote = {
      ...newNote,
      id: `note-${Date.now()}`
    };
    const updated = [freshNote, ...notes];
    setNotes(updated);
    StorageAPI.saveNotes(updated);
  };

  const handleUpdateNote = async (id: string, updatedFields: Partial<QuickNote>) => {
    const target = notes.find(item => item.id === id);
    if (!target) return;
    const updatedUserNote = { ...target, ...updatedFields };
    const updated = notes.map(item => {
      if (item.id === id) {
        return updatedUserNote;
      }
      return item;
    });
    setNotes(updated);
    StorageAPI.saveNotes(updated);
  };

  const handleDeleteNote = async (id: string) => {
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
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-black uppercase shrink-0">
                  {getGreetingName().substring(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-white truncate leading-none">
                    {user?.displayName || 'Zachary Martel'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">
                    Compte connecté
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                {syncStatus === 'syncing' && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <RefreshCw size={12} className="animate-spin text-blue-500 shrink-0" />
                    <span className="text-[10px] font-bold tracking-tight">Synchronisation...</span>
                  </div>
                )}
                {syncStatus === 'synced' && (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Cloud size={12} className="stroke-[2.5] text-emerald-500 shrink-0" />
                    <span className="text-[10px] font-bold tracking-tight">Data Center connecté</span>
                  </div>
                )}
                {syncStatus === 'error' && (
                  <div className="flex items-center gap-2 text-rose-400">
                    <Cloud size={12} className="stroke-[2.5] text-rose-500 shrink-0" />
                    <span className="text-[10px] font-bold tracking-tight">Mode hors-ligne</span>
                  </div>
                )}
                <p className="text-[9.5px] text-slate-400 leading-snug font-medium mt-1.5">
                  {syncStatus === 'synced' && 'Toutes les entrées sont automatiquement enregistrées sur votre serveur privé.'}
                  {syncStatus === 'syncing' && 'Sauvegarde des nouvelles modifications sur le serveur local...'}
                  {syncStatus === 'error' && 'Une erreur s\'est produite. Vos données restent conservées dans ce navigateur.'}
                </p>
              </div>

              {syncStatus === 'error' && (
                <button
                  onClick={async () => {
                    setSyncStatus('syncing');
                    try {
                      const dataToSave = { production, payments, categories, events, notes, settings };
                      await CustomServerSync.save('zachary_martel_datacenter', dataToSave);
                      setSyncStatus('synced');
                    } catch (e) {
                      setSyncStatus('error');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-950/40 hover:bg-blue-900/40 text-blue-400 border border-blue-900/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all select-none cursor-pointer"
                >
                  <RefreshCw size={10} />
                  <span>Réessayer la connexion</span>
                </button>
              )}
            </div>
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
                          <Cloud size={8} /> {user.isCustom ? 'Serveur Lambert Actif' : 'Données synchronisées'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await handleLogOut();
                        setMobileMenuOpen(false);
                      }}
                      className="p-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-black uppercase rounded-lg border border-red-100 cursor-pointer transition whitespace-nowrap"
                    >
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 px-3">
                    <p className="text-[9px] text-slate-400 font-bold">Connectez-vous à votre compte Lambert sans Firebase pour conserver vos données :</p>

                    <EmailAuthForm onUserLoggedIn={(u) => { handleCustomUserLoggedIn(u); setMobileMenuOpen(false); }} onSuccess={() => setMobileMenuOpen(false)} isDarkBg={false} />
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

        {/* Dynamic Notifications Alerts UI Overlay */}
        <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-xs sm:max-w-sm w-full pointer-events-none pr-2">
          <AnimatePresence>
            {reminderNotifications.map(notif => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="pointer-events-auto bg-slate-900 border-l-4 border-amber-500 rounded-xl p-4 shadow-2xl flex items-start gap-3 transition-shadow"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
                  <Bell className="animate-swing" size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-black tracking-tight text-white uppercase">{notif.eventTitle}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setReminderNotifications(prev => prev.filter(n => n.id !== notif.id));
                      }}
                      className="text-slate-400 hover:text-white transition p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-[10px] font-bold text-amber-400 mt-0.5 uppercase tracking-wide">💡 Rappel : {notif.timeLabel}</p>
                  <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans mt-2">{notif.message}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
