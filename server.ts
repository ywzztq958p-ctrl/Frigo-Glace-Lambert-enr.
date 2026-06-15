/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Directories for persistent data
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Help helper to read/write users
function readUsers(): Record<string, any> {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({}));
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    console.error("Error reading users file:", e);
    return {};
  }
}

function writeUsers(users: Record<string, any>) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Custom registration
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, email, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur et le mot de passe sont requis.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();

    const users = readUsers();
    
    // Check if username already exists
    if (users[cleanUsername]) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris.' });
    }

    // Hash the password with sha256 + a simple salt
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');

    const userId = 'user_' + crypto.randomUUID();

    const newUser = {
      id: userId,
      username: cleanUsername,
      email: cleanEmail,
      displayName: displayName || username,
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString()
    };

    users[cleanUsername] = newUser;
    // Also index by email if provided
    if (cleanEmail) {
      users[cleanEmail] = { referenceTo: cleanUsername };
    }

    writeUsers(users);

    return res.json({
      uid: userId,
      username: cleanUsername,
      email: cleanEmail,
      displayName: newUser.displayName
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
});

// Custom login
app.post('/api/auth/login', (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Identifiants requis.' });
    }

    const cleanKey = usernameOrEmail.trim().toLowerCase();
    const users = readUsers();

    let userEntry = users[cleanKey];
    if (!userEntry) {
      return res.status(400).json({ error: 'Identifiants invalides.' });
    }

    // Resolve reference if looked up by email
    if (userEntry.referenceTo) {
      userEntry = users[userEntry.referenceTo];
    }

    if (!userEntry) {
      return res.status(400).json({ error: 'Identifiants invalides.' });
    }

    // Match password
    const testHash = crypto.createHmac('sha256', userEntry.salt).update(password).digest('hex');
    if (testHash !== userEntry.passwordHash) {
      return res.status(400).json({ error: 'Identifiants ou mot de passe incorrect.' });
    }

    return res.json({
      uid: userEntry.id,
      username: userEntry.username,
      email: userEntry.email,
      displayName: userEntry.displayName
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur.' });
  }
});

// Custom Load Data
app.get('/api/data/load/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'ID Utilisateur manquant.' });
    }

    const userFile = path.join(DATA_DIR, `data_${userId}.json`);
    if (!fs.existsSync(userFile)) {
      // Return empty dataset template
      return res.json({
        production: [],
        payments: [],
        categories: [],
        events: [],
        notes: [],
        settings: null
      });
    }

    const data = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
    return res.json(data);
  } catch (error: any) {
    console.error("Load data error:", error);
    return res.status(500).json({ error: 'Impossible de charger vos données.' });
  }
});

// Custom Save Data
app.post('/api/data/save/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const dataset = req.body; // { production, payments, categories, events, notes, settings }

    if (!userId) {
      return res.status(400).json({ error: 'ID Utilisateur manquant.' });
    }

    const userFile = path.join(DATA_DIR, `data_${userId}.json`);
    fs.writeFileSync(userFile, JSON.stringify(dataset, null, 2));

    return res.json({ success: true, updated: new Date().toISOString() });
  } catch (error: any) {
    console.error("Save data error:", error);
    return res.status(500).json({ error: 'Impossible de sauvegarder vos données.' });
  }
});

async function startServer() {
  // Vite Dev Middlewares in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server custom "Data Center" running on http://localhost:${PORT}`);
  });
}

startServer();
