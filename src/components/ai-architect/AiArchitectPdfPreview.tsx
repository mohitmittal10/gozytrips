// Thin wrapper over PdfPreviewEditor hiding complex dependencies from orchestrator
import React from 'react';
import { PdfPreviewEditor } from "@/components/pdf-preview-editor";
import { useAuth } from "@/contexts/auth-context";

interface AiArchitectPdfPreviewProps {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  itinerary: any;
  hotels: any[];
  flights: any[];
  pricing: any;
  baseCost: number;
  tripTitle: string;
}

export function AiArchitectPdfPreview({
  isPreviewOpen,
  setIsPreviewOpen,
  itinerary,
  hotels,
  flights,
  pricing,
  baseCost,
  tripTitle,
}: AiArchitectPdfPreviewProps) {
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
      }}
      initialTheme="classic"
      filename="WanderLabs_Itinerary.pdf"
    />
  );
}
