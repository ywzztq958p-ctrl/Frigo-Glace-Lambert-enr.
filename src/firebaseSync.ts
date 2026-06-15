/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  ProductionEntry, 
  PayPayment, 
  EventCategory, 
  CalendarEvent, 
  QuickNote,
  AppSettings
} from './types';

// Generic write helper that catches firestore error
async function saveFirestoreDocument(collectionPath: string, docId: string, data: any) {
  try {
    const docRef = doc(db, collectionPath, docId);
    await setDoc(docRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionPath}/${docId}`);
  }
}

// Generic delete helper
async function deleteFirestoreDocument(collectionPath: string, docId: string) {
  try {
    const docRef = doc(db, collectionPath, docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionPath}/${docId}`);
  }
}

export const FirebaseSync = {
  // Subscribe to Production
  subscribeProduction: (userId: string, callback: (entries: ProductionEntry[]) => void, onError?: (err: Error) => void) => {
    const path = 'production';
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const list: ProductionEntry[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as ProductionEntry);
      });
      // Sort: date desc, time desc
      const sorted = list.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        const tA = a.time || '00:00';
        const tB = b.time || '00:00';
        return tB.localeCompare(tA);
      });
      callback(sorted);
    }, (error) => {
      if (onError) onError(error as Error);
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  // Save/Update Production
  saveProductionEntry: async (userId: string, entry: ProductionEntry) => {
    await saveFirestoreDocument('production', entry.id, {
      ...entry,
      userId
    });
  },

  // Delete Production
  deleteProductionEntry: async (entryId: string) => {
    await deleteFirestoreDocument('production', entryId);
  },

  // Subscribe to Payments
  subscribePayments: (userId: string, callback: (payments: PayPayment[]) => void) => {
    const path = 'payments';
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const list: PayPayment[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as PayPayment);
      });
      callback(list.sort((a, b) => b.datePaye.localeCompare(a.datePaye)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  // Save/Update Payment
  savePayment: async (userId: string, payment: PayPayment) => {
    await saveFirestoreDocument('payments', payment.id, {
      ...payment,
      userId
    });
  },

  // Delete Payment
  deletePayment: async (paymentId: string) => {
    await deleteFirestoreDocument('payments', paymentId);
  },

  // Subscribe to Categories
  subscribeCategories: (userId: string, callback: (categories: EventCategory[]) => void) => {
    const path = 'categories';
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const list: EventCategory[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as EventCategory);
      });
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  // Save/Update Category
  saveCategory: async (userId: string, category: EventCategory) => {
    await saveFirestoreDocument('categories', category.id, {
      ...category,
      userId
    });
  },

  // Delete Category
  deleteCategory: async (categoryId: string) => {
    await deleteFirestoreDocument('categories', categoryId);
  },

  // Subscribe to Events
  subscribeEvents: (userId: string, callback: (events: CalendarEvent[]) => void) => {
    const path = 'events';
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const list: CalendarEvent[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as CalendarEvent);
      });
      callback(list.sort((a, b) => b.date.localeCompare(a.date)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  // Save/Update Event
  saveEvent: async (userId: string, event: CalendarEvent) => {
    await saveFirestoreDocument('events', event.id, {
      ...event,
      userId
    });
  },

  // Delete Event
  deleteEvent: async (eventId: string) => {
    await deleteFirestoreDocument('events', eventId);
  },

  // Subscribe to Notes
  subscribeNotes: (userId: string, callback: (notes: QuickNote[]) => void) => {
    const path = 'notes';
    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const list: QuickNote[] = [];
      snapshot.forEach(d => {
        list.push(d.data() as QuickNote);
      });
      callback(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  },

  // Save/Update Note
  saveNote: async (userId: string, note: QuickNote) => {
    await saveFirestoreDocument('notes', note.id, {
      ...note,
      userId
    });
  },

  // Delete Note
  deleteNote: async (noteId: string) => {
    await deleteFirestoreDocument('notes', noteId);
  },

  // Subscribe to Settings
  subscribeSettings: (userId: string, callback: (settings: AppSettings | null) => void) => {
    const path = 'settings';
    const docRef = doc(db, path, userId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as AppSettings);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${path}/${userId}`);
    });
  },

  // Save/Update Settings
  saveSettings: async (userId: string, settings: Omit<AppSettings, 'userId' | 'id'>) => {
    await saveFirestoreDocument('settings', userId, {
      id: userId,
      userId,
      ...settings
    });
  },

  // Synchronize entire local storage dataset to Firestore during first login
  syncLocalStorageToCloud: async (userId: string, localData: {
    production: ProductionEntry[];
    payments: PayPayment[];
    categories: EventCategory[];
    events: CalendarEvent[];
    notes: QuickNote[];
  }) => {
    const collectionsToSync = [
      { name: 'production', items: localData.production },
      { name: 'payments', items: localData.payments },
      { name: 'categories', items: localData.categories },
      { name: 'events', items: localData.events },
      { name: 'notes', items: localData.notes }
    ];

    try {
      for (const col of collectionsToSync) {
        if (col.items.length === 0) continue;

        // Fetch existing remote documents first of this category to avoid re-writing everything if already in sync
        const q = query(collection(db, col.name), where('userId', '==', userId));
        const remoteSnap = await getDocs(q);
        const remoteIds = new Set(remoteSnap.docs.map(doc => doc.id));

        const batch = writeBatch(db);
        let count = 0;

        for (const item of col.items) {
          if (!remoteIds.has(item.id)) {
            const docRef = doc(db, col.name, item.id);
            batch.set(docRef, {
              ...item,
              userId
            });
            count++;
          }
        }

        if (count > 0) {
          await batch.commit();
          console.log(`Synchronisation de ${count} éléments locaux vers la collection "${col.name}" réussie.`);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la synchronisation locale vers le cloud:", err);
      // Fail gracefully without crashing the main thread
    }
  }
};
