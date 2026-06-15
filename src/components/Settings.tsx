/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Sun, Moon, IceCream, DollarSign, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  user: any;
}

export default function SettingsView({ settings, onUpdateSettings, user }: SettingsViewProps) {
  const [pocketPriceInput, setPocketPriceInput] = useState<string>('');
  const [bagPriceInput, setBagPriceInput] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Keep internal state in sync with updated props
  useEffect(() => {
    setPocketPriceInput(settings.pocketPrice.toFixed(2));
    setBagPriceInput(settings.bagPrice.toFixed(2));
  }, [settings.pocketPrice, settings.bagPrice]);

  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setFeedback(null);

    const pocketPriceNum = parseFloat(pocketPriceInput);
    const bagPriceNum = parseFloat(bagPriceInput);

    if (isNaN(pocketPriceNum) || pocketPriceNum < 0) {
      setErrorLocal('Le prix des poches 12kg doit être un nombre positif valide.');
      return;
    }

    if (isNaN(bagPriceNum) || bagPriceNum < 0) {
      setErrorLocal('Le prix des sacs 2.7kg doit être un nombre positif valide.');
      return;
    }

    try {
      await onUpdateSettings({
        pocketPrice: pocketPriceNum,
        bagPrice: bagPriceNum
      });
      setFeedback('Les tarifs ont été mis à jour avec succès.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      setErrorLocal('Erreur lors de la sauvegarde des tarifs.');
    }
  };

  const handleToggleDarkMode = async () => {
    try {
      await onUpdateSettings({
        darkMode: !settings.darkMode
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" id="settings-view-root">
      
      {/* Intro descriptive Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="text-blue-500 animate-spin-slow animate-[spin_8s_linear_infinite]" size={22} />
            Réglages de l'application
          </h3>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Configurez ici vos préférences visuelles ainsi que la valeur monétaire unitaire de chaque type de contenant produit. Ces tarifs sont automatiquement répercutés sur vos calculs de salaire hebdomadaires, mensuels et globaux.
          </p>
        </div>
        
        {user && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider">Data Center Activé</p>
              <p className="text-[10px] font-medium text-emerald-600/90">Vos réglages sont enregistrés automatiquement sur le serveur local.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Theme Settings Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between" id="theme-settings-card">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Apparence visuelle</h4>
                <p className="text-[11px] text-slate-400 font-bold">Basculez entre le thème clair et le thème sombre</p>
              </div>
            </div>

            <div className="py-4">
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Le mode sombre réduit la fatigue oculaire, idéal pour une saisie en soirée directement dans les frigos ou en fin de quart de production.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 mt-auto flex items-center justify-between">
            <span className="text-xs font-black text-slate-700">Mode sombre actif</span>
            
            <button
              onClick={handleToggleDarkMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.darkMode ? 'bg-blue-600' : 'bg-slate-200'
              }`}
              id="theme-toggle-switch"
              type="button"
              aria-label="Toggle Dark Mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pricing settings Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm" id="prices-settings-card">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <DollarSign size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Tarifs de fabrication</h4>
              <p className="text-[11px] text-slate-400 font-bold">Modifiez le montant de gain unitaire pour la paie</p>
            </div>
          </div>

          <form onSubmit={handleSavePrices} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Poche 12kg ($ par unité)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pocketPriceInput}
                    onChange={(e) => setPocketPriceInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 focus:outline-none focus:border-blue-500 rounded-xl text-xs font-black text-slate-800"
                    placeholder="0.40"
                    id="input-pocket-price"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Sac 2,7kg ($ par unité)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bagPriceInput}
                    onChange={(e) => setBagPriceInput(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 focus:outline-none focus:border-blue-500 rounded-xl text-xs font-black text-slate-800"
                    placeholder="0.30"
                    id="input-bag-price"
                  />
                </div>
              </div>
            </div>

            {errorLocal && (
              <p className="text-[10px] text-red-500 font-bold" id="settings-save-error-text">
                ⚠️ {errorLocal}
              </p>
            )}

            {feedback && (
              <p className="text-[10px] text-emerald-600 font-black flex items-center gap-1" id="settings-save-success-text">
                <CheckCircle2 size={13} className="stroke-[2.5]" />
                {feedback}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer text-center"
                id="btn-save-tarifs"
              >
                Enregistrer les nouveaux tarifs
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Visual illustration of the calculations */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mt-2">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Aperçu de la formule de paiement</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Formule</div>
            <p className="text-xs font-black text-slate-700 mt-1">
              (A × {settings.pocketPrice.toFixed(2)}$) + (B × {settings.bagPrice.toFixed(2)}$)
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">
              Où <span className="font-bold text-blue-500">A</span> correspond aux poches 12kg et <span className="font-bold text-emerald-500">B</span> aux sacs de 2,7kg.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Poche 12kg</div>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Valeur actuelle : <span className="font-black text-slate-900">{settings.pocketPrice.toFixed(2)}$</span>
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">
              Calcul de l'équivalent de 500 unités produites : <span className="font-mono font-bold">{(500 * settings.pocketPrice).toFixed(2)}$</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Sac 2,7kg</div>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Valeur actuelle : <span className="font-black text-slate-900">{settings.bagPrice.toFixed(2)}$</span>
            </p>
            <p className="text-[9px] text-slate-400 mt-1 font-semibold">
              Calcul de l'équivalent de 1000 unités produites : <span className="font-mono font-bold">{(1000 * settings.bagPrice).toFixed(2)}$</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
