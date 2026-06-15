/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../firebase';
import { Mail, Lock, UserPlus, KeyRound, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface EmailAuthFormProps {
  onSuccess?: () => void;
  isDarkBg?: boolean;
}

export default function EmailAuthForm({ onSuccess, isDarkBg = false }: EmailAuthFormProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorLocal('Veuillez remplir tous les champs requis.');
      return;
    }

    if (password.length < 6) {
      setErrorLocal('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await signUpWithEmail(email, password, name.trim() || undefined);
        setSuccessMsg('Compte créé avec succès ! Connecté.');
      } else {
        await signInWithEmail(email, password);
        setSuccessMsg('Connexion réussie !');
      }
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let localizedError = "Échec de l'authentification.";
      if (err.code === 'auth/email-already-in-use') {
        localizedError = 'Cette adresse courriel est déjà utilisée.';
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'Adresse courriel invalide.';
      } else if (err.code === 'auth/weak-password') {
        localizedError = 'Le mot de passe est trop faible.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        localizedError = 'Identifiants invalides (courriel ou mot de passe incorrect).';
      } else if (err.message && err.message.includes('CONFIGURATION_NOT_FOUND')) {
        localizedError = "Le service de connexion Email/Mot de passe n'est pas encore activé dans votre console Firebase. Veuillez l'activer pour continuer.";
      } else {
        localizedError = err.message || localizedError;
      }
      setErrorLocal(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const textClass = isDarkBg ? 'text-slate-200' : 'text-slate-800';
  const labelClass = isDarkBg ? 'text-slate-400' : 'text-slate-500';
  const inputBgClass = isDarkBg ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400';
  const toggleLinkClass = isDarkBg ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500';

  return (
    <div className={`p-4 rounded-2xl border ${isDarkBg ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-100'} shadow-sm space-y-3`} id="email-auth-form-root">
      <div className="flex items-center justify-between border-b pb-2 mb-2 border-slate-100/10">
        <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${textClass}`}>
          {isRegister ? <UserPlus size={13} className="text-blue-500" /> : <KeyRound size={13} className="text-blue-500" />}
          {isRegister ? "Créer un compte" : "Connexion Email"}
        </h4>
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setErrorLocal(null);
            setSuccessMsg(null);
          }}
          className={`text-[10px] font-bold ${toggleLinkClass} transition`}
        >
          {isRegister ? "Plutôt se connecter ?" : "S'inscrire ?"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {isRegister && (
          <div className="space-y-1">
            <label className={`text-[9px] uppercase font-black tracking-wider ${labelClass}`}>
              Nom d'utilisateur
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Zachary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className={`w-full text-[11px] px-3 py-2.5 rounded-xl border focus:outline-none focus:border-blue-500 transition-all ${inputBgClass}`}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className={`text-[9px] uppercase font-black tracking-wider ${labelClass}`}>
            Adresse Courriel
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none">
              <Mail size={11} className="text-slate-400" />
            </span>
            <input
              type="email"
              placeholder="votre_courriel@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`w-full text-[11px] pl-8 pr-3 py-2.5 rounded-xl border focus:outline-none focus:border-blue-500 transition-all ${inputBgClass}`}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={`text-[9px] uppercase font-black tracking-wider ${labelClass}`}>
            Mot de passe
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none">
              <Lock size={11} className="text-slate-400" />
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={`w-full text-[11px] pl-8 pr-3 py-2.5 rounded-xl border focus:outline-none focus:border-blue-500 transition-all ${inputBgClass}`}
              required
            />
          </div>
        </div>

        {errorLocal && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-2 rounded-lg flex items-start gap-1.5 leading-relaxed font-bold">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{errorLocal}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] p-2 rounded-lg flex items-start gap-1.5 leading-relaxed font-semibold">
            <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer"
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {isRegister ? <Sparkles size={11} /> : <Mail size={11} />}
              <span>{isRegister ? "Créer mon compte" : "Se connecter"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
