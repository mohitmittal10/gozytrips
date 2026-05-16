"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudDownload, Rocket, AlertCircle, HardDrive, Upload } from "lucide-react";
import UniqueLoading from "./ui/morph-loading";
import { BackupService } from "@/services/backup";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface ImportBackupModalProps {
  isDataEmpty: boolean;
  onImportSuccess: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ImportBackupModal({ isDataEmpty, onImportSuccess, isOpen: externalOpen, onOpenChange }: ImportBackupModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalIsOpen;
  
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const [step, setStep] = useState<"welcome" | "loading" | "list" | "importing" | "error" | "success">("welcome");
  const [backups, setBackups] = useState<any[]>([]);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();
  const { userPreferences, updatePreferences, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hasCheckedPreferences, setHasCheckedPreferences] = useState(false);
  
  useEffect(() => {
    // Only automatically show if data is empty and they haven't dismissed it
    // Wait for auth and preferences to load
    if (authLoading || !userPreferences || hasCheckedPreferences) return;

    if (isDataEmpty && !userPreferences.backup_prompt_dismissed) {
      setIsOpen(true);
    }
    setHasCheckedPreferences(true);
  }, [isDataEmpty, userPreferences, authLoading, hasCheckedPreferences]);

  const handleDismiss = async () => {
    try {
      await updatePreferences({ backup_prompt_dismissed: true });
    } catch (err) {
      console.error("Failed to update preferences:", err);
    }
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
          await updatePreferences({ pending_import_backup: true });
          router.push("/api/google/auth");
          return;
        }
        throw new Error("Failed to authenticate with Google Drive.");
      }

      const { access_token } = await tokenRes.json();
      if (!access_token) throw new Error("No access token found.");

      const availableBackups = await BackupService.listBackups(access_token);
      
      if (availableBackups.length === 0) {
        setErrorMessage("No Wander Labs backups found in your Google Drive.");
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
      if (userPreferences?.pending_import_backup) {
        // Clear the intent first
        await updatePreferences({ pending_import_backup: false });
        setIsOpen(true);
        await handleConnectGoogle();
      }
    };
    if (!authLoading && userPreferences) {
      handleAuthReturn();
    }
  }, [userPreferences, authLoading]);

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
      
      await updatePreferences({ backup_prompt_dismissed: true });
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
          <DialogTitle>Welcome to Wander Labs</DialogTitle>
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
              <span>Drive Backup</span>
            </Button>
            <div className="col-span-2">
              <Button variant="outline" className="w-full h-16 flex flex-row items-center justify-center gap-3 border-dashed hover:bg-muted/50 transition-all group" onClick={() => document.getElementById('local-backup-upload')?.click()}>
                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <Upload className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Upload Local JSON</p>
                  <p className="text-[10px] text-gray-500">Import a .json backup file from your computer</p>
                </div>
              </Button>
              <input 
                id="local-backup-upload" 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setStep("loading");
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    setStep("importing");
                    await BackupService.restoreBackup(data);
                    
                    setStep("success");
                    toast({
                      title: "Import Successful",
                      description: "Your local data has been restored.",
                    });
                    
                    await updatePreferences({ backup_prompt_dismissed: true });
                    onImportSuccess();
                    
                    setTimeout(() => {
                      setIsOpen(false);
                    }, 3000);
                  } catch (err: any) {
                    console.error("Local restore error", err);
                    setErrorMessage(err.message || "Failed to parse or restore local backup.");
                    setStep("error");
                  }
                }}
              />
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-10">
            <UniqueLoading variant="morph" size="md" />
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
            <UniqueLoading variant="morph" size="md" />
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

