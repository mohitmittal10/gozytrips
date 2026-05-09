import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Calendar, FileText } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { DEFAULT_CURRENCY } from "@/types/pricing";

// Use service role key to bypass RLS for public invoice viewing
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Dynamic rendering

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch itinerary securely via share_token
  const { data: itinData, error: itinError } = await supabaseAdmin
    .from("itineraries")
    .select("*")
    .eq("share_token", id)
    .eq("share_enabled", true)
    .single();

  if (itinError || !itinData) {
    return notFound();
  }
  
  const itinerary = itinData as any;
  const itineraryId = itinerary.id;

  // 2. Fetch agent profile
  const { data: profData } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", itinerary.user_id)
    .single();
    
  const profile = profData as any;

  // 3. Fetch line items
  const { data: lineItemsData } = await supabaseAdmin
    .from("trip_line_items")
    .select("*")
    .eq("itinerary_id", itineraryId)
    .order("created_at", { ascending: true });

  // 4. Fetch payments
  const { data: paymentsData } = await supabaseAdmin
    .from("trip_payments")
    .select("*")
    .eq("itinerary_id", itineraryId);
    
  const payments = (paymentsData as any[]) || [];
  const amountPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 5. Fetch agency settings
  const { data: settingsData } = await supabaseAdmin
    .from("agency_settings")
    .select("*")
    .eq("user_id", itinerary.user_id)
    .single();
    
  const agencySettings = settingsData as any;
  const currencyCode = itinerary.currency || agencySettings?.default_currency || DEFAULT_CURRENCY;
  const currency = getCurrencySymbol(currencyCode as any);

  const items = (lineItemsData as any[]) || [];
  
  const calculatedTotal = items.reduce((sum, item) => {
    return sum + (Number(item.net_cost) * (1 + Number(item.markup_percentage) / 100));
  }, 0);
  
  const totalGross = itinerary.client_price ? Number(itinerary.client_price) : calculatedTotal;
  const balanceDue = totalGross - amountPaid;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header / Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {profile?.company_name || profile?.full_name || "Travel Agency"}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {profile?.business_email || profile?.email} {profile?.business_phone ? `| ${profile.business_phone}` : ''}
          </p>
        </div>

        <Card className="shadow-lg border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-semibold mb-2">{itinerary.title}</CardTitle>
                <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
                  Detailed Invoice
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center justify-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-2">
                  <FileText className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-500">Invoice Reference</p>
                <p className="text-xs text-zinc-400 uppercase">{itinerary.id.split('-')[0]}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{itinerary.starting_location} {itinerary.ending_location ? `to ${itinerary.ending_location}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{formatDate(itinerary.start_date)} - {formatDate(itinerary.end_date)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="bg-white dark:bg-zinc-900 pt-8 pb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold rounded-l-lg">Description</th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-zinc-500">
                        No line items found for this invoice.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const itemGross = Number(item.net_cost) * (1 + Number(item.markup_percentage) / 100);
                      return (
                        <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</div>
                            <div className="text-xs text-zinc-500 capitalize mt-1">{item.category}</div>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                            {currency}{itemGross.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                    <td className="px-6 py-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Subtotal
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                      {currency}{totalGross.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Amount Paid
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600 dark:text-green-500">
                      -{currency}{amountPaid.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                    <td className="px-6 py-6 text-right font-bold text-lg text-zinc-900 dark:text-zinc-100">
                      Balance Due
                    </td>
                    <td className="px-6 py-6 text-right font-bold text-2xl text-primary">
                      {currency}{balanceDue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment History Section */}
            {payments.length > 0 && (
              <div className="mt-12">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Payment History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Description</th>
                        <th className="px-4 py-3 font-semibold">Method</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {formatDate(payment.date || payment.created_at)}
                          </td>
                          <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">
                            {payment.notes || payment.reference || 'Trip Payment'}
                          </td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-500 capitalize">
                            {payment.method?.replace('_', ' ') || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-500">
                            {currency}{Number(payment.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment / Footer Note */}
            <div className="mt-12 p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">Payment & Bank Details</h3>
              {agencySettings?.bank_details ? (
                <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                  {agencySettings.bank_details}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Thank you for your business. Please ensure the total amount is settled prior to the departure date. For any questions regarding this invoice, please contact your travel agent directly.
                </p>
              )}
              
              {agencySettings?.terms_conditions && (
                <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Terms & Conditions</h4>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                    {agencySettings.terms_conditions}
                  </div>
                </div>
              )}
            </div>

            {/* Agent Signature */}
            {agencySettings?.agent_signature && (
              <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                  {agencySettings.agent_signature}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
