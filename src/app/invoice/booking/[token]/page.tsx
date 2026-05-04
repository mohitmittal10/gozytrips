import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { getCurrencySymbol } from "@/types/financial";
import { DEFAULT_CURRENCY } from "@/types/pricing";
import {
    FileText,
    Plane,
    Car,
    Bus,
    Hotel,
    Users,
    Hash,
    MapPin,
    Phone,
    Mail,
} from "lucide-react";

const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0;

function getServiceIcon(type: string) {
    switch (type) {
        case "flight": return "✈️";
        case "cab": return "🚗";
        case "bus": return "🚌";
        case "train": return "🚆";
        case "hotel": return "🏨";
        default: return "📄";
    }
}

export default async function BookingInvoicePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    // 1. Fetch the standalone booking securely via share_token
    const { data: bookingData, error: bookingError } = await supabaseAdmin
        .from("standalone_bookings")
        .select("*")
        .eq("share_token", token as any)
        .eq("share_enabled", true as any)
        .single();

    if (bookingError || !bookingData) {
        return notFound();
    }

    const booking = bookingData as any;

    // 2. Fetch agent profile
    const { data: profData } = await supabaseAdmin
        .from("user_profiles")
        .select("*")
        .eq("id", booking.user_id)
        .single();

    const profile = profData as any;

    // 3. Fetch agency settings
    const { data: settingsData } = await supabaseAdmin
        .from("agency_settings")
        .select("*")
        .eq("user_id", booking.user_id)
        .single();

    const agencySettings = settingsData as any;

    // 4. Fetch client details if client_id exists
    let client: any = null;
    if (booking.client_id) {
        const { data: clientData } = await supabaseAdmin
            .from("clients")
            .select("id, name, email, phone")
            .eq("id", booking.client_id)
            .single();
        client = clientData;
    }

    const currencyCode = booking.currency || agencySettings?.default_currency || DEFAULT_CURRENCY;
    const currencySymbol = getCurrencySymbol(currencyCode as any);
    const netCost = Number(booking.net_cost) || 0;
    const markup = Number(booking.markup_percentage) || 0;
    const grossTotal = netCost * (1 + markup / 100);
    const markupAmount = grossTotal - netCost;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">

                {/* Agency Header */}
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {profile?.company_name || profile?.full_name || "Travel Agency"}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                        {[profile?.business_email || profile?.email, profile?.business_phone].filter(Boolean).join(" | ")}
                    </p>
                </div>

                {/* Invoice Card */}
                <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                    {/* Card Header */}
                    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-8 py-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Invoice</p>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{booking.title}</h2>
                                <p className="text-zinc-500 text-sm mt-1 capitalize">{getServiceIcon(booking.service_type)} {booking.service_type} Booking</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-zinc-400">Reference</p>
                                <p className="text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                                    {booking.id.split("-")[0]}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Issued: {formatDate(booking.created_at)}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                                ${booking.status === "confirmed" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                booking.status === "cancelled" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                                "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                                {booking.status || "Draft"}
                            </span>
                        </div>
                    </div>

                    <div className="px-8 py-6 space-y-8">

                        {/* Client & Agent Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Bill To (Client) */}
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Bill To</p>
                                {client ? (
                                    <div className="space-y-1">
                                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{client.name}</p>
                                        {client.email && (
                                            <p className="text-sm text-zinc-500 flex items-center gap-1">
                                                <span>📧</span> {client.email}
                                            </p>
                                        )}
                                        {client.phone && (
                                            <p className="text-sm text-zinc-500 flex items-center gap-1">
                                                <span>📱</span> {client.phone}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-400 italic">No client assigned</p>
                                )}
                            </div>

                            {/* Agent Contact */}
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Your Agent</p>
                                <div className="space-y-1">
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {profile?.full_name || profile?.company_name || "Your Travel Agent"}
                                    </p>
                                    {(profile?.business_email || profile?.email) && (
                                        <p className="text-sm text-zinc-500">📧 {profile?.business_email || profile?.email}</p>
                                    )}
                                    {profile?.business_phone && (
                                        <p className="text-sm text-zinc-500">📱 {profile.business_phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Booking Details */}
                        <div>
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Booking Details</p>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-100 dark:bg-zinc-800">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-t border-zinc-100 dark:border-zinc-800">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-zinc-900 dark:text-zinc-100">{booking.title}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5 capitalize">{booking.service_type} — {booking.booking_details?.provider || "N/A"}</p>
                                                {booking.booking_details?.pnr_or_confirmation && (
                                                    <p className="text-xs text-zinc-400 mt-0.5">PNR: {booking.booking_details.pnr_or_confirmation}</p>
                                                )}
                                                {booking.booking_details?.passengers && (
                                                    <p className="text-xs text-zinc-400 mt-0.5">{booking.booking_details.passengers} Passenger(s)</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                                                {currencySymbol}{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot className="border-t-2 border-zinc-200 dark:border-zinc-700">
                                        <tr>
                                            <td className="px-5 py-3 text-right text-sm text-zinc-500">Total</td>
                                            <td className="px-5 py-3 text-right font-bold text-xl text-zinc-900 dark:text-zinc-100">
                                                {currencySymbol}{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        {booking.booking_details?.notes && (
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Notes</p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                                    {booking.booking_details.notes}
                                </p>
                            </div>
                        )}

                        {/* Payment & Bank Details */}
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">Payment & Bank Details</h3>
                            {agencySettings?.bank_details ? (
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                    {agencySettings.bank_details}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    Thank you for your business. Please ensure payment is made before the service date. Contact your agent for any queries.
                                </p>
                            )}
                            {agencySettings?.terms_conditions && (
                                <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest mb-2">Terms & Conditions</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                        {agencySettings.terms_conditions}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Agent Signature */}
                        {agencySettings?.agent_signature && (
                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                                    {agencySettings.agent_signature}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-400">
                    This invoice was generated by {profile?.company_name || "your travel agent"} via GozyTrips.
                </p>
            </div>
        </div>
    );
}
