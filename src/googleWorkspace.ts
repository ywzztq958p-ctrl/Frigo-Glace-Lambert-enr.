/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

// Cache the access token in memory (never localStorage / sessionStorage)
let cachedAccessToken: string | null = null;
let googleUser: any = null;

/**
 * Initiates Google OAuth Sign-In with specific Workspace scopes (Drive.file, Gmail.send & Calendar)
 */
export async function connectGoogleServices(): Promise<{ user: any; accessToken: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.addScope('https://www.googleapis.com/auth/calendar');
    
    // Always prompt for consent to guarantee token returns with the scopes
    provider.setCustomParameters({
      prompt: 'consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossible de récupérer le jeton d\'accès Google OAuth.');
    }

    cachedAccessToken = credential.accessToken;
    googleUser = result.user;
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error during Google services connection:', error);
    throw error;
  }
}

/**
 * Returns the currently cached access token
 */
export function getCachedToken(): string | null {
  return cachedAccessToken;
}

/**
 * Returns the connected Google User
 */
export function getGoogleUser(): any {
  return googleUser;
}

/**
 * Disconnect/logout Google Workspace integration
 */
export function disconnectGoogleServices() {
  cachedAccessToken = null;
  googleUser = null;
}

/**
 * Converts a Blob to a Base64 string safely
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Upload pay slip PDF to Google Drive under 'Fige-Glace' or default directory
 */
export async function uploadPdfToDrive(pdfBlob: Blob, filename: string): Promise<{ id: string; name: string }> {
  const token = getCachedToken();
  if (!token) {
    throw new Error('Veuillez vous connecter à Google Services d\'abord.');
  }

  const metadata = {
    name: filename,
    mimeType: 'application/pdf',
    description: 'Rapport de paye Frigo-Glace Lambert enr.'
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive Upload Error: ${errorText}`);
  }

  return await res.json();
}

/**
 * Send Gmail email with PDF attachment
 */
export async function sendPdfByGmail(
  pdfBlob: Blob,
  filename: string,
  toEmail: string,
  subject: string,
  bodyText: string
): Promise<any> {
  const token = getCachedToken();
  if (!token) {
    throw new Error('Veuillez vous connecter à Google Services d\'abord.');
  }

  const pdfBase64 = await blobToBase64(pdfBlob);
  const boundary = "------=_NextPart_" + Math.random().toString(36).substring(2);
  
  // Format the MIME RFC 2822 email message with attachment
  const parts = [
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    bodyText,
    ``,
    `--${boundary}`,
    `Content-Type: application/pdf; name="${filename}"`,
    `Content-Disposition: attachment; filename="${filename}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    pdfBase64,
    `--${boundary}--`
  ];
  
  const rawMime = parts.join('\r\n');
  
  // Base64url encoding
  const encodedRaw = btoa(unescape(encodeURIComponent(rawMime)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedRaw
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gmail Send Error: ${errorText}`);
  }

  return await res.json();
}

/**
 * List events from primary Google Calendar
 */
export async function listGoogleCalendarEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
  const token = getCachedToken();
  if (!token) {
    throw new Error('Veuillez vous connecter à Google Services d\'abord.');
  }

  let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime';
  if (timeMin) {
    url += `&timeMin=${encodeURIComponent(timeMin)}`;
  }
  if (timeMax) {
    url += `&timeMax=${encodeURIComponent(timeMax)}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar List Error: ${errorText}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create an event in primary Google Calendar
 */
export async function createGoogleCalendarEvent(
  title: string,
  description: string,
  date: string, // YYYY-MM-DD
  time: string, // HH:MM
  durationStr: string = '8h'
): Promise<any> {
  const token = getCachedToken();
  if (!token) {
    throw new Error('Veuillez vous connecter à Google Services d\'abord.');
  }

  // Parse start time
  const startDateTime = new Date(`${date}T${time}:00`);

  // Parse duration
  let durationInMs = 8 * 60 * 60 * 1000; // default 8 hours
  const matchHoursMin = durationStr.match(/(\d+)h(\d+)?/i);
  if (matchHoursMin) {
    const hrs = parseInt(matchHoursMin[1]);
    const mins = matchHoursMin[2] ? parseInt(matchHoursMin[2]) : 0;
    durationInMs = (hrs * 60 + mins) * 60 * 1000;
  } else {
    const matchSimpleDigit = durationStr.match(/^(\d+)h?$/i);
    if (matchSimpleDigit) {
      durationInMs = parseInt(matchSimpleDigit[1]) * 60 * 60 * 1000;
    }
  }

  const endDateTime = new Date(startDateTime.getTime() + durationInMs);

  // Use browser's resolved timezone
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Montreal';

  const eventBody = {
    summary: title,
    description: description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timeZone,
    },
  };

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar Create Error: ${errorText}`);
  }

  return await res.json();
}

