/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CustomUser {
  uid: string;
  username: string;
  email: string;
  displayName: string;
}

export interface CustomDataSet {
  production: any[];
  payments: any[];
  categories: any[];
  events: any[];
  notes: any[];
  settings: any;
}

const getApiUrl = (path: string): string => {
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? window.location.origin
    : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

export const CustomServerSync = {
  /**
   * Log in via custom server.
   */
  login: async (usernameOrEmail: string, pass: string): Promise<CustomUser> => {
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password: pass })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la connexion.');
    }
    return res.json();
  },

  /**
   * Register a new user via custom server.
   */
  register: async (username: string, pass: string, email?: string, displayName?: string): Promise<CustomUser> => {
    const res = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass, email, displayName })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur lors de l'inscription.");
    }
    return res.json();
  },

  /**
   * Load data from custom server.
   */
  load: async (userId: string): Promise<CustomDataSet> => {
    const res = await fetch(getApiUrl(`/api/data/load/${userId}`));
    if (!res.ok) {
      throw new Error('Impossible de charger les données du serveur.');
    }
    return res.json();
  },

  /**
   * Save data to custom server.
   */
  save: async (userId: string, data: CustomDataSet): Promise<{ success: boolean; updated: string }> => {
    const res = await fetch(getApiUrl(`/api/data/save/${userId}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error('Impossible de sauvegarder vos données sur le serveur.');
    }
    return res.json();
  }
};

