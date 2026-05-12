import { data } from '@/lib/data';

export class EmailService {
    static async getRevokedEmails(companyId?: string): Promise<string[]> {
        try {
            return await data.emails.listRevokedIds(
                companyId ? { companyId } : undefined
            );
        } catch (e) {
            console.error('Failed to fetch revoked emails:', e);
            return [];
        }
    }
}
