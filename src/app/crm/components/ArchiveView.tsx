import React from "react";
import { Archive, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchiveViewProps {
    archivedClients: any[];
    setSelectedClient: (client: any) => void;
    getAvatarColor: (name: string) => string;
}

export const ArchiveView = ({ 
    archivedClients, 
    setSelectedClient, 
    getAvatarColor 
}: ArchiveViewProps) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    {archivedClients.length} completed trip{archivedClients.length !== 1 ? 's' : ''}
                </p>
            </div>
            
            {archivedClients.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center text-white">
                    <Archive className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No completed trips yet.</p>
                    <p className="text-xs text-gray-600 mt-1">
                        When a trip is marked as "Completed", it will appear here.
                    </p>
                </div>
            ) : (
                <div className="crm-archive-grid">
                    {archivedClients.map(client => (
                        <div
                            key={client.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors cursor-pointer group"
                            onClick={() => setSelectedClient(client)}
                        >
                            <div className="flex items-center gap-3 mb-3 text-white">
                                <div className={cn("inline-flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold text-white bg-gradient-to-br shrink-0", getAvatarColor(client.name))}>
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-white truncate">{client.name}</p>
                                    <p className="text-xs text-gray-500">{client.email || 'No email'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Compass className="w-3 h-3" />
                                    <span className="truncate max-w-[120px]">{client.latestDestination}</span>
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
