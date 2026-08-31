"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { type Client } from "@/lib/hooks/use-clients";
import { useFormDraft } from "@/hooks/use-form-draft";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  clientFormSchema,
  formatPhoneInput,
  getSuggestedEmail,
  type ClientFormValues,
} from "@/lib/security/form-validation";
import { sanitizeTags } from "@/lib/security/input-sanitizer";
import { cn } from "@/lib/utils";

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
}

export function ClientDialog({ isOpen, onOpenChange, client, onSave }: ClientDialogProps) {
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [hasFailedSubmit, setHasFailedSubmit] = useState(false);
  const [dbClient, setDbClient] = useState<Client | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      tags: [],
    },
  });

  const formKey = isOpen && !client ? "client:new" : null;

  const { saveDraft, clearDraft } = useFormDraft<ClientFormValues>(
    formKey,
    { name: "", email: "", phone: "", notes: "", tags: [] },
    (draftData) => {
      form.reset(draftData);
    }
  );

  // Fetch latest client details from DB when opening to edit
  useEffect(() => {
    if (!isOpen || !client?.id) {
      setDbClient(null);
      return;
    }

    const fetchLatestClient = async () => {
      setIsLoadingDb(true);
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", client.id)
          .single();
        if (data && !error) {
          setDbClient({
            ...data,
            tags: data.tags || []
          });
        }
      } catch (err) {
        console.error("Error fetching client from db:", err);
      } finally {
        setIsLoadingDb(false);
      }
    };

    fetchLatestClient();
  }, [client?.id, isOpen, supabase]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTagInput("");
    setHasFailedSubmit(false);
    
    const targetClient = dbClient || client;
    form.reset(
      targetClient
        ? {
            name: targetClient.name || "",
            email: targetClient.email || "",
            phone: targetClient.phone || "",
            notes: targetClient.notes || "",
            tags: targetClient.tags ? [...targetClient.tags] : [],
          }
        : { name: "", email: "", phone: "", notes: "", tags: [] }
    );
  }, [client, dbClient, isOpen, form]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const subscription = form.watch((values) => {
      saveDraft({
        name: values.name ?? "",
        email: values.email ?? "",
        phone: values.phone ?? "",
        notes: values.notes ?? "",
        tags: (values.tags ?? []).filter((tag): tag is string => tag !== undefined),
      });
    });

    return () => subscription.unsubscribe();
  }, [form, isOpen, saveDraft]);

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    const nextTag = tagInput.trim();

    if (!nextTag) {
      return;
    }

    if (!/^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s-]{0,29}$/u.test(nextTag)) {
      toast({
        variant: "destructive",
        title: "Invalid tag",
        description: "Use letters, numbers, spaces, and hyphens only.",
      });
      return;
    }

    const currentTags = form.getValues("tags") || [];
    if (currentTags.map((tag) => tag.toLowerCase()).includes(nextTag.toLowerCase())) {
      setTagInput("");
      return;
    }

    form.setValue("tags", sanitizeTags([...currentTags, nextTag]), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter((tag) => tag !== tagToRemove),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const handleSubmit = async (values: ClientFormValues) => {
    try {
      await onSave({
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        notes: values.notes || null,
        tags: sanitizeTags(values.tags || []),
      });

      await clearDraft();
      form.reset({ name: "", email: "", phone: "", notes: "", tags: [] });
      setTagInput("");
      setHasFailedSubmit(false);
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to save client:", error);
      toast({
        variant: "destructive",
        title: "Error saving client",
        description:
          error instanceof Error
            ? error.message
            : "There was a problem saving the client. Please try again.",
      });
    }
  };

  const tags = form.watch("tags") || [];
  const watchedEmail = form.watch("email");
  const emailSuggestion = useMemo(() => getSuggestedEmail(watchedEmail), [watchedEmail]);
  const formErrors = Object.values(form.formState.errors)
    .map((issue) => issue?.message)
    .filter((message): message is string => Boolean(message));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c0c0e] border-zinc-800 text-white sm:max-w-[425px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, () => setHasFailedSubmit(true))} noValidate>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">{client ? "Edit Client" : "Add New Client"}</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                {client
                  ? "Update the details for this client."
                  : "Enter the details for your new client or lead."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {form.formState.submitCount > 0 && formErrors.length > 1 && (
                <Alert className="border-amber-500/30 bg-amber-500/10" aria-live="polite">
                  <AlertCircle className="h-4 w-4 text-amber-300" />
                  <AlertTitle className="text-sm font-semibold text-white">Please check the highlighted fields</AlertTitle>
                  <AlertDescription className="text-xs text-slate-300">
                    {formErrors.map((message, index) => (
                      <p key={`${message}-${index}`}>{message}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-300 text-sm font-medium">Name *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Client's full name"
                            maxLength={100}
                            {...field}
                            className={cn(
                              "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20",
                              showSuccess && "border-emerald-500/40 pr-10"
                            )}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                        )}
                      </div>
                      <FormMessage className="text-xs text-rose-400 font-medium" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-300 text-sm font-medium">Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="client@example.com"
                            maxLength={254}
                            {...field}
                            className={cn(
                              "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20",
                              showSuccess && "border-emerald-500/40 pr-10"
                            )}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                        )}
                      </div>
                      {!fieldState.error && emailSuggestion && emailSuggestion !== field.value && (
                        <FormDescription className="text-xs text-amber-400 font-medium">
                          Did you mean{" "}
                          <button
                            type="button"
                            className="underline hover:text-amber-300 transition-colors"
                            onClick={() =>
                              form.setValue("email", emailSuggestion, {
                                shouldValidate: true,
                                shouldTouch: true,
                              })
                            }
                          >
                            {emailSuggestion}
                          </button>
                          ?
                        </FormDescription>
                      )}
                      <FormMessage className="text-xs text-rose-400 font-medium" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-300 text-sm font-medium">Phone</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+91 98765 43210"
                            maxLength={24}
                            {...field}
                            onChange={(event) =>
                              field.onChange(formatPhoneInput(event.target.value))
                            }
                            className={cn(
                              "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20",
                              showSuccess && "border-emerald-500/40 pr-10"
                            )}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                        )}
                      </div>
                      <FormDescription className="text-xs text-slate-400 leading-normal">
                        International numbers are welcome. We keep your formatting while cleaning unsafe characters.
                      </FormDescription>
                      <FormMessage className="text-xs text-rose-400 font-medium" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <div className="space-y-1.5">
                <FormLabel className="text-slate-300 text-sm font-medium">Tags</FormLabel>
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value.slice(0, 30))}
                  onKeyDown={handleAddTag}
                  placeholder="Type and press Enter or comma to add"
                  maxLength={30}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                />
                <p className="text-xs text-slate-400">
                  Letters, numbers, spaces, hyphens only. Max 20 tags.
                </p>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={`${tag}-${index}`}
                        variant="secondary"
                        className="flex items-center gap-1 border-primary/20 bg-primary/20 text-primary hover:bg-primary/30 text-xs py-0.5 px-2"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {tag}</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field, fieldState }) => {
                  const showSuccess =
                    fieldState.isTouched && !fieldState.error && field.value.trim().length > 0;

                  return (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-slate-300 text-sm font-medium">Notes</FormLabel>
                        <span
                          className={cn(
                            "text-xs text-slate-400",
                            field.value.length > 900 && "text-amber-500"
                          )}
                        >
                          {field.value.length}/1000
                        </span>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder="Any special requirements or context..."
                            rows={3}
                            maxLength={1000}
                            {...field}
                            className={cn(
                              "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-purple-500/20",
                              showSuccess && "border-emerald-500/40 pr-10"
                            )}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-4 h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <FormDescription className="text-xs text-slate-400 leading-normal">
                        This field validates on blur and blocks script-like, database-style, and prompt-injection text.
                      </FormDescription>
                      <FormMessage className="text-xs text-rose-400 font-medium" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || (hasFailedSubmit && !form.formState.isValid)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-semibold"
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
