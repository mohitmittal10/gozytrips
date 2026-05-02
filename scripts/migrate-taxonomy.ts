import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

  for (const status of statuses) {
    const { data: existing, error: selectError } = await supabase
      .from('reference_options')
      .select('id')
      .eq('scope', status.scope)
      .eq('value', status.value)
      .maybeSingle();

    if (selectError) {
      console.error(`Error checking ${status.value}:`, selectError);
      continue;
    }

    if (existing) {
      console.log(`Updating status: ${status.value}`);
      const { error: updateError } = await supabase
        .from('reference_options')
        .update(status)
        .eq('id', existing.id);
      if (updateError) console.error(`Error updating ${status.value}:`, updateError);
    } else {
      console.log(`Inserting status: ${status.value}`);
      const { error: insertError } = await supabase
        .from('reference_options')
        .insert(status);
      if (insertError) console.error(`Error inserting ${status.value}:`, insertError);
    }
  }

  console.log('Migrating "confirmed" to "booked"...');
  const { error: itError } = await supabase
    .from('itineraries')
    .update({ status: 'booked' })
    .eq('status', 'confirmed');
  
  if (itError) console.error('Error migrating itineraries:', itError);

  const { error: evFromError } = await supabase
    .from('itinerary_status_events')
    .update({ from_status: 'booked' })
    .eq('from_status', 'confirmed');

  if (evFromError) console.error('Error migrating status events (from):', evFromError);

  const { error: evToError } = await supabase
    .from('itinerary_status_events')
    .update({ to_status: 'booked' })
    .eq('to_status', 'confirmed');

  if (evToError) console.error('Error migrating status events (to):', evToError);

  console.log('Migration complete.');
}

migrate().catch(console.error);
