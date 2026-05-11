import { useState, useCallback } from "react";
import { generateVendorEnquiry, VendorEnquiryInput } from "@/ai/flows/generate-vendor-enquiry";
import { useToast } from "@/hooks/use-toast";

interface UseVendorEnquiryAiProps {
  onGenerateSuccess?: (result: { subject: string; body: string }) => Promise<void>;
}

export function useVendorEnquiryAi({ onGenerateSuccess }: UseVendorEnquiryAiProps = {}) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async (input: VendorEnquiryInput) => {
    setIsGenerating(true);
    try {
      const result = await generateVendorEnquiry(input);
      setGeneratedSubject(result.subject);
      setGeneratedBody(result.body);
      setIsEditing(false);

      if (onGenerateSuccess) {
        await onGenerateSuccess(result);
      }

      toast({ title: "Email Generated!", description: "Review and save or send via Gmail." });
      return result;
    } catch (err: any) {
      console.error("Vendor enquiry generation failed:", err);
      toast({ 
        variant: "destructive", 
        title: "Generation Failed", 
        description: err.message || "Failed to generate email." 
      });
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [toast, onGenerateSuccess]);

  const handleCopy = useCallback(() => {
    const fullEmail = `Subject: ${generatedSubject}\n\n${generatedBody}`;
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Email copied to clipboard." });
  }, [generatedSubject, generatedBody, toast]);

  const resetAiState = useCallback(() => {
    setGeneratedSubject("");
    setGeneratedBody("");
    setIsEditing(false);
    setCopied(false);
  }, []);

  return {
    isGenerating,
    generatedSubject,
    setGeneratedSubject,
    generatedBody,
    setGeneratedBody,
    isEditing,
    setIsEditing,
    copied,
    handleGenerate,
    handleCopy,
    resetAiState
  };
}

