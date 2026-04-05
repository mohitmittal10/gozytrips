import React from "react";
import FinancialTracker from "@/components/financial-tracker";
import { useToast } from "@/hooks/use-toast";

interface FinanceViewProps {
    enrichedClients: any[];
    userEmail: string;
    userName: string;
    setFinancesTrip: (trip: any) => void;
    setIsFinancesOpen: (open: boolean) => void;
    user: any;
    userProfile: any;
}

export const FinanceView = ({
    enrichedClients,
    userEmail,
    userName,
    setFinancesTrip,
    setIsFinancesOpen
}: FinanceViewProps) => {
    const { toast } = useToast();

    const handleOpenFinances = (tripId: string) => {
        for (const c of enrichedClients) {
            const trip = c.allTrips.find((t: any) => t.id === tripId);
            if (trip) {
                setFinancesTrip(trip);
                setIsFinancesOpen(true);
                return;
            }
        }
        toast({
            title: "Trip Not Found",
            description: "The trip data could not be located.",
            variant: "destructive"
        });
    };

    return (
        <div className="mt-4">
            <FinancialTracker
                enrichedClients={enrichedClients}
                userEmail={userEmail}
                userName={userName}
                onOpenFinances={handleOpenFinances}
            />
        </div>
    );
};
