'use server';

/**
 * @fileOverview A flow to verify a PIN and unlock secure content.
 * 
 * - verifyPinAndGetContent - A function that handles the PIN verification.
 */

import { ai } from '@/ai/genkit';
import { getAdminDb } from '@/lib/firebase-admin';
import { VerifyPinInputSchema, VerifyPinOutputSchema, type VerifyPinInput, type VerifyPinOutput } from '@/ai/types/unlock-content-types';
import bcrypt from 'bcryptjs';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { generateIncidentReport } from './incident-report-flow';

const FAILED_ATTEMPTS_THRESHOLD = 3;
const db = getAdminDb();
const emailsCollection = db.collection('emails');
const usersCollection = db.collection('users');
const accessLogsCollection = db.collection('accessLogs');
const alertsCollection = db.collection('alerts');

type EmailRecord = {
  id: string;
  recipient: string;
  companyId: string;
  subject: string;
  body: string;
  revoked?: boolean;
  expiresAt?: AdminTimestamp | null;
  attachmentFilename?: string;
  attachmentDataUri?: string;
  secureLinkToken: string;
};

type RecipientRecord = {
  pinHash?: string;
};

export async function verifyPinAndGetContent(input: VerifyPinInput): Promise<VerifyPinOutput> {
  return verifyPinFlow(input);
}

const verifyPinFlow = ai.defineFlow(
  {
    name: 'verifyPinFlow',
    inputSchema: VerifyPinInputSchema,
    outputSchema: VerifyPinOutputSchema,
  },
  async ({ token, pin }) => {
    const emailSnapshot = await emailsCollection.where('secureLinkToken', '==', token).limit(1).get();
    const email = emailSnapshot.empty
      ? undefined
      : ({ id: emailSnapshot.docs[0].id, ...(emailSnapshot.docs[0].data() as Omit<EmailRecord, 'id'>) } as EmailRecord);

    if (!email) {
      return { success: false, error: 'Invalid or expired link.' };
    }

    if (email.revoked) {
        return { success: false, error: 'This secure link has been disabled due to suspicious activity (multiple device/location opens). Please contact your administrator.' };
    }

    if (email.expiresAt && email.expiresAt.toDate() < new Date()) {
      return { success: false, error: 'This secure link has expired.' };
    }

    const recipientSnapshot = await usersCollection.where('email', '==', email.recipient).limit(1).get();
    const recipient = recipientSnapshot.empty
      ? undefined
      : (recipientSnapshot.docs[0].data() as RecipientRecord);
    
    if (!recipient) {
        return {
          success: false,
          error: 'This recipient does not have a security PIN configured. Ask the sender or administrator to set one up first.',
        };
    }
    
    if (!recipient.pinHash) {
        // Recipient exists but hasn't set a PIN yet
        return { 
            success: false, 
            error: 'You need to set up your PIN before accessing secure content. Please contact your administrator.' 
        };
    }
    
    const logDetails = {
      emailId: email.id,
      user: email.recipient.split('@')[0],
      email: email.recipient,
      ip: '127.0.0.1', // Placeholder IP
      device: 'Chrome on macOS', // Placeholder device
      companyId: email.companyId,
    };

    const isPinValid = await bcrypt.compare(pin, recipient.pinHash);

    if (isPinValid) {
      await accessLogsCollection.add({
        ...logDetails,
        status: 'Success',
        timestamp: AdminTimestamp.now(),
      });
      return {
        success: true,
        document: {
          title: `Confidential Document: ${email.subject}`,
          description: email.body,
          imageUrl: 'https://placehold.co/800x600.png',
          imageHint: 'financial report',
          attachmentFilename: email.attachmentFilename,
          attachmentDataUri: email.attachmentDataUri,
        },
      };
    } else {
        await accessLogsCollection.add({
            ...logDetails,
            status: 'Failed',
          timestamp: AdminTimestamp.now(),
        });
        
        const failedAttemptsSnapshot = await accessLogsCollection.where('emailId', '==', email.id).where('status', '==', 'Failed').get();
        const failedAttempts = failedAttemptsSnapshot.size;

        if (failedAttempts >= FAILED_ATTEMPTS_THRESHOLD) {
          const alertExistsSnapshot = await alertsCollection.where('emailId', '==', email.id).where('type', '==', 'Multiple Failed PINs').where('resolved', '==', false).limit(1).get();
          const alertExists = !alertExistsSnapshot.empty;
            if (!alertExists) {
            const recentLogsSnapshot = await accessLogsCollection.where('emailId', '==', email.id).orderBy('timestamp', 'desc').limit(10).get();
            const recentLogs = recentLogsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                const reportResult = await generateIncidentReport({
                    eventType: 'Multiple Failed PINs',
                    recipientEmail: email.recipient,
                    logs: JSON.stringify(recentLogs, null, 2),
                });
                
            await alertsCollection.add({
                    companyId: email.companyId,
                    emailId: email.id,
                    recipientEmail: email.recipient,
                    type: 'Multiple Failed PINs',
                    message: `Multiple failed PIN attempts detected for a secure link sent to ${email.recipient}.`,
              resolved: false,
              timestamp: AdminTimestamp.now(),
                    incidentReport: reportResult.report,
                });
            }
        }
        
      return { success: false, error: 'Invalid PIN. Please try again.' };
    }
  }
);
