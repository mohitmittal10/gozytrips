// Dialog component warning user before discarding unsaved work
import React from 'react';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AiArchitectBackConfirmDialogProps {
  showBackConfirm: boolean;
  setShowBackConfirm: (show: boolean) => void;
  setItinerary: (itinerary: null) => void;
  setIsEditing: (editing: boolean) => void;
  handleSaveItinerary: () => Promise<void>;
}

export function AiArchitectBackConfirmDialog({
  showBackConfirm,
  setShowBackConfirm,
  setItinerary,
  setIsEditing,
  handleSaveItinerary
}: AiArchitectBackConfirmDialogProps) {
  return (
    <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
      <AlertDialogContent className="glass-panel border-white/10 bg-black/90 text-white max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto z-[60]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <AlertCircle className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">Unsaved Journey</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-zinc-400 text-sm leading-relaxed">
            You're about to return to the architect form. Would you like to save this itinerary first? Unsaved changes in Architect Mode will be permanently lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <button
              onClick={() => {
                setItinerary(null);
                setIsEditing(false);
                setShowBackConfirm(false);
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
            >
              Discard
            </button>
            <AlertDialogAction
              onClick={async () => {
                await handleSaveItinerary();
                setItinerary(null);
                setIsEditing(false);
                setShowBackConfirm(false);
              }}
              className="flex-1 aurora-gradient border-none text-white text-xs font-bold uppercase tracking-widest h-10"
            >
              Save & Exit
            </AlertDialogAction>
            <AlertDialogCancel className="sm:hidden text-zinc-500 border-none hover:text-zinc-300 bg-transparent">
              Cancel
            </AlertDialogCancel>
          </div>
        </AlertDialogFooter>
        <AlertDialogCancel className="hidden sm:block absolute top-4 right-4 text-zinc-500 border-none hover:text-zinc-300 bg-transparent">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
