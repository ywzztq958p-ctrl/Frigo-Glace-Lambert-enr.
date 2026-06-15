/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wallet as WalletIcon, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  FileDown, 
  Info,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Clock,
  IceCream,
  Activity,
  User,
  PlusCircle,
  X,
  Mail,
  Cloud,
  LogOut,
  Loader
} from 'lucide-react';
import { ProductionEntry, PayPayment } from '../types';
import { formatCurrency } from '../utils';
// @ts-ignore
import frigoLogo from '../assets/images/frigo_glace_logo.jpg';
import { 
  connectGoogleServices, 
  getCachedToken, 
  disconnectGoogleServices, 
  getGoogleUser, 
  uploadPdfToDrive, 
  sendPdfByGmail 
} from '../googleWorkspace';

/**
 * Robustly replaces oklch(...) and oklab(...) color functions (even with nested parens like var())
 * with simple fallback hex color strings, preventing html2canvas parser crashes.
 */
function replaceUnsupportedColors(text: string): string {
  let result = '';
  let i = 0;
  const lowerText = text.toLowerCase();
  while (i < text.length) {
    if (lowerText.startsWith('oklch(', i) || lowerText.startsWith('oklab(', i)) {
      const isOklch = lowerText.startsWith('oklch(', i);
      const startOfName = i;
      i += isOklch ? 6 : 6; // length of 'oklch(' or 'oklab('
      let parenCount = 1;
      let contentStart = i;
      while (i < text.length && parenCount > 0) {
        if (text[i] === '(') parenCount++;
        else if (text[i] === ')') parenCount--;
        i++;
      }
      const matchContent = text.substring(contentStart, i - 1);
      
      // Determine L (lightness) to select appropriate fallback slate colors
      let L = 0.5;
      const firstNumMatch = matchContent.match(/[\d.]+/);
      if (firstNumMatch) {
        L = parseFloat(firstNumMatch[0]);
      }
      
      let fallbackHex = '#475569'; // default slate-600
      if (L > 0.9) fallbackHex = '#f8fafc'; // slate-50
      else if (L > 0.8) fallbackHex = '#cbd5e1'; // slate-300
      else if (L > 0.6) fallbackHex = '#94a3b8'; // slate-400
      else if (L > 0.4) fallbackHex = '#475569'; // slate-600
      else if (L > 0.2) fallbackHex = '#1e293b'; // slate-800
      else if (L >= 0) fallbackHex = '#0f172a'; // slate-900

      result += fallbackHex;
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}

const glidePdfTemplateCode = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Frigo-Glace Lambert enr. - Résumé de paye</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
        }
        
        .pdf-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
            background: #ffffff;
            padding: 40px;
            box-sizing: border-box;
            min-height: 297mm;
        }
        
        .header-banner {
            background-color: #4DA6FF;
            width: 100%;
            height: 120px;
            border-radius: 12px;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #ffffff;
            box-sizing: border-box;
            margin-bottom: 30px;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .logo-img {
            height: 75px;
            width: auto;
            object-fit: contain;
            border-radius: 8px;
        }
        
        .header-title-block h1 {
            margin: 0;
            font-size: 19px;
            font-weight: 900;
            letter-spacing: -0.5px;
            text-transform: uppercase;
        }
        
        .header-title-block p {
            margin: 4px 0 0 0;
            font-size: 13px;
            font-weight: 600;
            opacity: 0.95;
        }
        
        .header-right {
            text-align: right;
        }
        
        .header-right p {
            margin: 3px 0;
            font-size: 11px;
            font-weight: 500;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.12;
            width: 60%;
            pointer-events: none;
            z-index: 0;
        }
        
        .content-section {
            position: relative;
            z-index: 10;
            margin-bottom: 28px;
        }
        
        .section-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0d172a;
            border-bottom: 2.5px solid #e2e8f0;
            padding-bottom: 5px;
            margin-top: 0;
            margin-bottom: 14px;
        }
        
        .entries-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            font-size: 12.5px;
            margin-bottom: 20px;
        }
        
        .entries-table th {
            background-color: #4DA6FF;
            color: #ffffff;
            font-weight: 750;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
            padding: 11px 14px;
            text-align: left;
        }
        
        .entries-table td {
            padding: 11px 14px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
        }
        
        .entries-table tr:last-child td {
            border-bottom: none;
        }
        
        .entries-table tr:nth-child(even) {
            background-color: #F5F5F5;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .totals-grid {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            margin-bottom: 20px;
        }
        
        .calculations-box {
            flex: 1;
            background-color: #F5F5F5;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            box-sizing: border-box;
        }
        
        .calc-row {
            display: flex;
            justify-content: space-between;
            font-size: 12.5px;
            color: #475569;
            margin-bottom: 8px;
        }
        
        .calc-row.total-row {
            margin-top: 12px;
            border-top: 2px solid #e2e8f0;
            padding-top: 10px;
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
        }
        
        .qr-box {
            width: 180px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
        }
        
        .qr-code-img {
            width: 110px;
            height: 110px;
            object-fit: contain;
            margin-bottom: 8px;
        }
        
        .qr-text {
            font-size: 7.5px;
            color: #94a3b8;
            font-family: monospace;
            text-align: center;
            word-break: break-all;
        }
        
        .signatures-grid {
            display: flex;
            gap: 24px;
            margin-top: 20px;
        }
        
        .signature-card {
            flex: 1;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            box-sizing: border-box;
            background: #ffffff;
        }
        
        .sig-header {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #f1f5f9;
            padding-bottom: 4px;
            margin-bottom: 12px;
        }
        
        .sig-content {
            height: 55px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Georgia', serif;
            font-style: italic;
            font-size: 16px;
            color: #1e293b;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            background-color: #fafafa;
        }
        
        .notes-text {
            font-size: 11.5px;
            line-height: 1.6;
            color: #64748b;
            background-color: #fafafa;
            border: 1.5px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="pdf-container">
        <!-- Logo en filigrane centré très pâle -->
        <img class="watermark" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600" alt="Watermark" />

        <!-- Bandeau supérieur bleu glace -->
        <header class="header-banner">
            <div class="header-left">
                <img class="logo-img" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600" style="filter: brightness(0) invert(1);" alt="Logo" />
                <div class="header-title-block">
                    <h1>Frigo‑Glace Lambert enr.</h1>
                    <p>Résumé de paye – Employé : Zachary</p>
                </div>
            </div>
            <div class="header-right">
                <p>Période : {{Date_Debut}} → {{Date_Fin}}</p>
                <p>Émis le : {{Date_Paye}}</p>
            </div>
        </header>

        <!-- Section 1 : Détails de la production -->
        <section class="content-section">
            <h2 class="section-title">1. Détails de la production</h2>
            <table class="entries-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th class="text-center">Poches (12 kg)</th>
                        <th class="text-center">Sacs (2,7 kg)</th>
                        <th class="text-right">Total du jour</th>
                    </tr>
                </thead>
                <tbody>
                    {{Liste_Jours}}
                </tbody>
            </table>
        </section>

        <!-- Section 2 & 3 : Totaux & Validation -->
        <section class="content-section">
            <div class="totals-grid">
                <!-- Totaux de la période -->
                <div class="calculations-box">
                    <h2 class="section-title" style="border-bottom:none; margin-bottom:8px; font-size:12px; padding:0;">2. Totaux de la période</h2>
                    <div class="calc-row">
                        <span>Total poches : <strong>{{Total_Poches}}</strong> × 0,40 $</span>
                        <span>{{Montant_Poches}} $</span>
                    </div>
                    <div class="calc-row" style="margin-bottom: 0;">
                        <span>Total sacs : <strong>{{Total_Sacs}}</strong> × 0,30 $</span>
                        <span>{{Montant_Sacs}} $</span>
                    </div>
                    <div class="calc-row total-row">
                        <span>Total général</span>
                        <span>{{Montant_Total}} $</span>
                    </div>
                </div>

                <!-- QR Code de vérification à droite -->
                <div class="qr-box">
                    <h3 class="section-title" style="border-bottom:none; margin-bottom:4px; font-size:10px; padding:0; text-align:center;">3. Vérification</h3>
                    <img class="qr-code-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Paye-Zachary-{{Date_Paye}}-{{Montant_Total}}" alt="QR Securite" />
                    <div class="qr-text">Paye-Zachary-{{Date_Paye}}-{{Montant_Total}}</div>
                </div>
            </div>
        </section>

        <!-- Section 4 : Signature numérique -->
        <section class="content-section">
            <h2 class="section-title">4. Signature numérique</h2>
            <div class="signatures-grid">
                <div class="signature-card">
                    <div class="sig-header">Employeur</div>
                    <div class="sig-content">
                        {{Signature_Employeur}}
                    </div>
                </div>
                <div class="signature-card">
                    <div class="sig-header">Employé</div>
                    <div class="sig-content">
                        {{Signature_Employe}}
                    </div>
                </div>
            </div>
        </section>

        <!-- Section 5 : Notes -->
        <section class="content-section" style="margin-bottom: 0;">
            <h2 class="section-title">5. Notes</h2>
            <div class="notes-text">
                {{Notes}}
            </div>
        </section>
    </div>
</body>
</html>`;

interface WalletProps {
  production: ProductionEntry[];
  payments: PayPayment[];
  onMarkAsPaid: (entryIds: string[], notes: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onNavigate?: (tab: string) => void;
  pocketPrice: number;
  bagPrice: number;
}

export default function Wallet({ 
  production, 
  payments, 
  onMarkAsPaid, 
  onDeletePayment,
  onNavigate,
  pocketPrice,
  bagPrice
}: WalletProps) {
  
  // Selection of entries to cash out
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [cashoutNotes, setCashoutNotes] = useState<string>('');
  
  // PDF Generator / Print states
  const [activePrintPayment, setActivePrintPayment] = useState<PayPayment | null>(null);
  const [customRangePrint, setCustomRangePrint] = useState<boolean>(false);
  const [printStartDate, setPrintStartDate] = useState<string>('');
  const [printEndDate, setPrintEndDate] = useState<string>('');
  const [copiedTemplate, setCopiedTemplate] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(glidePdfTemplateCode);
    setCopiedTemplate(true);
    setTimeout(() => {
      setCopiedTemplate(false);
    }, 2500);
  };
  
  // Feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  // Google Workspace integrations states
  const [googleConnected, setGoogleConnected] = useState<boolean>(!!getCachedToken());
  const [googleUser, setGoogleUser] = useState<any>(getGoogleUser());
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportActionLoading, setExportActionLoading] = useState<'none' | 'pdf' | 'drive' | 'gmail'>('none');
  const [exportStatus, setExportStatus] = useState<{ success?: boolean; error?: string | null }>({});
  
  // Gmail draft input
  const [recipientEmail, setRecipientEmail] = useState<string>('zacharymartel80@gmail.com');
  const [emailSubject, setEmailSubject] = useState<string>('Frigo-Glace Lambert enr. - Résumé de paye (Zachary)');
  const [emailBody, setEmailBody] = useState<string>(
    `Bonjour,\n\nVeuillez trouver ci-joint mon rapport de paye pour Frigo-Glace Lambert enr.\n\nMerci,\nZachary`
  );

  const handleGoogleConnect = async () => {
    try {
      const { user } = await connectGoogleServices();
      setGoogleConnected(true);
      setGoogleUser(user);
    } catch (err: any) {
      alert(`Erreur de connexion Google : ${err.message || err}`);
    }
  };

  const handleGoogleDisconnect = () => {
    disconnectGoogleServices();
    setGoogleConnected(false);
    setGoogleUser(null);
  };

  const generatePdfBlob = async (): Promise<{ blob: Blob; filename: string }> => {
    setIsGeneratingPdf(true);
    
    const loadHtml2Pdf = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          resolve((window as any).html2pdf);
        };
        script.onerror = (err) => {
          reject(err);
        };
        document.head.appendChild(script);
      });
    };

    const html2pdf = await loadHtml2Pdf();
    
    // Backup and rewrite style tags
    const styleTags = Array.from(document.querySelectorAll('style'));
    const backups = styleTags.map(tag => ({ tag, content: tag.textContent }));
    
    const restoreStyles = () => {
      backups.forEach(({ tag, content }) => {
        if (tag) tag.textContent = content;
      });
    };

    try {
      styleTags.forEach(tag => {
        if (tag && tag.textContent) {
          tag.textContent = replaceUnsupportedColors(tag.textContent);
        }
      });
    } catch (e) {
      console.warn("Failed to temporarily rewrite style tags", e);
    }

    const element = document.getElementById('printable-sheet-report');
    if (!element) {
      restoreStyles();
      setIsGeneratingPdf(false);
      throw new Error("L'élément de rapport n'a pas été trouvé.");
    }

    // Prepare temporary classes/styles to show off-screen
    const originalClasses = element.className;
    element.className = "block bg-white text-slate-900 p-10 max-w-4xl mx-auto font-sans relative overflow-hidden";
    element.style.display = 'block';
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '-9999px';
    element.style.width = '800px';
    element.style.zIndex = '9999';

    const dateStr = activePrintPayment ? activePrintPayment.datePaye : new Date().toISOString().split('T')[0];
    const filename = `Rapport-Paye-Zachary-${dateStr}.pdf`;

    const opt = {
      margin:       [8, 8, 8, 8],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const blob = await html2pdf().set(opt).from(element).outputPdf('blob');
      
      // Cleanup
      restoreStyles();
      element.className = originalClasses;
      element.style.display = '';
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.width = '';
      element.style.zIndex = '';
      setIsGeneratingPdf(false);
      
      return { blob, filename };
    } catch (err) {
      restoreStyles();
      element.className = originalClasses;
      element.style.display = '';
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.width = '';
      element.style.zIndex = '';
      setIsGeneratingPdf(false);
      throw err;
    }
  };

  const downloadBlobLocally = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLocalDownload = async () => {
    setExportActionLoading('pdf');
    setExportStatus({});
    try {
      const { blob, filename } = await generatePdfBlob();
      downloadBlobLocally(blob, filename);
      setExportStatus({ success: true });
      setTimeout(() => setExportModalOpen(false), 800);
    } catch (err: any) {
      console.error(err);
      setExportStatus({ error: err.message || "Échec de l'exportation PDF." });
    } finally {
      setExportActionLoading('none');
    }
  };

  const handleDriveUpload = async () => {
    setExportActionLoading('drive');
    setExportStatus({});
    try {
      const { blob, filename } = await generatePdfBlob();
      const res = await uploadPdfToDrive(blob, filename);
      setExportStatus({ success: true });
      setFeedback(`Succès ! Enregistré dans Google Drive (ID: ${res.id})`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error(err);
      setExportStatus({ error: err.message || "Échec de la sauvegarde sur Google Drive." });
    } finally {
      setExportActionLoading('none');
    }
  };

  const handleGmailSend = async () => {
    const confirmed = window.confirm(`Voulez-vous vraiment envoyer votre rapport de paye à ${recipientEmail} par courriel ?`);
    if (!confirmed) return;

    setExportActionLoading('gmail');
    setExportStatus({});
    try {
      const { blob, filename } = await generatePdfBlob();
      await sendPdfByGmail(blob, filename, recipientEmail, emailSubject, emailBody);
      setExportStatus({ success: true });
      setFeedback(`Succès ! Courriel envoyé à ${recipientEmail}.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      console.error(err);
      setExportStatus({ error: err.message || "Échec de l'envoi du courriel via Gmail." });
    } finally {
      setExportActionLoading('none');
    }
  };

  // Filter non-paid
  const unpaidEntries = production
    .filter(e => e.status === 'Non payé')
    .sort((a, b) => b.date.localeCompare(a.date));

  // Totals calculations
  const totalUnpaid = unpaidEntries.reduce((sum, e) => {
    return sum + (e.pockets12kg * pocketPrice) + (e.bags27kg * bagPrice);
  }, 0);

  const totalPaid = production
    .filter(e => e.status === 'Payé')
    .reduce((sum, e) => {
      return sum + (e.pockets12kg * pocketPrice) + (e.bags27kg * bagPrice);
    }, 0);

  const grandTotal = totalUnpaid + totalPaid;

  // Weekly Stats Helper (Monday to Sunday containing June 14, 2026 or current active date)
  const getWeeklyStats = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday
    const startOfWeek = new Date(today.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    // Filter entries inside this week
    const weeklyEntries = production.filter(entry => entry.date >= startStr && entry.date <= endStr);
    const totalPockets = weeklyEntries.reduce((sum, entry) => sum + entry.pockets12kg, 0);
    const totalBags = weeklyEntries.reduce((sum, entry) => sum + entry.bags27kg, 0);
    const totalAmount = (totalPockets * pocketPrice) + (totalBags * bagPrice);

    return {
      pockets: totalPockets,
      bags: totalBags,
      amount: totalAmount,
      start: startStr,
      end: endStr
    };
  };

  const weeklyStats = getWeeklyStats();

  // Toggle selection for payees
  const handleToggleEntry = (id: string) => {
    if (selectedEntryIds.includes(id)) {
      setSelectedEntryIds(selectedEntryIds.filter(item => item !== id));
    } else {
      setSelectedEntryIds([...selectedEntryIds, id]);
    }
  };

  // Toggle selection for all unpaid
  const handleSelectAllUnpaid = () => {
    if (selectedEntryIds.length === unpaidEntries.length) {
      setSelectedEntryIds([]);
    } else {
      setSelectedEntryIds(unpaidEntries.map(e => e.id));
    }
  };

  // Submit bulk cashout
  const handleMarkSelectedAsPaid = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedEntryIds.length === 0) {
      alert("Veuillez sélectionner au moins une journée de production.");
      return;
    }

    onMarkAsPaid(selectedEntryIds, cashoutNotes || "Régularisation groupée de paye");
    
    // Clear selection
    setSelectedEntryIds([]);
    setCashoutNotes('');
    setFeedback("Félicitations ! Les journées sélectionnées ont été marquées comme payées.");
    setTimeout(() => setFeedback(null), 4000);
  };

  // Trigger quick cashout for a single card
  const handleMarkSingleAsPaid = (id: string, date: string) => {
    onMarkAsPaid([id], `Paye pour la journée du ${date}`);
    setFeedback(`La journée du ${date} a été marquée comme payée avec succès !`);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Printing/PDF generation trigger
  const triggerNativePrint = () => {
    setIsGeneratingPdf(true);
    
    // Dynamic loader function for html2pdf.js bundle
    const loadHtml2Pdf = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          resolve((window as any).html2pdf);
        };
        script.onerror = (err) => {
          reject(err);
        };
        document.head.appendChild(script);
      });
    };

    loadHtml2Pdf()
      .then((html2pdf) => {
        // Backup all style tags and temporarily translate oklch functions to hex values
        const styleTags = Array.from(document.querySelectorAll('style'));
        const backups = styleTags.map(tag => ({ tag, content: tag.textContent }));
        
        const restoreStyles = () => {
          backups.forEach(({ tag, content }) => {
            if (tag) tag.textContent = content;
          });
        };

         try {
          styleTags.forEach(tag => {
            if (tag && tag.textContent) {
              tag.textContent = replaceUnsupportedColors(tag.textContent);
            }
          });
        } catch (e) {
          console.warn("Failed to temporarily rewrite style tags", e);
        }

        const element = document.getElementById('printable-sheet-report');
        if (element) {
          // Prepare temporary classes/styles to show off-screen
          const originalClasses = element.className;
          
          // Make sure it is rendered and positioned off-screen
          element.className = "block bg-white text-slate-900 p-10 max-w-4xl mx-auto font-sans relative overflow-hidden";
          element.style.display = 'block';
          element.style.position = 'fixed';
          element.style.top = '0';
          element.style.left = '-9999px';
          element.style.width = '800px';
          element.style.zIndex = '9999';

          const dateStr = activePrintPayment ? activePrintPayment.datePaye : new Date().toISOString().split('T')[0];
          const filename = `Rapport-Paye-Zachary-${dateStr}.pdf`;

          const opt = {
            margin:       [8, 8, 8, 8],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          // Generate the PDF
          html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
              restoreStyles();
              // Restore and clean up
              element.className = originalClasses;
              element.style.display = '';
              element.style.position = '';
              element.style.top = '';
              element.style.left = '';
              element.style.width = '';
              element.style.zIndex = '';
              setIsGeneratingPdf(false);
            })
            .catch((err: any) => {
              restoreStyles();
              console.error("Erreur de génération PDF", err);
              // Fallback to window print in case of canvas issues
              window.print();
              setIsGeneratingPdf(false);
            });
        } else {
          restoreStyles();
          // Fallback to native window print
          window.print();
          setIsGeneratingPdf(false);
        }
      })
      .catch((err) => {
        console.error("Impossible de charger html2pdf.js", err);
        // Fallback to standard print
        window.print();
        setIsGeneratingPdf(false);
      });
  };

  // Get printed entries helper
  const getPrintEntries = (): ProductionEntry[] => {
    if (activePrintPayment) {
      return production.filter(e => activePrintPayment.includedEntries.includes(e.id));
    } else if (customRangePrint) {
      return production.filter(e => {
        return e.date >= printStartDate && e.date <= printEndDate;
      }).sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  };

  const printEntries = getPrintEntries();
  const printPockets = printEntries.reduce((sum, e) => sum + e.pockets12kg, 0);
  const printBags = printEntries.reduce((sum, e) => sum + e.bags27kg, 0);
  const printTotal = (printPockets * pocketPrice) + (printBags * bagPrice);

  return (
    <div className="space-y-6 print:hidden" id="wallet-tab">
      
      {/* 1. Header with User Context & Greeting */}
      <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-600 bg-blue-100/50 px-2.5 py-1 rounded-full uppercase">
              Espace Portefeuille Privé
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
              Salut Zachary Martel 👋
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Suis tes gains cumulés, vérifie tes statistiques de production hebdomadaire et valide tes paiements d'un seul clic.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {/* Quick Navigation Button to Graphiques */}
            {onNavigate && (
              <button
                onClick={() => onNavigate('graphiques')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <TrendingUp size={14} />
                <span>Accéder aux Graphiques</span>
              </button>
            )}
            
            {/* Direct Trigger to Exporter PDF Range option */}
            <button
              disabled={isGeneratingPdf}
              onClick={() => {
                setCustomRangePrint(true);
                setActivePrintPayment(null);
                setPrintStartDate(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]); // 30 days ago
                setPrintEndDate(new Date().toISOString().split('T')[0]);
                setExportModalOpen(true);
                setExportStatus({});
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <FileDown size={14} className={isGeneratingPdf ? "animate-spin" : ""} />
              <span>{isGeneratingPdf ? 'Génération...' : 'Exporter ma paye en PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 3 Prominent Numeric Cards (Ice blue, white, gray, minimalist layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="wallet-metrics-summary">
        {/* Unpaid Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
              <WalletIcon size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">À Recevoir</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3.5xl font-black text-slate-900 font-mono">
              {formatCurrency(totalUnpaid)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gains en cours d'accumulation (non réglés)
            </p>
          </div>
        </div>

        {/* Paid Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs border-b-4 border-b-emerald-500 flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Déjà Remis</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3.5xl font-black text-emerald-600 font-mono">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total des soldes archivés & déjà payés
            </p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-400">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Cumulé</span>
            </div>
            <div>
              <div className="text-2xl sm:text-3.5xl font-black text-white font-mono">
                {formatCurrency(grandTotal)}
              </div>
              <p className="text-xs text-blue-300 mt-1">
                Tous gains confondus pour la saison
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 opacity-10 translate-x-4 translate-y-4 select-none pointer-events-none">
            <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 4.5l7.5 13h-15L12 6.5z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Statistiques rapides (Total pockets, bags, dollar of the week) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Statistiques Rapides de la Semaine
            </h3>
            <p className="text-xs text-slate-400">Période du {weeklyStats.start} au {weeklyStats.end}</p>
          </div>
          <div className="text-right text-xs text-slate-400 font-medium">
            Tarifs : {pocketPrice.toFixed(2)}$/poche | {bagPrice.toFixed(2)}$/sac
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total des Poches (12kg)</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{weeklyStats.pockets}</p>
            <p className="text-[10px] text-slate-500 mt-1">Valeur brute : {formatCurrency(weeklyStats.pockets * pocketPrice)}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total des Sacs (2,7kg)</p>
            <p className="text-2xl font-black text-slate-800 mt-1 font-mono">{weeklyStats.bags}</p>
            <p className="text-[10px] text-slate-500 mt-1">Valeur brute : {formatCurrency(weeklyStats.bags * bagPrice)}</p>
          </div>
          <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
            <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Total $ de la Semaine</p>
            <p className="text-2xl font-black text-blue-700 mt-1 font-mono">{formatCurrency(weeklyStats.amount)}</p>
            <p className="text-[10px] text-blue-500 mt-1">Somme brute générée</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main split dashboard: Unpaid production & Payment history */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ACTIVE UNPAID SHIFTS LOGGER (CASH OUT ACTIONS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-950 flex items-center text-sm">
                  <DollarSign size={16} className="text-blue-500 mr-1" />
                  Journées non payées
                </h3>
                <p className="text-xs text-slate-400">Marque les journées réglées individuellement, ou sélectionne-bises pour un paiement groupé.</p>
              </div>

              {unpaidEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllUnpaid}
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition"
                >
                  {selectedEntryIds.length === unpaidEntries.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>

            {unpaidEntries.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={36} />
                <h4 className="text-sm font-bold text-slate-800">Tout est payé !</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Aucun gain en souffrance. Toutes les productions enregistrées ont été réglées.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Quick Header Action for multiple payments */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">
                    Saisie groupée : <strong className="font-mono text-blue-600">{selectedEntryIds.length}</strong> / {unpaidEntries.length} sélectionné(s)
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleMarkSelectedAsPaid}
                    disabled={selectedEntryIds.length === 0}
                    className={`px-4.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs ${
                      selectedEntryIds.length > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Marquer plusieurs journées comme payées</span>
                  </button>
                </div>

                {/* 2. Unpaid Entries Grid / Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {unpaidEntries.map(entry => {
                    const value = (entry.pockets12kg * pocketPrice) + (entry.bags27kg * bagPrice);
                    const isChecked = selectedEntryIds.includes(entry.id);

                    return (
                      <div 
                        key={entry.id}
                        onClick={() => handleToggleEntry(entry.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                          isChecked 
                            ? 'bg-blue-50/40 border-blue-500 shadow-2xs' 
                            : 'bg-white hover:bg-slate-50/50 border-slate-200 shadow-3xs'
                        }`}
                      >
                        {/* Top Line: Date, Checkbox, Value */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {/* Checkbox circle */}
                            <div 
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                                isChecked 
                                  ? 'bg-blue-600 border-blue-600 text-white' 
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isChecked && <CheckCircle className="stroke-[3]" size={12} />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 font-mono">
                                {entry.date}
                              </span>
                              {entry.time && (
                                <span className="text-[9px] text-slate-400 block font-mono">
                                  {entry.time}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {formatCurrency(value)}
                          </span>
                        </div>

                        {/* Mid Row details */}
                        <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2 rounded-xl">
                          <div className="flex justify-between">
                            <span>Poches 12kg :</span>
                            <strong className="font-mono text-slate-700">{entry.pockets12kg}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Sacs 2,7kg :</span>
                            <strong className="font-mono text-slate-700">{entry.bags27kg}</strong>
                          </div>
                        </div>

                        {/* Direct paying trigger button inside card */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid toggling checkbox double trigger
                            handleMarkSingleAsPaid(entry.id, entry.date);
                          }}
                          className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 rounded-xl transition flex items-center justify-center gap-1 shadow-3xs"
                        >
                          <CheckCircle size={12} />
                          <span>Marquer comme payé</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Additional payment notes */}
                {selectedEntryIds.length > 0 && (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">
                      Note de paye optionnelle (ex. chèque #123)
                    </label>
                    <input 
                      type="text"
                      placeholder="Commentaire de paye..."
                      value={cashoutNotes}
                      onChange={(e) => setCashoutNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs leading-tight font-medium"
                    />
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HISTORICAL COINS & CUSTOM REPORTS */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Google Workspace Connection Widget */}
          <div className="bg-gradient-to-br from-[#EEF2F6]/50 via-white to-[#F8FAFC] border border-slate-200 rounded-3xl p-5 space-y-3.5 shadow-3xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="text-blue-500" size={18} />
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-800">
                  Google Workspace
                </h3>
              </div>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                googleConnected 
                  ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200' 
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                {googleConnected ? '● Connecté' : 'Hors-ligne'}
              </span>
            </div>

            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              Associe ton compte Google pour activer la sauvegarde automatique sur <strong className="text-slate-800">Google Drive</strong> et l'envoi de rapports par courriel via <strong className="text-slate-800">Gmail</strong>.
            </p>

            {googleConnected ? (
              <div className="space-y-2 pt-1">
                <div className="bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                      {googleUser?.displayName ? googleUser.displayName[0] : 'Z'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-800 truncate">
                        {googleUser?.displayName || 'Zachary Martel'}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {googleUser?.email || 'zacharymartel80@gmail.com'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleDisconnect}
                    className="p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                    title="Déconnecter les services Google"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="w-full py-2 bg-white hover:bg-slate-55 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 flex items-center justify-center gap-2 transition hover:border-slate-300 shadow-3xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>Connecter Google Workspace</span>
              </button>
            )}
          </div>

          {/* Custom Date PDF Report form */}
          <div className="bg-gradient-to-br from-blue-50/50 via-slate-50/30 to-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-3xs">
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <FileDown size={15} className="text-blue-600" />
                Générateur de rapport de paye
              </h3>
              <p className="text-[10.5px] text-slate-400">Configure la plage de dates pour générer un relevé officiel d'activités.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Date Début</label>
                <input 
                  type="date"
                  value={printStartDate}
                  onChange={(e) => setPrintStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Date Fin</label>
                <input 
                  type="date"
                  value={printEndDate}
                  onChange={(e) => setPrintEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-mono"
                />
              </div>
            </div>

            <button
              disabled={isGeneratingPdf}
              onClick={() => {
                if (!printStartDate || !printEndDate) {
                  alert("Veuillez d'abord choisir les dates.");
                  return;
                }
                setCustomRangePrint(true);
                setActivePrintPayment(null);
                setExportModalOpen(true);
                setExportStatus({});
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-bold py-2 rounded-xl text-xs transition text-center flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
            >
              <FileDown size={13} className={isGeneratingPdf ? "animate-spin" : ""} />
              <span>{isGeneratingPdf ? 'Génération du PDF...' : 'Générer & Exporter PDF'}</span>
            </button>
          </div>

          {/* Custom Glide PDF Template Copy-Paste Tool */}
          <div className="bg-gradient-to-br from-blue-50 via-white to-sky-50 border-2 border-dashed border-[#4DA6FF] rounded-3xl p-5 space-y-4 shadow-3xs hover:scale-[1.01] transition-all">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#4DA6FF] shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase font-black tracking-widest text-blue-600 bg-blue-100/60 px-2.5 py-0.5 rounded-full inline-block">
                  Générateur Glide PDF
                </span>
                <h3 className="text-xs font-bold text-slate-950 mt-1">
                  Modèle PDF Ultra-Premium
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                  Copie ce gabarit HTML ultra-premium pré-configuré pour l'intégrer directement dans ton action PDF Glide.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={handleCopyTemplate}
                type="button"
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs ${
                  copiedTemplate
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#4DA6FF] hover:bg-[#3d91eb] text-white'
                }`}
              >
                {copiedTemplate ? (
                  <>
                    <CheckCircle size={13} />
                    <span>✓ Gabarit HTML Copié !</span>
                  </>
                ) : (
                  <>
                    <FileDown size={13} />
                    <span>Copier le Gabarit HTML</span>
                  </>
                )}
              </button>

              <a
                href={frigoLogo}
                download="frigo_glace_logo.jpg"
                className="w-full py-2 border border-slate-200 hover:border-[#4DA6FF] text-slate-700 hover:text-slate-950 font-bold bg-white rounded-xl text-[11px] transition text-center flex items-center justify-center gap-1.5 shadow-3xs"
                title="Téléchargez l'image du logo pour l'ajouter comme URL d'image dans Glide"
              >
                <span>📥 Télécharger l'image du logo</span>
              </a>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl text-[9px] leading-relaxed text-slate-500 border border-slate-200/50">
              💡 <strong className="text-slate-700">Guide rapide Glide :</strong> Téléporte l'image téléchargée dans Glide comme image publique de l'application, puis insère son URL dans le gabarit PDF. Les placeholders <strong className="text-[#3a93f0]">{"{{Date_Debut}}"}</strong>, <strong className="text-[#3a93f0]">{"{{Liste_Jours}}"}</strong>, etc., seront remplis par Glide !
            </div>
          </div>

          {/* HISTORICAL PAYMENTS LIST WITH 🗑️ RED BUTTON FOR DELETIONS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-950 flex items-center text-sm">
              <FileText size={16} className="text-slate-500 mr-1" />
              Tableau des Payes Remises
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {payments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs italic">
                  Aucun versement enregistré pour le moment.
                </div>
              ) : (
                payments.map(pay => (
                  <div key={pay.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/80 rounded-2xl flex flex-col gap-2.5 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 font-mono">
                          Reçu le {pay.datePaye}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold italic mt-0.5">
                          "{pay.notes}"
                        </p>
                      </div>
                      <span className="text-sm font-black text-emerald-600 font-mono">
                        {formatCurrency(pay.amountTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/80">
                      <span className="text-slate-500 font-medium">
                        {pay.includedEntries.length} jour(s) inclus
                      </span>
                      
                      {/* Action triggers with RED 🗑️ Suppression button */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isGeneratingPdf}
                          onClick={() => {
                            setCustomRangePrint(false);
                            setActivePrintPayment(pay);
                            setExportModalOpen(true);
                            setExportStatus({});
                          }}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-60 text-slate-700 rounded-lg text-[10px] font-bold flex items-center transition disabled:cursor-not-allowed"
                        >
                          <FileText size={11} className={`mr-0.5 ${isGeneratingPdf ? "animate-spin" : ""}`} /> 
                          {isGeneratingPdf ? 'Calcul...' : 'Fiche PDF'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Confirmer la suppression de cet archivage de paye ? Toutes les journées de production de cette paye redeviendront sous le statut 'Non payé'.")) {
                              onDeletePayment(pay.id);
                            }
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center transition shadow-3xs"
                          title="Supprimer la paye de l'historique"
                        >
                          <span className="mr-0.5">🗑️</span> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FULL PRINTABLE SHEET BLOCK DIRECT OVERLAY (ONLY DRAWN FOR window.print()) */}
      {/* Target elements gets visible exclusively on media print as specified on tailwind classes below */}
      <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-10 z-[9999] max-w-4xl mx-auto font-sans relative overflow-hidden" id="printable-sheet-report">
        
        {/* Giant Centered Watermark Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none w-[60%] z-0 select-none">
          <img src={frigoLogo} alt="Watermark" className="w-full object-contain" />
        </div>

        {/* Header Block (Bandeau bleu glace #4DA6FF, 100% width, height 120px equivalent layout) */}
        <div className="bg-[#4DA6FF] rounded-xl p-6 text-white flex justify-between items-center mb-8 relative z-10 shadow-sm" style={{ height: '120px' }}>
          <div className="flex items-center gap-4">
            <img 
              src={frigoLogo} 
              alt="Logo" 
              className="h-20 w-auto object-contain bg-white/10 rounded-lg p-1.5" 
              style={{ filter: 'brightness(0) invert(1)' }} 
            />
            <div>
              <h1 className="text-xl font-extrabold tracking-tight uppercase">Frigo-Glace Lambert enr.</h1>
              <p className="text-xs font-bold opacity-95">Résumé de paye – Employé : Zachary</p>
            </div>
          </div>
          <div className="text-right text-xs space-y-1.5 shrink-0">
            <p className="font-semibold">
              Période : {activePrintPayment 
                ? (printEntries.length > 0 ? `${printEntries[0].date} → ${printEntries[printEntries.length - 1].date}` : 'N/A')
                : `${printStartDate || 'N/A'} → ${printEndDate || 'N/A'}`
              }
            </p>
            <p className="opacity-90 font-medium">Émis le : {activePrintPayment ? activePrintPayment.datePaye : new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>

        {/* Section 1 : Détails de la production */}
        <div className="relative z-10 mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b-2 border-slate-200">
            1. Détails de la production
          </h2>
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#4DA6FF] text-white">
                  <th className="p-3 font-extrabold uppercase tracking-wide text-[10px]">Date</th>
                  <th className="p-3 font-extrabold uppercase tracking-wide text-[10px] text-center">Poches (12kg)</th>
                  <th className="p-3 font-extrabold uppercase tracking-wide text-[10px] text-center">Sacs (2.7kg)</th>
                  <th className="p-3 font-extrabold uppercase tracking-wide text-[10px] text-right">Total du jour</th>
                </tr>
              </thead>
              <tbody>
                {printEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400 italic bg-white">Aucune journée sélectionnée pour ce rapport.</td>
                  </tr>
                ) : (
                  printEntries.map((entry, idx) => {
                    const entryTotal = (entry.pockets12kg * pocketPrice) + (entry.bags27kg * bagPrice);
                    return (
                      <tr key={entry.id} className={idx % 2 === 1 ? 'bg-[#F5F5F5]' : 'bg-white'}>
                        <td className="p-3 border-t border-slate-100 font-mono text-slate-700">{entry.date}</td>
                        <td className="p-3 border-t border-slate-100 text-center font-mono text-slate-800 font-semibold">{entry.pockets12kg}</td>
                        <td className="p-3 border-t border-slate-100 text-center font-mono text-slate-800 font-semibold">{entry.bags27kg}</td>
                        <td className="p-3 border-t border-slate-100 text-right font-mono font-bold text-slate-900">{formatCurrency(entryTotal)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2 (Totaux) & Section 3 (Vérification QR Code) */}
        <div className="grid grid-cols-5 gap-6 mb-8 relative z-10 items-stretch">
          <div className="col-span-3 bg-[#F5F5F5] border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b border-slate-300">
                2. Totaux de la période
              </h2>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between font-mono">
                  <span>Total poches : <strong className="text-slate-800 font-bold">{printPockets}</strong> &times; {pocketPrice.toFixed(2)}$</span>
                  <span className="font-bold text-slate-800">{formatCurrency(printPockets * pocketPrice)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Total sacs : <strong className="text-slate-800 font-bold">{printBags}</strong> &times; {bagPrice.toFixed(2)}$</span>
                  <span className="font-bold text-slate-800">{formatCurrency(printBags * bagPrice)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t-2 border-slate-300 pt-3 mt-4">
              <span className="text-sm font-black text-slate-900 uppercase">Total général</span>
              <span className="text-base font-black text-blue-900 font-mono">{formatCurrency(printTotal)}</span>
            </div>
          </div>

          <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">3. Vérification & Sécurité</h2>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Paye-Zachary-${activePrintPayment ? activePrintPayment.datePaye : new Date().toISOString().split('T')[0]}-${printTotal.toFixed(2)}`} 
              alt="QR Code de Vérification" 
              className="w-[100px] h-[100px] object-contain mb-1.5"
            />
            <p className="text-[8px] text-slate-400 font-mono break-all max-w-[150px]">
              Paye-Zachary-{activePrintPayment ? activePrintPayment.datePaye : new Date().toISOString().split('T')[0]}-{printTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Section 4 : Signatures numériques */}
        <div className="relative z-10 mb-8">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 pb-1 border-b-2 border-slate-200">
            4. Signature numérique
          </h2>
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block border-b border-slate-100 pb-1 mb-3">Employeur</span>
              <div className="h-14 flex items-center justify-center font-serif italic text-base text-slate-900 bg-slate-50 border border-dashed border-slate-300 rounded-lg tracking-wider font-semibold">
                {activePrintPayment ? `✔ FRIGO-GLACE-LAMBERT-${activePrintPayment.id.slice(0, 8).toUpperCase()}` : '✔ DIRECTEUR FRIGO GLACE'}
              </div>
              <span className="text-[10px] text-slate-400 mt-2 text-center font-mono">Approuvé numériquement</span>
            </div>
            
            <div className="border border-slate-200 bg-white rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider block border-b border-slate-100 pb-1 mb-3">Employé</span>
              <div className="h-14 flex items-center justify-center font-serif italic text-base text-slate-900 bg-slate-50 border border-dashed border-slate-300 rounded-lg tracking-wider font-semibold">
                {activePrintPayment ? `✔ ZACHARY-MARTEL-${activePrintPayment.datePaye}` : '✔ ZACHARY MARTEL - DSIG'}
              </div>
              <span className="text-[10px] text-slate-400 mt-2 text-center font-mono">Signé numériquement</span>
            </div>
          </div>
        </div>

        {/* Section 5 : Notes */}
        <div className="relative z-10">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 pb-1 border-b-2 border-slate-200">
            5. Notes
          </h2>
          <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed font-sans italic">
            {activePrintPayment ? activePrintPayment.notes : "Relevé de paye officiel d'activités généré sur demande pour l'employé Zachary Martel."}
          </p>
        </div>

      </div>

      {/* 4. MODAL D'EXPORTATION MULTI-CANAUX (GOOGLE WORKSPACE) */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999]" id="export-workspace-modal">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 w-full max-w-md shadow-2xl relative space-y-6">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                if (exportActionLoading === 'none') {
                  setExportModalOpen(false);
                  setExportStatus({});
                }
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] font-black tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase inline-block">
                Exportateur Intelligent
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-2 flex items-center gap-1.5">
                <FileText size={18} className="text-blue-500" />
                Choisir la méthode d'exportation
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Génère un résumé de paye PDF ultra-premium pour la période sélectionnée :
              </p>
              
              {/* Period details info box */}
              <div className="mt-3 bg-slate-50 rounded-2xl p-3 border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Période du rapport</p>
                  <p className="font-semibold text-slate-800 font-mono mt-0.5">
                    {activePrintPayment 
                      ? activePrintPayment.datePaye 
                      : `${printStartDate} au ${printEndDate}`
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montant total</p>
                  <strong className="text-blue-600 font-mono text-sm block mt-0.5">{formatCurrency(printTotal)}</strong>
                </div>
              </div>
            </div>

            {/* Google Service Status Banner */}
            <div className="p-3.5 rounded-2xl border border-slate-150 flex items-center justify-between text-xs bg-gradient-to-r from-blue-50/20 via-sky-50/10 to-transparent">
              <div className="flex items-center gap-2 min-w-0">
                <Cloud className="text-blue-500 shrink-0" size={16} />
                <div className="text-[11px] min-w-0">
                  <p className="font-bold text-slate-800">Compte Google Services</p>
                  <p className="text-slate-400 text-[9.5px] truncate max-w-[180px]">
                    {googleConnected && googleUser 
                      ? `Connecté : ${googleUser.email}` 
                      : 'Non connecté aux services Google'
                    }
                  </p>
                </div>
              </div>

              {googleConnected ? (
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg font-bold text-[10px] transition cursor-pointer shrink-0"
                >
                  Déconnecter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] transition shadow-3xs cursor-pointer shrink-0"
                >
                  Connecter
                </button>
              )}
            </div>

            {/* Error or Success messages */}
            {exportStatus.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] font-bold">
                ⚠️ Erreur : {exportStatus.error}
              </div>
            )}
            {exportStatus.success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold">
                ✓ L'action a été complétée avec succès !
              </div>
            )}

            {/* Export Actions Bento Stack */}
            <div className="space-y-3">
              {/* Option 1: Direct PDF download */}
              <button
                type="button"
                disabled={exportActionLoading !== 'none'}
                onClick={handleLocalDownload}
                className="w-full p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-left transition flex items-center justify-between group disabled:opacity-55 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 flex items-center justify-center transition shrink-0">
                    {exportActionLoading === 'pdf' ? (
                      <Loader className="animate-spin text-blue-500 animate-duration-1000" size={18} />
                    ) : (
                      <FileDown size={18} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">Télécharger localement</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Télécharge le fichier PDF directement sur cet appareil.</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition -translate-x-1 group-hover:translate-x-0" />
              </button>

              {/* Option 2: Upload to Google Drive */}
              <button
                type="button"
                disabled={exportActionLoading !== 'none'}
                onClick={googleConnected ? handleDriveUpload : handleGoogleConnect}
                className={`w-full p-4 bg-white hover:bg-slate-50 border rounded-2xl text-left transition flex items-center justify-between group disabled:opacity-55 cursor-pointer ${
                  googleConnected ? 'border-slate-200' : 'border-dashed border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition shrink-0 ${
                    googleConnected 
                      ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' 
                      : 'bg-slate-50 text-slate-300'
                  }`}>
                    {exportActionLoading === 'drive' ? (
                      <Loader className="animate-spin text-blue-500 animate-duration-1000" size={18} />
                    ) : (
                      <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.43 12.98l-7.43-12.98h-11.43l7.43 12.98h11.43zm-11.43 2.02l-3.43 6h15l3.43-6h-15zm-4.32-1l3.43-6 5.71 10-3.43 6-5.71-10z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase ${googleConnected ? 'text-slate-900' : 'text-slate-400'}`}>
                      Sauvegarder dans Google Drive
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {googleConnected 
                        ? 'Enregistre instantanément le rapport sur votre disque cloud.' 
                        : 'Requis d\'abord : Connecter son compte Google'
                      }
                    </p>
                  </div>
                </div>
                {googleConnected ? (
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition -translate-x-1 group-hover:translate-x-0" />
                ) : (
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full shrink-0">Lier</span>
                )}
              </button>

              {/* Option 3: Send via Gmail */}
              <div className={`border rounded-2xl flex flex-col p-4 space-y-3.5 transition bg-white ${
                googleConnected ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-60'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    googleConnected ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'
                  }`}>
                    {exportActionLoading === 'gmail' ? (
                      <Loader className="animate-spin text-blue-500 animate-duration-1000" size={18} />
                    ) : (
                      <Mail size={18} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-xs font-black uppercase ${googleConnected ? 'text-slate-900' : 'text-slate-400'}`}>
                      Envoyer par courriel (Gmail)
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Envoie une fiche officielle en pièce jointe PDF.</p>
                  </div>
                </div>

                {googleConnected ? (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-slate-400 mb-0.5">Destinataire (Email)</label>
                      <input 
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-[11px] font-medium leading-normal"
                        placeholder="destinataire@exemple.com"
                      />
                    </div>
                    
                    <button
                      type="button"
                      disabled={exportActionLoading !== 'none' || !recipientEmail}
                      onClick={handleGmailSend}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Mail size={12} />
                      <span>Envoyer la fiche PDF</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleConnect}
                    className="w-full py-1.5 border border-dashed border-slate-200 text-slate-400 rounded-lg text-[10.5px] font-bold text-center hover:bg-slate-50 transition cursor-pointer"
                  >
                    Lier Google pour envoyer par courriel
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
