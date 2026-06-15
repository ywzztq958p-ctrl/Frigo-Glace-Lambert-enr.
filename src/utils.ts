/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProductionEntry, PayPayment, EventCategory, CalendarEvent, QuickNote } from './types';

export const POCKET_PRICE = 0.40; // 12kg pocket = 0,40 $
export const BAG_PRICE = 0.30;   // 2.7kg bag = 0,30 $

// Helper: Calculate week number (e.g. 2026-W24)
export function getWeekString(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Semaine active';
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

// Helper: Get month name / string (e.g. "Juin 2026")
export function getMonthString(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'Mois actif';
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Format currency
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
}

// INITIAL SEED DATA
const defaultCategories: EventCategory[] = [
  { id: 'cat-1', name: 'Production Glace', color: 'blue', icon: 'IceCream' },
  { id: 'cat-2', name: 'Livraison', color: 'emerald', icon: 'Truck' },
  { id: 'cat-3', name: 'Entretien Équipement', color: 'amber', icon: 'Wrench' },
  { id: 'cat-4', name: 'Rendez-vous', color: 'violet', icon: 'CalendarDays' },
];

const defaultProduction: ProductionEntry[] = [
  {
    id: 'prod-1',
    date: '2026-06-08',
    pockets12kg: 180,
    bags27kg: 240,
    status: 'Payé',
    payId: 'pay-1',
    createdAt: '2026-06-08T16:00:00.000Z'
  },
  {
    id: 'prod-2',
    date: '2026-06-09',
    pockets12kg: 220,
    bags27kg: 310,
    status: 'Payé',
    payId: 'pay-1',
    createdAt: '2026-06-09T17:15:00.000Z'
  },
  {
    id: 'prod-3',
    date: '2026-06-10',
    pockets12kg: 150,
    bags27kg: 200,
    status: 'Payé',
    payId: 'pay-1',
    createdAt: '2026-06-10T15:30:00.000Z'
  },
  {
    id: 'prod-4',
    date: '2026-06-11',
    pockets12kg: 250,
    bags27kg: 320,
    status: 'Non payé',
    payId: null,
    createdAt: '2026-06-11T16:45:00.000Z'
  },
  {
    id: 'prod-5',
    date: '2026-06-12',
    pockets12kg: 310,
    bags27kg: 400,
    status: 'Non payé',
    payId: null,
    createdAt: '2026-06-12T18:00:00.000Z'
  },
  {
    id: 'prod-6',
    date: '2026-06-13',
    pockets12kg: 140,
    bags27kg: 190,
    status: 'Non payé',
    payId: null,
    createdAt: '2026-06-13T14:20:00.000Z'
  },
  {
    id: 'prod-7',
    date: '2026-06-14',
    pockets12kg: 200,
    bags27kg: 250,
    status: 'Non payé',
    payId: null,
    createdAt: '2026-06-14T15:30:00.000Z'
  }
];

const defaultPayments: PayPayment[] = [
  {
    id: 'pay-1',
    datePaye: '2026-06-10',
    amountTotal: 341.00, // (180*0.4 + 240*0.3) + (220*0.4 + 310*0.3) + (150*0.4 + 200*0.3)
    includedEntries: ['prod-1', 'prod-2', 'prod-3'],
    notes: 'Paye remise en espèces'
  }
];

const defaultEvents: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Quart de production matin ❄️',
    description: 'Production intensive pour la commande du week-end',
    date: '2026-06-14',
    time: '07:00',
    duration: '8h',
    category: 'cat-1',
    reminder: true,
    createdAt: '2026-06-13T12:00:00.000Z'
  },
  {
    id: 'evt-2',
    title: 'Maintenance congélateur C',
    description: 'Dégivrage et vérification des scellés de porte',
    date: '2026-06-15',
    time: '14:00',
    duration: '2h',
    category: 'cat-3',
    reminder: false,
    createdAt: '2026-06-14T10:00:00.000Z'
  }
];

const defaultNotes: QuickNote[] = [
  {
    id: 'note-1',
    title: 'Règles Frigo Lambert',
    content: 'Toujours s\'assurer de remplir les fiches de température le matin. Porter les gants isolants lors de la manipulation des blocs massifs.',
    date: '2026-06-12',
    categoryId: 'cat-1'
  },
  {
    id: 'note-2',
    title: 'Idée de rangement',
    content: 'Placer les poches de 12kg sur les palettes du fond et garder les sacs de 2,7kg près de la porte de chargement rapide.',
    date: '2026-06-14',
    categoryId: 'cat-1'
  }
];

// DATA ACCESS STORAGE API
export const StorageAPI = {
  getProduction: (): ProductionEntry[] => {
    const raw = localStorage.getItem('lambert_production');
    if (!raw) {
      localStorage.setItem('lambert_production', JSON.stringify(defaultProduction));
      return defaultProduction;
    }
    return JSON.parse(raw);
  },
  saveProduction: (entries: ProductionEntry[]): void => {
    localStorage.setItem('lambert_production', JSON.stringify(entries));
  },

  getPayments: (): PayPayment[] => {
    const raw = localStorage.getItem('lambert_payments');
    if (!raw) {
      localStorage.setItem('lambert_payments', JSON.stringify(defaultPayments));
      return defaultPayments;
    }
    return JSON.parse(raw);
  },
  savePayments: (payments: PayPayment[]): void => {
    localStorage.setItem('lambert_payments', JSON.stringify(payments));
  },

  getCategories: (): EventCategory[] => {
    const raw = localStorage.getItem('lambert_categories');
    if (!raw) {
      localStorage.setItem('lambert_categories', JSON.stringify(defaultCategories));
      return defaultCategories;
    }
    return JSON.parse(raw);
  },
  saveCategories: (categories: EventCategory[]): void => {
    localStorage.setItem('lambert_categories', JSON.stringify(categories));
  },

  getEvents: (): CalendarEvent[] => {
    const raw = localStorage.getItem('lambert_events');
    if (!raw) {
      localStorage.setItem('lambert_events', JSON.stringify(defaultEvents));
      return defaultEvents;
    }
    return JSON.parse(raw);
  },
  saveEvents: (events: CalendarEvent[]): void => {
    localStorage.setItem('lambert_events', JSON.stringify(events));
  },

  getNotes: (): QuickNote[] => {
    const raw = localStorage.getItem('lambert_notes');
    if (!raw) {
      localStorage.setItem('lambert_notes', JSON.stringify(defaultNotes));
      return defaultNotes;
    }
    return JSON.parse(raw);
  },
  saveNotes: (notes: QuickNote[]): void => {
    localStorage.setItem('lambert_notes', JSON.stringify(notes));
  }
};
