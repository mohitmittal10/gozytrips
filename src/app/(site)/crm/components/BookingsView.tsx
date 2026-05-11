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
                        <div key={i} className="glass-main border border-white/10 rounded-xl p-6 h-32 animate-pulse" />
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className="glass-main border border-white/10 rounded-xl p-16 text-center text-gray-400 flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-gray-600 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No Standalone Bookings</h3>
                    <p className="mb-4">Create a quick booking for a cab, flight, or hotel independent of a full trip.</p>
                    <Button onClick={() => setIsBookingDialogOpen(true)} className="px-6 py-2.5 aurora-gradient text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2 h-10 border-none">
                        Create First Booking
                    </Button>
                </div>
            ) : (
                <div className="crm-booking-grid">
                    {bookings.map((booking) => (
                        <div 
                            key={booking.id} 
                            onClick={() => setSelectedBooking(booking)}
                            className="glass-main border border-white/10 rounded-xl p-5 hover:bg-white/[0.04] transition-all group relative overflow-hidden cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between mb-3 relative">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg">
                                        {getIcon(booking.service_type)}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white leading-tight">{booking.title}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{booking.service_type}</p>
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

