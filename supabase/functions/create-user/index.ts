    // supabase/functions/create-user/index.ts
    import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
    import { corsHeaders } from '../_shared/cors.ts';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    serve(async (req: Request) => {
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
      }

      try {
        // Verify caller is admin (similar logic as delete-user)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing auth header');
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }, auth: { persistSession: false }
        });
        const { data: { user: caller }, error: callerError } = await supabaseClient.auth.getUser();
        if (callerError || !caller) throw new Error('Authentication failed for caller.');

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } });
        const { data: callerProfile, error: profileError } = await supabaseAdmin
          .from('profil')
          .select('role')
          .eq('id', caller.id)
          .single();
        if (profileError || !callerProfile || callerProfile.role !== 'admin') {
          throw new Error('Permission denied. Not an admin.');
        }

        // Get data from request body
        const { email, password, role } = await req.json();
        if (!email || !password || !role || (role !== 'user' && role !== 'admin')) {
            throw new Error('Missing or invalid email, password, or role.');
        }
         if (password.length < 6) { // Basic password length check
             throw new Error('Password must be at least 6 characters long.');
         }

        // Create user in auth.users
        console.log(`Admin ${caller.id} attempting to create user ${email} with role ${role}`);
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Automatically confirm email for admin-created users
            user_metadata: { role: role } // Optional: store role in metadata too
        });

        if (createUserError) {
            console.error(`Error creating auth user ${email}:`, createUserError);
            throw new Error(`Failed to create auth user: ${createUserError.message}`);
        }

        if (!newUser || !newUser.user) {
             throw new Error('Failed to get new user data after creation.');
        }

        // Create profile entry
        const { error: createProfileError } = await supabaseAdmin
            .from('profil')
            .insert({
                id: newUser.user.id, // Use the ID from the newly created auth user
                nama_pengguna: email.split('@')[0], // Default username from email prefix
                role: role,
                // Add other default profile fields if necessary (e.g., updated_at)
                // nama_lengkap, avatar_url, bio can be null initially
            });

        if (createProfileError) {
            // IMPORTANT: If profile creation fails, we should ideally delete the auth user we just created
            // to avoid orphaned auth users. This adds complexity (rollback logic).
            // For simplicity now, we just log the error. Consider adding rollback later.
            console.error(`Error creating profile for ${newUser.user.id} (Auth user created!):`, createProfileError);
            // Maybe return a specific error indicating partial success?
            throw new Error(`Auth user created, but failed to create profile: ${createProfileError.message}`);
        }

        console.log(`User ${email} (${newUser.user.id}) created successfully by admin ${caller.id}`);
        // Return limited user info (don't return full auth user object)
        return new Response(JSON.stringify({ message: 'User created successfully', userId: newUser.user.id }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error in create-user function:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
           status: error.message.includes('admin') ? 403 : (error.message.includes('auth') || error.message.includes('characters')) ? 400 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    });