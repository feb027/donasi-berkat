import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming you have CORS setup

// WARNING: Never expose your service_role key publicly!
// Use environment variables (best practice)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client
    // Must use service_role key to delete users
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { auth: { persistSession: false } } // Prevent saving session cookies on the server
    );

    // 2. Get caller's JWT and user ID to verify admin status
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    // Use a regular client to get user from JWT
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
    });
    const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser();

    if (callerError || !caller) {
      console.error('Caller auth error:', callerError);
      return new Response(JSON.stringify({ error: 'Authentication failed for caller.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Verify if the CALLER is an admin by checking their profile
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profil') // Use Admin client to bypass RLS if needed
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
        console.error('Admin verification failed:', profileError);
        return new Response(JSON.stringify({ error: 'Permission denied. Not an admin.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Get the userId to delete from the request body
    const { userId } = await req.json();
    if (!userId || typeof userId !== 'string') {
      throw new Error('Missing or invalid userId in request body');
    }

    // Prevent admin from deleting themselves via this function (optional safeguard)
    if (userId === caller.id) {
         return new Response(JSON.stringify({ error: 'Admin cannot delete themselves via this function.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
    }

    // 5. Delete the user from auth.users using Admin Client
    console.log(`Admin ${caller.id} attempting to delete user ${userId}`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(`Error deleting user ${userId}:`, deleteError);
      // Provide a more specific error if possible
      throw new Error(`Failed to delete user from auth: ${deleteError.message}`);
    }

    // 6. Handle deletion from 'profil' table (and potentially others)
    // Option A: Rely on ON DELETE CASCADE (if set up on profil.id FK) - Simplest
    // Option B: Manually delete from profil (if no cascade)
    const { error: deleteProfileError } = await supabaseAdmin
       .from('profil')
       .delete()
       .eq('id', userId);

     if (deleteProfileError) {
        // Log this error, but maybe don't fail the whole request if auth user was deleted
        console.error(`Error deleting profile for user ${userId} (auth user already deleted):`, deleteProfileError);
        // You might decide to return a partial success or warning here
     }

    console.log(`User ${userId} successfully deleted by admin ${caller.id}`);
    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-user function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: error.message.includes('Not an admin') ? 403 : error.message.includes('authorization') ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});