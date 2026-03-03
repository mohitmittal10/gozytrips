"use client";

import { useState, useEffect } from "react";
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

interface ClientDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    client?: Client | null;
    onSave: (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
}

export function ClientDialog({ isOpen, onOpenChange, client, onSave }: ClientDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        notes: "",
        tags: "",
    });

    useEffect(() => {
        if (isOpen) {
            if (client) {
                setFormData({
                    name: client.name || "",
                    email: client.email || "",
                    phone: client.phone || "",
                    notes: client.notes || "",
                    tags: client.tags ? client.tags.join(", ") : "",
                });
            } else {
                setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    notes: "",
                    tags: "",
                });
            }
        }
    }, [client, isOpen]);

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
                tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            });
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
                            <Label htmlFor="tags">Tags (comma separated)</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                placeholder="e.g. VIP, Honeymoon, Warm Lead"
                            />
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
