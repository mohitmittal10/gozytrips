"use client";

import { useState, useEffect } from "react";
import { useFormDraft } from "@/hooks/use-form-draft";
import { type Client } from "@/lib/hooks/use-clients";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    client?: Client | null;
    onSave: (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
}

export function ClientDialog({ isOpen, onOpenChange, client, onSave }: ClientDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        phone: string;
        notes: string;
        tags: string[];
    }>({
        name: "",
        email: "",
        phone: "",
        notes: "",
        tags: [],
    });

    const formKey = isOpen ? (client ? `client:${client.id}` : "client:new") : null;

    const { saveDraft, clearDraft } = useFormDraft(
        formKey,
        client ? {
            name: client.name || "",
            email: client.email || "",
            phone: client.phone || "",
            notes: client.notes || "",
            tags: client.tags ? [...client.tags] : [],
        } : {
            name: "",
            email: "",
            phone: "",
            notes: "",
            tags: [],
        },
        (draftData) => {
            setFormData(draftData);
        }
    );

    useEffect(() => {
        if (isOpen) {
            setTagInput("");
            if (client) {
                setFormData({
                    name: client.name || "",
                    email: client.email || "",
                    phone: client.phone || "",
                    notes: client.notes || "",
                    tags: client.tags ? [...client.tags] : [],
                });
            } else {
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    notes: "",
                    tags: [],
                });
            }
        }
    }, [client, isOpen]);

    // Save draft whenever formData changes
    useEffect(() => {
        if (isOpen) {
            saveDraft(formData);
        }
    }, [formData, isOpen, saveDraft]);

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !formData.tags.includes(newTag)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                setTagInput("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSubmitting(true);
        try {
            await onSave({
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                notes: formData.notes || null,
                tags: formData.tags,
            });
            await clearDraft();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save client:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
                        <DialogDescription>
                            {client
                                ? "Update the details for this client."
                                : "Enter the details for your new client/lead."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Client's full name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="client@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <div className="flex flex-col gap-2">
                                <Input
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder="Type and press Enter or comma to add"
                                />
                                {formData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.tags.map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="flex items-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary border-primary/20">
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
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Any special requirements or context..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
                            {isSubmitting ? "Saving..." : "Save Client"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
