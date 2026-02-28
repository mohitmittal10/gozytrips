import { createClient } from './supabase/client';

export async function checkSupabaseConnection() {
  const supabase = createClient();
  console.log('🔍 Supabase Diagnostics Check');
  
  try {
    // Check if environment variables are set
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('📋 Environment Variables:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL:', url ? '✅ Set' : '❌ Missing');
    console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? '✅ Set' : '❌ Missing');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Authentication Status:');
    if (sessionError) {
      console.log('  ❌ Error getting session:', sessionError.message);
    } else if (session?.user) {
      console.log('  ✅ Authenticated');
      console.log('  User ID:', session.user.id);
      console.log('  Email:', session.user.email);
      console.log('  Access Token Valid:', !!session.access_token);
    } else {
      console.log('  ❌ No active session');
    }
    
    // Test database connection by trying a simple query
    console.log('🗄️ Testing Database Connection...');
    const { data, error, status } = await supabase
      .from('itineraries')
      .select('count()', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('  ❌ Database query failed:', error.message);
      console.log('  Error code:', error.code);
      console.log('  Details:', error.details);
    } else {
      console.log('  ✅ Database connection OK');
    }
    
    // Test insert with actual user data
    if (session?.user) {
      console.log('🧪 Testing Insert Operation...');
      const testData = {
        user_id: session.user.id,
        title: 'TEST_TRIP',
        description: 'Test insert',
        starting_location: 'Test Start',
        ending_location: 'Test End',
        start_date: '2026-03-01',
        end_date: '2026-03-05',
        budget: 1000,
        itinerary_data: { test: true },
      };
      
      console.log('  Attempting insert with:', testData);
      const { data: insertData, error: insertError, status: insertStatus } = await supabase
        .from('itineraries')
        .insert([testData]);
      
      if (insertError) {
        console.log('  ❌ Insert failed:', insertError.message);
        console.log('  Error code:', insertError.code);
        console.log('  Hint:', insertError.hint);
        console.log('  Details:', insertError.details);
      } else {
        console.log('  ✅ Insert successful');
        console.log('  Response:', insertData);
        
        // Clean up test data
        const { error: deleteError } = await supabase
          .from('itineraries')
          .delete()
          .eq('title', 'TEST_TRIP');
        
        if (!deleteError) {
          console.log('  ✅ Test data cleaned up');
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Fatal error during diagnostics:', error);
  }
}
