// Thin wrapper over PdfPreviewEditor hiding complex dependencies from orchestrator
import React from 'react';
import { PdfPreviewEditor } from "@/components/pdf-preview-editor";
import { useAuth } from "@/contexts/auth-context";

interface TheLabPdfPreviewProps {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  itinerary: any;
  hotels: any[];
  flights: any[];
  pricing: any;
  baseCost: number;
  tripTitle: string;
  showTimestamps?: boolean;
  showPrices?: boolean;
  inclusions?: string;
  exclusions?: string;
  agencySettings?: any;
}

export function TheLabPdfPreview({
  isPreviewOpen,
  setIsPreviewOpen,
  itinerary,
  hotels,
  flights,
  pricing,
  baseCost,
  tripTitle,
  showTimestamps,
  showPrices,
  inclusions,
  exclusions,
  agencySettings,
}: TheLabPdfPreviewProps) {
  const { userProfile } = useAuth();

  return (
    <PdfPreviewEditor
      isOpen={isPreviewOpen}
      onOpenChange={setIsPreviewOpen}
      templateProps={{
        itinerary,
        title: tripTitle,
        userProfile,
        hotels,
        flights,
        pricing,
        baseCost,
        showTimestamps,
        showPrices,
        inclusions,
        exclusions,
        agencySettings,
      }}
      initialTheme="classic"
      filename="WanderLabs_Itinerary.pdf"
    />
  );
}


