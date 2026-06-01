/**
 * @fileOverview Hook for real-time two-way messaging between agents and clients.
 * Uses Supabase Realtime for live updates and a REST API for sending/fetching.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ClientMessage {
  id: string;
  response_id: string;
  sender_role: "agent" | "client";
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export function useClientMessages(responseId: string | null, role: "agent" | "client" = "client") {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = createClient();

  const fetchMessages = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + Realtime subscription
  useEffect(() => {
    if (!responseId) {
      setMessages([]);
      return;
    }

    fetchMessages(responseId);

    // Subscribe to new messages on this response via Supabase Realtime
    const channel = supabase
      .channel(`client_messages:${responseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "client_messages",
          filter: `response_id=eq.${responseId}`,
        },
        (payload) => {
          const newMsg = payload.new as ClientMessage;
          setMessages((prev) => {
            // Avoid duplicate if we already optimistically added it
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "client_messages",
          filter: `response_id=eq.${responseId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as ClientMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .subscribe((status) => {
        console.log(`Realtime message subscription for response ${responseId}:`, status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [responseId, fetchMessages]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!responseId || !body.trim()) return;
      setSending(true);
      setError(null);

      // Optimistic insert — give it a temp id
      const tempId = `temp-${Date.now()}`;
      const { data: { user } } = await supabase.auth.getUser();
      const optimistic: ClientMessage = {
        id: tempId,
        response_id: responseId,
        sender_role: role,
        sender_id: user?.id || "",
        body: body.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await fetch(`/api/messages/${responseId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: body.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send message");

        // Replace the optimistic message with the real one
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
      } catch (err: any) {
        // Roll back optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(err.message);
      } finally {
        setSending(false);
      }
    },
    [responseId, supabase, role]
  );

  const markAsRead = useCallback(async () => {
    if (!responseId) return;
    try {
      const res = await fetch(`/api/messages/${responseId}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to mark messages as read");
      // Optimistically update our local messages state to show them as read
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_role !== role ? { ...m, is_read: true } : m
        )
      );
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [responseId, role]);

  const unreadCount = messages.filter(
    (m) => !m.is_read && m.sender_role !== role
  ).length;

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    markAsRead,
    refetch: responseId ? () => fetchMessages(responseId) : () => {},
    unreadCount,
  };
}
