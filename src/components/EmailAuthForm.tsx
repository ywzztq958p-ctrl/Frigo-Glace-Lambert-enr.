/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CustomServerSync, CustomUser } from '../customServerSync';
import { Mail, Lock, UserPlus, KeyRound, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface EmailAuthFormProps {
  onSuccess?: () => void;
  onUserLoggedIn: (user: CustomUser) => void;
  isDarkBg?: boolean;
}

export default function EmailAuthForm({ onSuccess, onUserLoggedIn, isDarkBg = false }: EmailAuthFormProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setErrorLocal('Le nom d\'utilisateur et le mot de passe sont requis.');
      return;
    }

    if (password.length < 6) {
      setErrorLocal('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const u = await CustomServerSync.register(
          cleanUsername,
          password,
          email.trim() || undefined,
          displayName.trim() || undefined
        );
        setSuccessMsg('Compte créé avec succès ! Session active.');
        setTimeout(() => {
          onUserLoggedIn(u);
          if (onSuccess) onSuccess();
        }, 1000);
      } else {
        const u = await CustomServerSync.login(cleanUsername, password);
        setSuccessMsg('Connexion réussie !');
        setTimeout(() => {
          onUserLoggedIn(u);
          if (onSuccess) onSuccess();
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorLocal(err.message || "Échec de l'authentification.");
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
          {isRegister ? "Créer un compte" : "Connexion Lambert"}
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
          {isRegister ? "Plutôt se connecter ?" : "Nouveau ? S'inscrire"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="space-y-1">
          <label className={`text-[9px] uppercase font-black tracking-wider ${labelClass}`}>
            Identifiant / Nom d'utilisateur
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450 pointer-events-none">
              <Mail size={11} className="text-slate-400" />
            </span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Ex: zachary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className={`w-full text-[11px] pl-8 pr-3 py-2.5 rounded-xl border focus:outline-none focus:border-blue-500 transition-all ${inputBgClass}`}
              required
            />
          </div>
        </div>

        {isRegister && (
          <>
            <div className="space-y-1">
              <label className={`text-[9px] uppercase font-black tracking-wider ${labelClass}`}>
                Nom complet d'affichage (Optionnel)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullname"
                  autoComplete="name"
                  placeholder="Ex: Zachary Martel"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  className={`w-full text-[11px] px-3 py-2.5 rounded-xl border focus:outline-none focus:border-blue-500 transition-all ${inputBgClass}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[9px] uppercase font-black tracking-wider ${labelClass}`}>
                Adresse Courriel (Optionnelle)
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Ex: info@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className={`w-full text-[11px] px-3 py-2.5 rounded-xl border focus:outline-none focus:border-blue-500 transition-all ${inputBgClass}`}
                />
              </div>
            </div>
          </>
        )}

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
              name="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
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
