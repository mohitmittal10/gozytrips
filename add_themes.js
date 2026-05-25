const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addThemes() {
  const { data: existing, error: fetchError } = await supabase
    .from('reference_options')
    .select('*')
    .eq('scope', 'pdf_theme');

  if (fetchError) {
    console.error('Error fetching themes:', fetchError);
    return;
  }

  const existingValues = existing.map(o => o.value);
  const toInsert = [];

  if (!existingValues.includes('desert')) {
    toInsert.push({
      scope: 'pdf_theme',
      value: 'desert',
      label: 'Desert',
      sort_order: 60,
      is_active: true,
      metadata: {}
    });
  }

  if (!existingValues.includes('tropical')) {
    toInsert.push({
      scope: 'pdf_theme',
      value: 'tropical',
      label: 'Tropical',
      sort_order: 70,
      is_active: true,
      metadata: {}
    });
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('reference_options')
      .insert(toInsert);

    if (insertError) {
      console.error('Error inserting themes:', insertError);
    } else {
      console.log('Inserted themes:', toInsert.map(i => i.value));
    }
  } else {
    console.log('Themes already exist in DB.');
  }
}

addThemes();
