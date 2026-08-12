// Thin wrapper over PdfPreviewEditor — forwards ref so parent can call preRender()
import React, { forwardRef } from 'react';
import { PdfPreviewEditor, type PdfPreviewEditorRef } from "@/components/pdf-preview-editor";
import { useAuth } from "@/contexts/auth-context";
import { type PdfTheme } from "@/components/pdf-template";

interface TheLabPdfPreviewProps {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  itinerary: any;
  hotels: any[];
  flights: any[];
  cabs?: any[];
  buses?: any[];
  pricing: any;
  baseCost: number;
  tripTitle: string;
  clientName?: string;
  showTimestamps?: boolean;
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

export const TheLabPdfPreview = forwardRef<PdfPreviewEditorRef, TheLabPdfPreviewProps>(
  function TheLabPdfPreview(
    {
      isPreviewOpen,
      setIsPreviewOpen,
      itinerary,
      hotels,
      flights,
      cabs,
      buses,
      pricing,
      baseCost,
      tripTitle,
      clientName,
      showTimestamps,
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
    },
    ref
  ) {
    const { userProfile } = useAuth();

    return (
      <PdfPreviewEditor
        ref={ref}
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        templateProps={{
          itinerary,
          title: tripTitle,
          clientName,
          userProfile,
          hotels,
          flights,
          cabs,
          buses,
          pricing,
          baseCost,
          showTimestamps,
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
);
