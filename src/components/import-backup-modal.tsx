"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudDownload, Rocket, Loader2, AlertCircle, HardDrive } from "lucide-react";
import { BackupService } from "@/lib/backup-service";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

interface ImportBackupModalProps {
  isDataEmpty: boolean;
  onImportSuccess: () => void;
}

export function ImportBackupModal({ isDataEmpty, onImportSuccess }: ImportBackupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"welcome" | "loading" | "list" | "importing" | "error" | "success">("welcome");
  const [backups, setBackups] = useState<any[]>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Only automatically show if data is empty and they haven't dismissed it
    const hasSeenPrompt = localStorage.getItem("hasSeenBackupPrompt");
    if (isDataEmpty && hasSeenPrompt !== "true") {
      setIsOpen(true);
    }
  }, [isDataEmpty]);

  const handleDismiss = () => {
    localStorage.setItem("hasSeenBackupPrompt", "true");
    setIsOpen(false);
  };

  const handleConnectGoogle = async () => {
    setStep("loading");
    setErrorMessage("");
    try {
      // Get the token first
      const tokenRes = await fetch("/api/google/token");
      
      if (!tokenRes.ok) {
        if (tokenRes.status === 404 || tokenRes.status === 401) {
          // If not configured or not authorized, redirect to auth
          localStorage.setItem("importBackupIntent", "true");
          router.push("/api/google/auth");
          return;
        }
        throw new Error("Failed to authenticate with Google Drive.");
      }

      const { access_token } = await tokenRes.json();
      if (!access_token) throw new Error("No access token found.");

      const availableBackups = await BackupService.listBackups(access_token);
      
      if (availableBackups.length === 0) {
        setErrorMessage("No GozyTrips backups found in your Google Drive.");
        setStep("error");
        return;
      }

      setBackups(availableBackups);
      setSelectedBackupId(availableBackups[0].id); // Select most recent by default
      setStep("list");

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred.");
      setStep("error");
    }
  };

  // If we came back from Google Auth intent
  useEffect(() => {
    const handleAuthReturn = async () => {
      if (localStorage.getItem("importBackupIntent") === "true") {
        localStorage.removeItem("importBackupIntent");
        setIsOpen(true);
        await handleConnectGoogle();
      }
    };
    handleAuthReturn();
  }, []);

  const handleImport = async () => {
    if (!selectedBackupId) return;
    
    setStep("importing");
    try {
      const tokenRes = await fetch("/api/google/token");
      const { access_token } = await tokenRes.json();
      
      const backupData = await BackupService.downloadBackup(access_token, selectedBackupId);
      
      await BackupService.restoreBackup(backupData);
      
      setStep("success");
      toast({
        title: "Import Successful",
        description: "Your data has been completely restored.",
      });
      
      localStorage.setItem("hasSeenBackupPrompt", "true");
      onImportSuccess(); // Refresh the application state
      
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
      
    } catch (err: any) {
      console.error("Restore error", err);
      setErrorMessage(err.message || "Failed to restore backup.");
      setStep("error");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && step !== 'importing') handleDismiss();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to GozyTrips</DialogTitle>
          <DialogDescription>
            {step === "welcome" && "It looks like your workspace is empty. You can start fresh or restore your data from a Google Drive backup."}
            {step === "loading" && "Connecting to Google Drive..."}
            {step === "list" && "Select a backup to restore from your Google Drive."}
            {step === "importing" && "Restoring your workspace..."}
            {step === "error" && "Something went wrong."}
            {step === "success" && "Welcome back!"}
          </DialogDescription>
        </DialogHeader>

        {step === "welcome" && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={handleDismiss}>
              <Rocket className="h-6 w-6 text-primary" />
              <span>Start Fresh</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 border-primary/50 hover:bg-primary/5" onClick={handleConnectGoogle}>
              <CloudDownload className="h-6 w-6 text-blue-500" />
              <span>Restore Backup</span>
            </Button>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Checking Google Drive...</p>
          </div>
        )}

        {step === "list" && (
          <div className="py-2">
            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
              <div className="flex flex-col gap-2">
                {backups.map((bkp) => (
                  <div 
                    key={bkp.id} 
                    onClick={() => setSelectedBackupId(bkp.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedBackupId === bkp.id ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}
                  >
                    <HardDrive className={`h-5 w-5 ${selectedBackupId === bkp.id ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{bkp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(bkp.createdTime), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">Restoring data... Please do not close this window.</p>
          </div>
        )}

        {step === "error" && (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CloudDownload className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-center">Data restored successfully.</p>
            <p className="text-xs text-muted-foreground mt-2">Refreshing dashboard...</p>
          </div>
        )}

        {/* Footer actions based on step */}
        {step === "error" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("welcome")}>Back</Button>
            <Button onClick={handleConnectGoogle}>Try Again</Button>
          </DialogFooter>
        )}
        
        {step === "list" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("welcome")}>Cancel</Button>
            <Button onClick={handleImport} disabled={!selectedBackupId}>Restore Selected</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
