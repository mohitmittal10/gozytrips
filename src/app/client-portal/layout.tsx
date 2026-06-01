import React from "react";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Travel Enquiry | GozyTrips",
  description: "Fill in your travel preferences and let your travel agent craft the perfect itinerary for you.",
};

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Intentionally a minimal layout — no CRM sidebar, no nav.
    // The page itself renders the branding from the form's agent data.
    <div className="min-h-screen bg-[#0A0A0B]">{children}</div>
  );
}
