"use client";

import { createClient } from "@/lib/supabase/client";

export type AuditActionType =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_TRIP"
  | "DELETE_TRIP"
  | "STATUS_CHANGE"
  | "CREATE_CLIENT"
  | "UPDATE_CLIENT"
  | "DELETE_CLIENT"
  | "EXPORT_CSV"
  | "EXPORT_PDF"
  | "UPDATE_PROFILE"
  | "VIEW_TRIP";

export type AuditEntityType = "itinerary" | "client" | "profile" | "session";

export interface AuditLog {
  id: string;
  user_id: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

/**
 * Log an action to the audit_logs table.
 * This is fire-and-forget so it doesn't block the UI.
 */
export async function logAuditEvent(
  userId: string,
  actionType: AuditActionType,
  description: string,
  options?: {
    entityType?: AuditEntityType;
    entityId?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const supabase = createClient();
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action_type: actionType,
      entity_type: options?.entityType || null,
      entity_id: options?.entityId || null,
      description,
      metadata: options?.metadata || {},
    });
  } catch (error) {
    // Audit logging should never break the app
    console.warn("Audit log failed:", error);
  }
}

/**
 * Fetch audit logs for the current user.
 */
export async function fetchAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    actionType?: AuditActionType;
  }
): Promise<AuditLog[]> {
  const supabase = createClient();
  let query = supabase
    .from("audit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.actionType) {
    query = query.eq("action_type", options.actionType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("Failed to fetch audit logs:", error);
    return [];
  }
  return (data || []) as AuditLog[];
}
