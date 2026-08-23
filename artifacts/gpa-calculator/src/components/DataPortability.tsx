import React, { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileJson, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useGpaActions } from "@/hooks/useGpaActions";
import { createCsvExport, parseRecordBackup, serializeRecordBackup } from "@/lib/portable-record";
import { useGpaStore, type Semester } from "@/lib/store";

interface ImportCandidate {
  fileName: string;
  semesters: Semester[];
  warnings: string[];
}

type Status =
  | { type: "success" | "error" | "info"; message: string }
  | null;

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DataPortability() {
  const semesters = useGpaStore((state) => state.semesters);
  const { isAuthenticated } = useAuth();
  const { importSemesters } = useGpaActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<ImportCandidate | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [isWorking, setIsWorking] = useState(false);

  const exportJson = () => {
    downloadTextFile(
      `sust-gpa-backup-${new Date().toISOString().slice(0, 10)}.json`,
      serializeRecordBackup(semesters),
      "application/json;charset=utf-8",
    );
    setStatus({ type: "success", message: "JSON backup downloaded." });
  };

  const exportCsv = () => {
    downloadTextFile(
      `sust-gpa-record-${new Date().toISOString().slice(0, 10)}.csv`,
      createCsvExport(semesters),
      "text/csv;charset=utf-8",
    );
    setStatus({ type: "success", message: "CSV record downloaded." });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setStatus(null);
    try {
      const parsed = parseRecordBackup(await file.text());
      const nextCandidate = {
        fileName: file.name,
        semesters: parsed.backup.semesters,
        warnings: parsed.warnings,
      };

      if (isAuthenticated) {
        setCandidate(nextCandidate);
      } else {
        setIsWorking(true);
        await importSemesters(nextCandidate.semesters);
        setStatus({ type: "success", message: `Imported ${nextCandidate.semesters.length} ${nextCandidate.semesters.length === 1 ? "semester" : "semesters"} into this browser.` });
      }
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "We could not read that backup file." });
    } finally {
      setIsWorking(false);
    }
  };

  const applyImport = async () => {
    if (!candidate) return;
    setIsWorking(true);
    setStatus({ type: "info", message: "Replacing your cloud record…" });
    try {
      await importSemesters(candidate.semesters);
      setStatus({ type: "success", message: `Imported ${candidate.semesters.length} ${candidate.semesters.length === 1 ? "semester" : "semesters"} to your cloud record.` });
      setCandidate(null);
    } catch {
      setStatus({ type: "error", message: "The backup could not be imported. Your record may be partially updated; reload to refresh it." });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileChange} aria-label="Import SUST GPA JSON backup" />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isWorking}
        className="h-10 rounded-xl border-border/80 bg-card px-3 text-xs font-bold sm:text-sm"
      >
        {isWorking ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={exportJson} className="h-10 rounded-xl border-border/80 bg-card px-3 text-xs font-bold sm:text-sm">
        <FileJson className="mr-1.5 h-4 w-4 text-primary" />
        JSON
      </Button>
      <Button variant="ghost" size="sm" onClick={exportCsv} className="h-10 rounded-xl px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground sm:px-3 sm:text-sm">
        <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
        CSV
      </Button>

      {status && (
        <div className={`basis-full flex items-center gap-1.5 text-xs font-semibold ${status.type === "error" ? "text-red-600 dark:text-red-300" : status.type === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`} role="status" aria-live="polite">
          {status.type === "error" ? <AlertCircle className="h-3.5 w-3.5 shrink-0" /> : status.type === "success" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
          {status.message}
        </div>
      )}

      <AlertDialog open={Boolean(candidate)} onOpenChange={(open) => { if (!open && !isWorking) setCandidate(null); }}>
        <AlertDialogContent className="rounded-2xl border-border bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Replace your cloud record?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              <span className="font-semibold text-foreground">{candidate?.fileName}</span> contains {candidate?.semesters.length ?? 0} {candidate?.semesters.length === 1 ? "semester" : "semesters"}. Importing it will delete your current cloud semesters and recreate the backup contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {candidate?.warnings.length ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
              {candidate.warnings.slice(0, 2).join(" ")}{candidate.warnings.length > 2 ? ` + ${candidate.warnings.length - 2} more note(s).` : ""}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking} className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isWorking} onClick={() => void applyImport()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isWorking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Replace and import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
