/**
 * One-shot taxonomy migration: upserts itinerary_status reference_options
 * and remaps legacy "confirmed" → "booked".
 *
 * Run only with a DB backup and explicit confirmation:
 *   npx tsx scripts/migrate-taxonomy.ts
 *
 * Prefer upserts; fails hard on critical status remaps.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('Starting taxonomy migration...');

  const statuses = [
    { scope: 'itinerary_status', value: 'draft', label: 'Draft', sort_order: 10, metadata: { color: 'purple', borderColor: 'border-purple-500/30', bgColor: 'bg-purple-500/10' } },
    { scope: 'itinerary_status', value: 'proposed', label: 'Proposed', sort_order: 20, metadata: { color: 'pink', borderColor: 'border-pink-500/30', bgColor: 'bg-pink-500/10' } },
    { scope: 'itinerary_status', value: 'sent', label: 'Sent', sort_order: 30, metadata: { color: 'blue', borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/10' } },
    { scope: 'itinerary_status', value: 'booked', label: 'Booked', sort_order: 40, metadata: { color: 'green', borderColor: 'border-green-500/30', bgColor: 'bg-green-500/10' } },
    { scope: 'itinerary_status', value: 'rejected', label: 'Rejected', sort_order: 50, metadata: { color: 'red', borderColor: 'border-red-500/30', bgColor: 'bg-red-500/10' } },
    { scope: 'itinerary_status', value: 'completed', label: 'Completed', sort_order: 60, metadata: { color: 'amber', borderColor: 'border-amber-500/30', bgColor: 'bg-amber-500/10' } },
  ];

  const { error: upsertError } = await supabase
    .from('reference_options')
    .upsert(statuses, { onConflict: 'scope,value' });

  if (upsertError) {
    console.error('Failed to upsert reference_options:', upsertError);
    process.exit(1);
  }
  console.log(`Upserted ${statuses.length} itinerary statuses.`);

  console.log('Migrating "confirmed" to "booked"...');
  const { error: itError } = await supabase
    .from('itineraries')
    .update({ status: 'booked' })
    .eq('status', 'confirmed');

  if (itError) {
    console.error('Error migrating itineraries:', itError);
    process.exit(1);
  }

  const { error: evFromError } = await supabase
    .from('itinerary_status_events')
    .update({ from_status: 'booked' })
    .eq('from_status', 'confirmed');

  if (evFromError) {
    console.error('Error migrating status events (from):', evFromError);
    process.exit(1);
  }

  const { error: evToError } = await supabase
    .from('itinerary_status_events')
    .update({ to_status: 'booked' })
    .eq('to_status', 'confirmed');

  if (evToError) {
    console.error('Error migrating status events (to):', evToError);
    process.exit(1);
  }

  console.log('Migration complete.');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
