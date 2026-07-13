/**
 * Extended demo seed script — populates companies, users, sent emails,
 * access logs, beacon logs, and security alerts, so the admin dashboard
 * has real numbers and chart data immediately after running it.
 *
 * Save this as scripts/seed-demo.ts in your project (alongside the
 * existing scripts/seed.ts), then run:
 *   npx tsx scripts/seed-demo.ts
 *
 * It reuses the same env vars as scripts/seed.ts (FIREBASE_PROJECT_ID,
 * FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, etc.) — no new setup needed.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { config } from 'dotenv';

config();

const serviceAccount = {
  type: process.env.FIREBASE_TYPE || 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
  token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:
    process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
  console.error('Missing required Firebase environment variables. See scripts/seed.ts for the list.');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount as any) });

const db = getFirestore();
const auth = getAuth();

// Helper: random timestamp within the last N hours
function recentTimestamp(maxHoursAgo: number): Timestamp {
  const hoursAgo = Math.random() * maxHoursAgo;
  return Timestamp.fromDate(new Date(Date.now() - hoursAgo * 60 * 60 * 1000));
}

const seedData = async () => {
  console.log('Starting extended demo seed...');

  // ---------- 1. Companies ----------
  console.log('Seeding companies...');
  const companies: Record<string, { name: string }> = {
    '1': { name: 'Stark Industries' },
    '2': { name: 'Wayne Enterprises' },
    '3': { name: 'Ghosh Security Labs' },
  };
  for (const [id, companyData] of Object.entries(companies)) {
    await db.collection('companies').doc(id).set(companyData);
  }
  console.log('Companies seeded.');

  // ---------- 2. Users ----------
  console.log('Seeding users and creating auth accounts...');
  const users = [
    { uid: 'user-admin-01', email: 'rishi.404@outlook.com', password: 'password123', name: 'Rishi', role: 'admin', avatarUrl: '/logo.png' },
    { uid: 'user-ca-01', email: 'tony@stark.com', password: 'password123', name: 'Tony Stark', role: 'company_admin', companyId: '1', avatarUrl: '/logo.png' },
    { uid: 'user-emp-01', email: 'pepper@stark.com', password: 'password123', name: 'Pepper Potts', role: 'employee', companyId: '1', avatarUrl: '/logo.png' },
    { uid: 'user-ca-02', email: 'bruce@wayne.com', password: 'password123', name: 'Bruce Wayne', role: 'company_admin', companyId: '2', avatarUrl: '/logo.png' },
    { uid: 'user-emp-02', email: 'lucius@wayne.com', password: 'password123', name: 'Lucius Fox', role: 'employee', companyId: '2', avatarUrl: '/logo.png' },
    { uid: 'user-ca-03', email: 'aditighosh668@gmail.com', password: 'password123', name: 'Aditi Ghosh', role: 'company_admin', companyId: '3', avatarUrl: '/logo.png' },
    { uid: 'user-emp-03', email: 'hena.ghosh786@gmail.com', password: 'password123', name: 'Hena Ghosh', role: 'employee', companyId: '3', avatarUrl: '/logo.png' },
  ];

  const defaultPinHash = await bcrypt.hash('000000', 10);

  for (const userData of users) {
    const { uid, email, password, ...firestoreData } = userData;
    try {
      await auth.createUser({ uid, email, password });
      console.log(`Created auth user: ${email}`);
    } catch (error: any) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log(`Auth user already exists, skipping creation: ${email}`);
      } else {
        throw error;
      }
    }
    await db.collection('users').doc(uid).set({
      ...firestoreData,
      pinHash: defaultPinHash,
      pinSet: true,
    });
  }
  console.log('Users seeded.');

  // ---------- 3. Emails (already "sent" secure links) ----------
  console.log('Seeding emails...');
  const emailSeeds = [
    { senderId: 'user-ca-01', companyId: '1', recipient: 'pepper@stark.com', subject: 'Q3 Financial Report' },
    { senderId: 'user-ca-01', companyId: '1', recipient: 'external.auditor@example.com', subject: 'Audit Documents - Confidential' },
    { senderId: 'user-ca-02', companyId: '2', recipient: 'lucius@wayne.com', subject: 'R&D Prototype Specs' },
    { senderId: 'user-ca-03', companyId: '3', recipient: 'hena.ghosh786@gmail.com', subject: 'Security Assessment Draft' },
    { senderId: 'user-ca-03', companyId: '3', recipient: 'client@example.com', subject: 'Penetration Test Findings' },
    { senderId: 'user-emp-03', companyId: '3', recipient: 'hena.ghosh786@gmail.com', subject: 'Weekly Access Log Summary' },
  ];

  const createdEmails: { id: string; companyId: string; senderId: string; recipient: string }[] = [];
  for (const e of emailSeeds) {
    const token = randomBytes(16).toString('hex');
    const createdAt = recentTimestamp(72); // spread over last 3 days
    const docRef = await db.collection('emails').add({
      recipient: e.recipient,
      subject: e.subject,
      body: `This is a secure document regarding: ${e.subject}`,
      secureLinkToken: token,
      companyId: e.companyId,
      senderId: e.senderId,
      createdAt,
      expiresAt: Timestamp.fromDate(new Date(createdAt.toDate().getTime() + 7 * 24 * 60 * 60 * 1000)),
      revoked: false,
      isGuest: false,
    });
    createdEmails.push({ id: docRef.id, companyId: e.companyId, senderId: e.senderId, recipient: e.recipient });
  }
  console.log(`${createdEmails.length} emails seeded.`);

  // ---------- 4. Access logs (PIN entry attempts) ----------
  console.log('Seeding access logs...');
  const devices = ['Chrome on Windows', 'Safari on macOS', 'Chrome on Android', 'Firefox on Linux'];
  const ips = ['103.21.244.10', '49.207.128.55', '203.192.14.99', '172.98.65.201'];

  for (const email of createdEmails) {
    // one successful open
    await db.collection('accessLogs').add({
      emailId: email.id,
      user: email.recipient,
      email: email.recipient,
      ip: ips[Math.floor(Math.random() * ips.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      timestamp: recentTimestamp(48),
      status: 'Success',
      companyId: email.companyId,
    });
  }
  // add a couple of failed attempts for realism
  await db.collection('accessLogs').add({
    emailId: createdEmails[1].id,
    user: createdEmails[1].recipient,
    email: createdEmails[1].recipient,
    ip: '198.51.100.23',
    device: 'Chrome on Windows',
    timestamp: recentTimestamp(24),
    status: 'Failed',
    companyId: createdEmails[1].companyId,
  });
  await db.collection('accessLogs').add({
    emailId: createdEmails[4].id,
    user: createdEmails[4].recipient,
    email: createdEmails[4].recipient,
    ip: '198.51.100.23',
    device: 'Chrome on Windows',
    timestamp: recentTimestamp(12),
    status: 'Failed',
    companyId: createdEmails[4].companyId,
  });
  console.log('Access logs seeded.');

  // ---------- 5. Beacon logs (email-open tracking) ----------
  console.log('Seeding beacon logs...');
  for (const email of createdEmails) {
    await db.collection('beaconLogs').add({
      emailId: email.id,
      email: email.recipient,
      ip: ips[Math.floor(Math.random() * ips.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      timestamp: recentTimestamp(48),
      status: 'Opened',
      companyId: email.companyId,
    });
  }
  // one suspicious beacon (second open from a different IP/device) for the "Security Alerts" tab
  await db.collection('beaconLogs').add({
    emailId: createdEmails[4].id,
    email: createdEmails[4].recipient,
    ip: '91.203.145.12',
    device: 'Firefox on Linux',
    timestamp: recentTimestamp(6),
    status: 'Suspicious',
    companyId: createdEmails[4].companyId,
  });
  console.log('Beacon logs seeded.');

  // ---------- 6. Alerts ----------
  console.log('Seeding alerts...');
  await db.collection('alerts').add({
    companyId: createdEmails[4].companyId,
    emailId: createdEmails[4].id,
    recipientEmail: createdEmails[4].recipient,
    type: 'Suspicious Open',
    message: `Email "${createdEmails[4].senderId}" was opened from an unrecognized device and IP shortly after the original open.`,
    timestamp: recentTimestamp(6),
    resolved: false,
  });
  await db.collection('alerts').add({
    companyId: createdEmails[1].companyId,
    emailId: createdEmails[1].id,
    recipientEmail: createdEmails[1].recipient,
    type: 'Multiple Failed PINs',
    message: 'Recipient entered an incorrect PIN multiple times while trying to access a secure document.',
    timestamp: recentTimestamp(24),
    resolved: false,
  });
  console.log('Alerts seeded.');

  console.log('\nExtended demo seed complete! Dashboard should now show real numbers.');
};

seedData().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});