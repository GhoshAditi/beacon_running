import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

/**
 * Analyze beacon and access logs for suspicious activity using Gemini.
 * Returns true if the email should be revoked, false otherwise.
 */
export async function analyzeEmailSecurity({ beaconLogs, accessLogs }: { beaconLogs: any[]; accessLogs: any[] }) {
  // If total activity is below 4, do not revoke
  if ((beaconLogs?.length || 0) + (accessLogs?.length || 0) < 8) {
    return false;
  }
  const promptText = `You are a security AI. Given the following beacon logs and access attempts for a secure email, determine if there is suspicious activity (such as multiple devices, locations, or failed access attempts). If you think the email should be revoked for security, reply ONLY with 'REVOKE'. Otherwise, reply with 'OK'.\n\nBeacon Logs:\n${JSON.stringify(beaconLogs, null, 2)}\n\nAccess Logs:\n${JSON.stringify(accessLogs, null, 2)}`;

  const { text } = await ai.generate({ prompt: promptText });
  const normalized = text.trim();
  return normalized === 'REVOKE' || /\bREVOKE\b/i.test(normalized);
}
