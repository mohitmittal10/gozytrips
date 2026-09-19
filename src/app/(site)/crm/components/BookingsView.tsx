import React from "react";
import { Plus, FileText, Plane, Car, Bus, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Booking {
    id: string;
    title: string;
    service_type: string;
    net_cost?: number;
    markup_percentage?: number;
}

interface BookingsViewProps {
    bookings: Booking[];
    bookingsLoading: boolean;
    setIsBookingDialogOpen: (open: boolean) => void;
    setBookings: (bookings: any[]) => void;
    setSelectedBooking: (booking: any) => void;
    user: any;
}

export const BookingsView = ({ 
    bookings, 
    bookingsLoading, 
    setIsBookingDialogOpen,
    setSelectedBooking
}: BookingsViewProps) => {

    const getIcon = (type: string) => {
        switch (type) {
            case 'flight': return <Plane className="w-5 h-5 text-blue-400" />;
            case 'cab': return <Car className="w-5 h-5 text-yellow-400" />;
            case 'bus': return <Bus className="w-5 h-5 text-green-400" />;
            case 'train': return <Bus className="w-5 h-5 text-orange-400" />;
            case 'hotel': return <Hotel className="w-5 h-5 text-purple-400" />;
            default: return <FileText className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="mt-4 space-y-6">

            {bookingsLoading ? (
                <div className="crm-booking-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 h-32 animate-pulse" />
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-16 text-center text-zinc-400 flex flex-col items-center justify-center shadow-xl">
                    <FileText className="w-12 h-12 text-zinc-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Standalone Bookings</h3>
                    <p className="mb-5 text-sm text-zinc-400 font-medium">Create a quick booking for a cab, flight, or hotel independent of a full trip.</p>
                    <Button onClick={() => setIsBookingDialogOpen(true)} className="px-6 py-2.5 aurora-gradient text-white border-none rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-98 flex items-center gap-2 h-11 cursor-pointer">
                        <Plus className="w-4 h-4" />
                        Create First Booking
                    </Button>
                </div>
            ) : (
                <div className="crm-booking-grid">
                    {bookings.map((booking) => (
                        <div 
                            key={booking.id} 
                            onClick={() => setSelectedBooking(booking)}
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 hover:border-primary/40 transition-all group relative overflow-hidden cursor-pointer shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-3 relative">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
                                        {getIcon(booking.service_type)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base leading-tight group-hover:text-primary transition-colors">{booking.title}</h4>
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mt-0.5">{booking.service_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

