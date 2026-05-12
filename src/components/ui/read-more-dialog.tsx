import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReadMoreDialogProps {
  title: string;
  content: string;
  triggerText?: string;
  maxLength?: number;
}

export function ReadMoreDialog({ title, content, triggerText = "Read more", maxLength = 30 }: ReadMoreDialogProps) {
  if (!content) return null;

  const isTruncated = content.length > maxLength;
  const displayText = isTruncated ? content.slice(0, maxLength) + "..." : content;

  if (!isTruncated) {
    return <span className="text-zinc-300">{content}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-zinc-300">{displayText}</span>
      <Dialog>
        <DialogTrigger className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors shrink-0">
          {triggerText}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-white">{title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 mt-4 space-y-4 text-zinc-300 whitespace-pre-wrap">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
