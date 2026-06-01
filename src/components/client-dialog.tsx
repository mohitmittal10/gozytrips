"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { type Client } from "@/lib/hooks/use-clients";
import { useFormDraft } from "@/hooks/use-form-draft";
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

  const formKey = isOpen ? (client ? `client:${client.id}` : "client:new") : null;

  const { saveDraft, clearDraft } = useFormDraft(
    formKey,
    client
      ? {
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          notes: client.notes || "",
          tags: client.tags ? [...client.tags] : [],
        }
      : { name: "", email: "", phone: "", notes: "", tags: [] },
    (draftData) => {
      form.reset(draftData);
    }
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTagInput("");
    setHasFailedSubmit(false);
    form.reset(
      client
        ? {
            name: client.name || "",
            email: client.email || "",
            phone: client.phone || "",
            notes: client.notes || "",
            tags: client.tags ? [...client.tags] : [],
          }
        : { name: "", email: "", phone: "", notes: "", tags: [] }
    );
  }, [client, isOpen, form]);

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
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit, () => setHasFailedSubmit(true))} noValidate>
            <DialogHeader>
              <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
              <DialogDescription>
                {client
                  ? "Update the details for this client."
                  : "Enter the details for your new client or lead."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {form.formState.submitCount > 0 && formErrors.length > 1 && (
                <Alert className="border-amber-500/30 bg-amber-500/10" aria-live="polite">
                  <AlertCircle className="h-4 w-4 text-amber-300" />
                  <AlertTitle>Please check the highlighted fields</AlertTitle>
                  <AlertDescription>
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
                      <FormLabel>Name *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Client's full name"
                            maxLength={100}
                            {...field}
                            className={cn(showSuccess && "border-emerald-500/40 pr-10")}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                        )}
                      </div>
                      <FormMessage className="text-xs" aria-live="polite" />
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
                      <FormLabel>Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="client@example.com"
                            maxLength={254}
                            {...field}
                            className={cn(showSuccess && "border-emerald-500/40 pr-10")}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                        )}
                      </div>
                      {!fieldState.error && emailSuggestion && emailSuggestion !== field.value && (
                        <FormDescription className="text-xs text-amber-600">
                          Did you mean{" "}
                          <button
                            type="button"
                            className="underline"
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
                      <FormMessage className="text-xs" aria-live="polite" />
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
                      <FormLabel>Phone</FormLabel>
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
                            className={cn(showSuccess && "border-emerald-500/40 pr-10")}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                        )}
                      </div>
                      <FormDescription className="text-xs">
                        International numbers are welcome. We keep your formatting while cleaning unsafe characters.
                      </FormDescription>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />

              <div className="space-y-1.5">
                <FormLabel>Tags</FormLabel>
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value.slice(0, 30))}
                  onKeyDown={handleAddTag}
                  placeholder="Type and press Enter or comma to add"
                  maxLength={30}
                />
                <p className="text-[10px] text-muted-foreground">
                  Letters, numbers, spaces, hyphens only. Max 20 tags.
                </p>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={`${tag}-${index}`}
                        variant="secondary"
                        className="flex items-center gap-1 border-primary/20 bg-primary/20 text-primary hover:bg-primary/30"
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
                        <FormLabel>Notes</FormLabel>
                        <span
                          className={cn(
                            "text-[10px] text-muted-foreground",
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
                            className={cn(showSuccess && "border-emerald-500/40 pr-10")}
                          />
                        </FormControl>
                        {showSuccess && (
                          <CheckCircle2 className="absolute right-3 top-4 h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <FormDescription className="text-xs">
                        This field validates on blur and blocks script-like, database-style, and prompt-injection text.
                      </FormDescription>
                      <FormMessage className="text-xs" aria-live="polite" />
                    </FormItem>
                  );
                }}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || (hasFailedSubmit && !form.formState.isValid)}
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
