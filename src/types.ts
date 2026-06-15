/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  pockets12kg: number; // 0.40$ per unit
  bags27kg: number; // 0.30$ per unit
  status: 'Non payé' | 'Payé';
  payId?: string | null;
  createdAt: string;
}

export interface PayPayment {
  id: string;
  datePaye: string;
  amountTotal: number;
  includedEntries: string[]; // List of ProductionEntry IDs
  notes?: string;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string; // Tailwind class name or color code
  icon: string; // Lucide icon key name
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string;
  duration: string; // e.g. "2h", "30m"
  category: string; // Category name or ID
  reminder: boolean;
  createdAt: string;
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD or date string
  categoryId?: string | null;
}
