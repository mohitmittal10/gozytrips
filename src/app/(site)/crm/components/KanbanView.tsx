import React from "react";
import { GripVertical } from "lucide-react";
import { cn, getAvatarColor } from "@/lib/utils";

interface KanbanViewProps {
    kanbanColumns: Record<string, any[]>;
    itineraryStatuses: any[];
    handleStatusChange: (clientId: string, tripId: string, newStatus: string) => void;
    setSelectedClient: (client: any) => void;

}

export const KanbanView = ({ 
    kanbanColumns, 
    itineraryStatuses,
    handleStatusChange, 
    setSelectedClient, 
}: KanbanViewProps) => {
    const columns = itineraryStatuses.length > 0 
        ? itineraryStatuses
            .filter(opt => ['draft', 'proposed', 'sent', 'booked'].includes(opt.value))
            .map(opt => ({
                key: opt.value,
                label: opt.label,
                borderColor: opt.metadata?.borderColor || 'border-white/10',
                bgColor: opt.metadata?.bgColor || 'bg-white/5'
            }))
        : [
            { key: 'draft', label: 'Draft', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10' },
            { key: 'proposed', label: 'Proposed', borderColor: 'border-pink-500/30', bgColor: 'bg-pink-500/10' },
            { key: 'sent', label: 'Sent', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10' },
            { key: 'booked', label: 'Booked', borderColor: 'border-green-500/30', bgColor: 'bg-green-500/10' },
        ];

    return (
        <div className="crm-kanban-grid">
            {columns.map(col => (
                <div key={col.key} className={`bg-white/5 border ${col.borderColor} rounded-xl p-4 min-h-[300px]`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData('text/plain');
                        if (data) {
                            try {
                                const { clientId, tripId } = JSON.parse(data);
                                handleStatusChange(clientId, tripId, col.key);
                            } catch (error) {
                                console.error("Error processing drop data:", error);
                            }
                        }
                    }}
                >
                    <div className="flex items-center justify-between mb-3 text-white">
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${col.bgColor.replace('bg-', 'bg-opacity-100 bg-')}`} />
                            <h3 className="text-sm font-semibold text-gray-300">{col.label}</h3>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${col.bgColor} text-gray-400`}>
                            {kanbanColumns[col.key]?.length || 0}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {kanbanColumns[col.key]?.map(client => (
                            <div
                                key={client.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', JSON.stringify({ 
                                        clientId: client.id, 
                                        tripId: client.latestTripId 
                                    }));
                                }}
                                className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing group"
                                onClick={() => setSelectedClient(client)}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <GripVertical className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className={cn("inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br shrink-0", getAvatarColor(client.name))}>
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-xs font-medium text-white truncate">{client.name}</p>
                                </div>
                                <div className="ml-[22px] space-y-1">
                                    <p className="text-[10px] text-gray-500 truncate">{client.latestDestination}</p>
                                </div>
                            </div>
                        ))}
                        {(!kanbanColumns[col.key] || kanbanColumns[col.key].length === 0) && (
                            <div className="flex items-center justify-center h-20 border-2 border-dashed border-white/5 rounded-lg">
                                <p className="text-[10px] text-gray-600">Drop here</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

