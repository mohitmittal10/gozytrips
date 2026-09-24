import React from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusStyle, CRM_AVATAR_CLASS } from "../utils/crm-colors";

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
    const rawKeys = itineraryStatuses.length > 0
        ? itineraryStatuses.filter(opt => ['draft', 'proposed', 'sent', 'booked'].includes(opt.value)).map(opt => ({ key: opt.value, label: opt.label }))
        : [
            { key: 'draft', label: 'Draft' },
            { key: 'proposed', label: 'Proposed' },
            { key: 'sent', label: 'Sent' },
            { key: 'booked', label: 'Booked' },
        ];

    const columns = rawKeys.map(item => {
        const style = getStatusStyle(item.key);
        return {
            key: item.key,
            label: item.label,
            borderColor: style.borderColor,
            bgColor: style.bgColor,
            dotClass: style.dotClass
        };
    });

    return (
        <div className="crm-kanban-grid">
            {columns.map(col => (
                <div key={col.key} className={`bg-white/[0.03] backdrop-blur-xl border ${col.borderColor} rounded-2xl p-4 min-h-[300px] shadow-xl`}
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
                    <div className="flex items-center justify-between mb-3 text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${col.dotClass}`} />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{col.label}</h3>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${col.bgColor} text-slate-900 dark:text-white border border-slate-300 dark:border-white/10 font-bold`}>
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
                                className="p-3.5 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-300 dark:border-white/10 hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group shadow-md"
                                onClick={() => setSelectedClient(client)}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <GripVertical className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className={cn("inline-flex w-6 h-6 rounded-full items-center justify-center text-[10px] font-bold shrink-0", CRM_AVATAR_CLASS)}>
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{client.name}</p>
                                </div>
                                <div className="ml-[22px] space-y-1">
                                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium truncate">{client.latestDestination}</p>
                                </div>
                            </div>
                        ))}
                        {(!kanbanColumns[col.key] || kanbanColumns[col.key].length === 0) && (
                            <div className="flex items-center justify-center h-20 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl">
                                <p className="text-[10px] text-slate-600 dark:text-zinc-400 font-medium">Drop here</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

