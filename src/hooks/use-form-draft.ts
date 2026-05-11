"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

/**
 * A hook to persist form state to Supabase to prevent data loss on refresh.
 * 
 * @param formKey A unique key for the form (e.g., 'client:new', 'profile')
 * @param initialData The initial data for the form (saved state)
 * @param onRestore Callback when a draft is successfully restored
 */
export function useFormDraft<T>(
    formKey: string | null,
    initialData: T,
    onRestore?: (data: T) => void
) {
    const { user } = useAuth();
    const supabase = createClient();
    const [isSaving, setIsSaving] = useState(false);
    const saveTimer = useRef<NodeJS.Timeout | null>(null);
    const lastSavedData = useRef<string>("");

    // Load draft on mount or when key changes
    useEffect(() => {
        if (!user || !formKey) return;

        const loadDraft = async () => {
            const { data, error } = await supabase
                .from("user_form_drafts")
                .select("data")
                .eq("user_id", user.id)
                .eq("form_key", formKey)
                .single();

            if (data && data.data && onRestore) {
                // Only restore if draft data is different from initial data
                const draftData = data.data as T;
                if (JSON.stringify(draftData) !== JSON.stringify(initialData)) {
                    onRestore(draftData);
                    lastSavedData.current = JSON.stringify(draftData);
                }
            }
        };

        loadDraft();
    }, [user, formKey, supabase]);

    // Save draft (debounced)
    const saveDraft = useCallback(async (data: T) => {
        if (!user || !formKey) return;

        const dataString = JSON.stringify(data);
        // Don't save if nothing changed
        if (dataString === lastSavedData.current || dataString === JSON.stringify(initialData)) {
            return;
        }

        if (saveTimer.current) clearTimeout(saveTimer.current);

        saveTimer.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                const { error } = await supabase
                    .from("user_form_drafts")
                    .upsert({
                        user_id: user.id,
                        form_key: formKey,
                        data: data as any,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "user_id,form_key" });

                if (!error) {
                    lastSavedData.current = dataString;
                }
            } catch (err) {
                console.error("Failed to save form draft:", err);
            } finally {
                setIsSaving(false);
            }
        }, 1000); // 1s debounce
    }, [user, formKey, supabase, initialData]);

    // Clear draft
    const clearDraft = useCallback(async () => {
        if (!user || !formKey) return;

        if (saveTimer.current) clearTimeout(saveTimer.current);

        try {
            await supabase
                .from("user_form_drafts")
                .delete()
                .eq("user_id", user.id)
                .eq("form_key", formKey);
            
            lastSavedData.current = "";
        } catch (err) {
            console.error("Failed to clear form draft:", err);
        }
    }, [user, formKey, supabase]);

    return { saveDraft, clearDraft, isSaving };
}

