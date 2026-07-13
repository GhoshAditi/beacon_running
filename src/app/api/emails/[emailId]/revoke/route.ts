import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb } from '@/lib/firebase-admin';

const db = getAdminDb();

async function getRequester(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.slice('Bearer '.length);
  const decoded = await getAuth().verifyIdToken(idToken);
  const userDoc = await db.collection('users').doc(decoded.uid).get();

  if (!userDoc.exists) {
    return null;
  }

  return { uid: decoded.uid, ...userDoc.data() } as { uid: string; role?: string; companyId?: string };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ emailId: string }> }) {
  try {
    const requester = await getRequester(request);
    if (!requester) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId } = await params;
    const payload = await request.json().catch(() => ({}));
    const revoked = Boolean(payload?.revoked ?? true);

    const emailRef = db.collection('emails').doc(emailId);
    const emailSnap = await emailRef.get();

    if (!emailSnap.exists) {
      return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 });
    }

    const emailData = emailSnap.data() as { companyId?: string };
    const canManageAll = requester.role === 'admin';
    const canManageCompany = requester.role === 'company_admin' && requester.companyId && requester.companyId === emailData.companyId;

    if (!canManageAll && !canManageCompany) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await emailRef.update({ revoked });

    return NextResponse.json({ success: true, revoked });
  } catch (error) {
    console.error('Failed to update revoked status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update revoked status' }, { status: 500 });
  }
}