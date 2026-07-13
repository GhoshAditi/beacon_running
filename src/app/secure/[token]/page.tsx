"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LockKeyhole, ShieldCheck, ShieldX, Paperclip, Download, ShieldAlert } from "lucide-react";
import GuardianMailLogo from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { verifyPinAndGetContent } from "@/ai/flows/unlock-content-flow";
import type { VerifyPinOutput } from "@/ai/types/unlock-content-types";
import { data, type Email } from "@/lib/data";
import { Timestamp } from "firebase/firestore";

function UnlockedContentDisplay({ document }: { document: NonNullable<VerifyPinOutput['document']> }) {
  return (
    <div className="flex flex-col items-center w-full z-10 relative">
      <Card className="w-full max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-500 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
        <div className="absolute top-4 right-6 flex items-center gap-2 z-10">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="h-4 w-4" /> Access Granted
          </span>
        </div>
        <CardContent className="space-y-6 px-8 pb-10 pt-10">
          <h3 className="font-bold text-3xl text-white mb-6 tracking-tight flex items-center gap-3">
            <LockKeyhole className="h-6 w-6 text-emerald-400" />
            {document.title}
          </h3>
          <div
            className="prose prose-invert max-w-none text-base leading-relaxed bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-8 shadow-inner text-white [&_*]:!text-white [&_a]:!text-cyan-400 [&_a:hover]:!text-cyan-300"
            dangerouslySetInnerHTML={{ __html: document.description }}
          />
          {document.imageUrl && document.imageUrl.trim() && document.imageUrl !== 'about:blank' && !/800x600/.test(document.imageUrl) ? (
            <div className="relative w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 p-2">
              <Image
                src={document.imageUrl}
                alt="Secure document"
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'contain' }}
                data-ai-hint={document.imageHint}
                className="transition-all duration-300 hover:scale-[1.02] rounded-lg"
                priority
              />
            </div>
          ) : null}
          {document.attachmentFilename && document.attachmentDataUri && (
            <a
              href={document.attachmentDataUri}
              download={document.attachmentFilename}
              className="block mt-8"
            >
              <Button variant="outline" className="w-full h-12 bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 font-semibold shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all">
                <Download className="mr-2 h-5 w-5" />
                Download Secure Attachment
              </Button>
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SecureLinkPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [unlockedContent, setUnlockedContent] = useState<VerifyPinOutput['document'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailMeta, setEmailMeta] = useState<Email | null>(null);
  const params = useParams();
  const token = params.token as string;

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError("Invalid link. No token provided.");
        setIsLoading(false);
        return;
      }
      try {
        const email = await data.emails.findByToken(token);
        if (!email) {
          setError("Invalid or expired link.");
          setIsLoading(false);
          return;
        }
        if (email.revoked) {
          setError("This secure link has been revoked by the sender.");
          setIsLoading(false);
          return;
        }
        if (email.expiresAt && (email.expiresAt as Timestamp).toDate() < new Date()) {
          setError("This secure link has expired.");
          setIsLoading(false);
          return;
        }

        setEmailMeta(email);
      } catch (err) {
        setError("An unexpected error occurred while verifying the link.");
      } finally {
        setIsLoading(false);
      }
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setIsLoading(true);
    try {
      const result = await verifyPinAndGetContent({ token, pin });
      if (result.success) {
        setUnlockedContent(result.document ?? null);
        window.dispatchEvent(new Event('refresh-logs'));
      } else {
        setError(result.error || "An unknown error occurred.");
      }
    } catch (err) {
      setError("Failed to verify PIN. Please try again later.");
    } finally {
      setIsLoading(false);
      setPin("");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center z-10 relative space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium animate-pulse">Decrypting secure channel...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Card className="w-full max-w-md text-center bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
          <CardHeader className="pt-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="pb-8 px-6">
            <p className="text-zinc-400 text-lg">{error}</p>
          </CardContent>
        </Card>
      )
    }

    if (unlockedContent) {
      return <UnlockedContentDisplay document={unlockedContent} />;
    }

    if (emailMeta) {
      return (
        <Card className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <LockKeyhole className="h-8 w-8 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">Secure Access</CardTitle>
            <CardDescription className="text-zinc-400 mt-2">Enter your 6-digit PIN to decrypt the protected content.</CardDescription>
          </CardHeader>
          <CardContent className="px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="pin" className="text-zinc-300 font-medium">6-Digit PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  placeholder="••••••"
                  className="text-center text-2xl tracking-[0.7em] bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-700 focus-visible:ring-cyan-500 h-14 font-mono"
                  required
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <ShieldX className="h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all h-12 text-md" disabled={isLoading || !pin || pin.length < 6}>
                {isLoading ? 'Decrypting...' : 'Unlock Content'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-xs text-zinc-500 pb-6 px-6 pt-6">
            <div className="w-full flex items-center justify-center gap-1.5 opacity-60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <p>This link is secure. Do not share.</p>
            </div>
          </CardFooter>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4 relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full max-w-xl h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="absolute top-8 flex items-center gap-3 z-10 bg-zinc-950/50 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-800/50">
        <GuardianMailLogo className="h-6 w-6 text-cyan-400" />
        <span className="text-lg font-bold text-white tracking-tight">BeaconMail</span>
      </div>

      {renderContent()}
    </div>
  );
}
