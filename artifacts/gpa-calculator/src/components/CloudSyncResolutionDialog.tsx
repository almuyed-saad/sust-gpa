import { AlertTriangle, Cloud, GitCompareArrows, HardDrive, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { SyncConflict } from "@/hooks/useCloudSyncResolution";
import type { SyncChoice } from "@/lib/sync-resolution";

interface CloudSyncResolutionDialogProps {
  conflict: SyncConflict | null;
  isWorking: boolean;
  error: string | null;
  onResolve: (choice: SyncChoice) => void;
}

function recordSummary(label: string, icon: React.ReactNode, semesters: SyncConflict["local"]) {
  const courses = semesters.reduce((total, semester) => total + semester.courses.length, 0);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{semesters.length} {semesters.length === 1 ? "semester" : "semesters"} · {courses} {courses === 1 ? "course" : "courses"}</span>
      </span>
    </div>
  );
}

export function CloudSyncResolutionDialog({ conflict, isWorking, error, onResolve }: CloudSyncResolutionDialogProps) {
  return (
    <AlertDialog open={Boolean(conflict)} onOpenChange={(open) => { if (!open && !isWorking) onResolve("keep-local"); }}>
      <AlertDialogContent className="max-w-lg rounded-2xl border-border bg-card text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            Choose how to sync your records
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            We found academic records in this browser and in your cloud account. Nothing has been changed yet. Choose what you want to keep.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 sm:grid-cols-2">
          {conflict && recordSummary("This browser", <HardDrive className="h-4 w-4" />, conflict.local)}
          {conflict && recordSummary("Cloud account", <Cloud className="h-4 w-4" />, conflict.remote)}
        </div>

        <div className="grid gap-2" aria-label="Sync choices">
          <Button type="button" variant="outline" disabled={isWorking} onClick={() => onResolve("merge")} className="h-auto justify-start gap-3 rounded-xl border-primary/30 bg-primary/5 px-3 py-3 text-left text-foreground hover:bg-primary/10">
            <GitCompareArrows className="h-4 w-4 shrink-0 text-primary" />
            <span><span className="block text-sm font-bold">Merge both records</span><span className="block text-xs font-normal text-muted-foreground">Combine semesters and avoid duplicate matching courses.</span></span>
          </Button>
          <Button type="button" variant="outline" disabled={isWorking} onClick={() => onResolve("local")} className="h-auto justify-start gap-3 rounded-xl border-border px-3 py-3 text-left text-foreground hover:bg-muted">
            <HardDrive className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span><span className="block text-sm font-bold">Use this browser’s records</span><span className="block text-xs font-normal text-muted-foreground">Replace the cloud record with what is currently here.</span></span>
          </Button>
          <Button type="button" variant="outline" disabled={isWorking} onClick={() => onResolve("cloud")} className="h-auto justify-start gap-3 rounded-xl border-border px-3 py-3 text-left text-foreground hover:bg-muted">
            <Cloud className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span><span className="block text-sm font-bold">Use the cloud record</span><span className="block text-xs font-normal text-muted-foreground">Replace the browser record with your synced data.</span></span>
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-xs leading-5 text-amber-800 dark:text-amber-200" role="note">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Keep browser only leaves your local records untouched and does not upload them.</span>
        </div>

        {error && <p className="text-sm font-semibold text-red-600 dark:text-red-300" role="alert">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking} className="border-border text-foreground hover:bg-muted">Keep browser only</AlertDialogCancel>
          {isWorking && <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Syncing…</span>}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
