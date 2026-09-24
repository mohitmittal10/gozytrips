import React from "react";
import { Archive, Compass } from "lucide-react";
import { cn, getAvatarColor } from "@/lib/utils";

interface ArchiveViewProps {
    archivedClients: any[];
    setSelectedClient: (client: any) => void;

}

export const ArchiveView = ({ 
    archivedClients, 
    setSelectedClient, 
}: ArchiveViewProps) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    {archivedClients.length} completed trip{archivedClients.length !== 1 ? 's' : ''}
                </p>
            </div>
            
            {archivedClients.length === 0 ? (
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-xl rounded-2xl p-12 text-center text-slate-900 dark:text-white">
                    <Archive className="w-12 h-12 text-slate-600 dark:text-zinc-400 mx-auto mb-3 opacity-60" />
                    <p className="text-zinc-300 font-medium">No completed trips yet.</p>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                        When a trip is marked as "Completed", it will appear here.
                    </p>
                </div>
            ) : (
                <div className="crm-archive-grid">
                    {archivedClients.map(client => (
                        <div
                            key={client.id}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-xl rounded-2xl p-4 hover:bg-white/[0.06] transition-all cursor-pointer group"
                            onClick={() => setSelectedClient(client)}
                        >
                            <div className="flex items-center gap-3 mb-3 text-slate-900 dark:text-white">
                                <div className={cn("inline-flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-slate-900 dark:text-white bg-gradient-to-br shrink-0", getAvatarColor(client.name))}>
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{client.name}</p>
                                    <p className="text-xs text-slate-600 dark:text-zinc-400">{client.email || 'No email'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-zinc-400">
                                <div className="flex items-center gap-1">
                                    <Compass className="w-3 h-3 text-primary" />
                                    <span className="truncate max-w-[120px] font-medium">{client.latestDestination}</span>
                                </div>
                                <span className="ml-auto">{client.latestContact}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

