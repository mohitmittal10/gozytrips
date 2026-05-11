"use client";

import FloatingActionMenu from "@/components/ui/floating-action-menu";
import { Settings, User, LogOut } from "lucide-react";

export function AccountFAB() {
    return (
        <FloatingActionMenu
            options={[
                {
                    label: "Profile",
                    Icon: <User className="w-4 h-4 text-foreground/80" />,
                    onClick: () => console.log("Profile clicked"),
                },
                {
                    label: "Settings",
                    Icon: <Settings className="w-4 h-4 text-foreground/80" />,
                    onClick: () => console.log("Settings clicked"),
                },
                {
                    label: "Logout",
                    Icon: <LogOut className="w-4 h-4 text-destructive" />,
                    onClick: () => console.log("Logout clicked"),
                },
            ]}
        />
    );
}

