import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log("Checking user_form_drafts...");

  const { data: drafts, error } = await supabase
    .from('user_form_drafts')
    .select('*');

  if (error) {
    console.error("Error fetching drafts:", error);
  } else {
    console.log(`Found ${drafts.length} drafts:`);
    console.log(JSON.stringify(drafts, null, 2));
  }
}

run();
