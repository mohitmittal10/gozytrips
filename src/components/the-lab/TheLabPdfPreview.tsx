// Thin wrapper over PdfPreviewEditor hiding complex dependencies from orchestrator
import React from 'react';
import { PdfPreviewEditor } from "@/components/pdf-preview-editor";
import { useAuth } from "@/contexts/auth-context";
import { type PdfTheme } from "@/components/pdf-template";

interface TheLabPdfPreviewProps {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  itinerary: any;
  hotels: any[];
  flights: any[];
  pricing: any;
  baseCost: number;
  tripTitle: string;
  clientName?: string;
  showTimestamps?: boolean;
  showPrices?: boolean;
  inclusions?: string;
  exclusions?: string;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  paymentMethods?: string;
  agencySettings?: any;
  itineraryId?: string | null;
  pdfOverrides?: any;
  onPdfOverridesChange?: (overrides: any) => void;
  theme?: PdfTheme;
  onThemeChange?: (theme: PdfTheme) => void;
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
  clientName,
  showTimestamps,
  showPrices,
  inclusions,
  exclusions,
  termsAndConditions,
  cancellationPolicy,
  paymentMethods,
  agencySettings,
  itineraryId,
  pdfOverrides,
  onPdfOverridesChange,
  theme,
  onThemeChange,
}: TheLabPdfPreviewProps) {
  const { userProfile } = useAuth();

  return (
    <PdfPreviewEditor
      isOpen={isPreviewOpen}
      onOpenChange={setIsPreviewOpen}
      templateProps={{
        itinerary,
        title: tripTitle,
        clientName,
        userProfile,
        hotels,
        flights,
        pricing,
        baseCost,
        showTimestamps,
        showPrices,
        inclusions,
        exclusions,
        termsAndConditions,
        cancellationPolicy,
        paymentMethods,
        agencySettings,
      }}
      initialTheme={theme}
      theme={theme}
      onThemeChange={onThemeChange}
      itineraryId={itineraryId || undefined}
      pdfOverrides={pdfOverrides}
      onPdfOverridesChange={onPdfOverridesChange}
      filename="WanderLabs_Itinerary.pdf"
    />
  );
}


