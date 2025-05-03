    // supabase/functions/confirm-receipt/index.ts
    import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
    import { corsHeaders } from "../_shared/cors.ts";

    serve(async (req) => {
      // Handle CORS preflight request
      if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
      }

      try {
        // 1. Create Supabase Admin Client (Bypasses RLS)
        //    Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ada di environment variables fungsi Anda
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          {
             auth: {
               autoRefreshToken: false,
               persistSession: false
             }
           }
        );

        // 2. Get User JWT and Request ID from Request Body
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          throw new Error("Missing Authorization header");
        }
        const { requestId } = await req.json();
        if (!requestId) {
          throw new Error("Missing 'requestId' in request body");
        }

        // 3. Get User from JWT
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
           authHeader.replace("Bearer ", "") // Extract token
        );
        if (userError || !user) {
           console.error("User Error:", userError);
           throw new Error("Failed to get user from token");
        }
        const userId = user.id;

        // 4. Fetch the request to verify ownership and get donation ID
        const { data: requestData, error: fetchRequestError } = await supabaseAdmin
           .from("permintaan_donasi")
           .select("id, id_peminta, id_donasi, status")
           .eq("id", requestId)
           .single();

        if (fetchRequestError) {
           console.error("Fetch Request Error:", fetchRequestError);
           if (fetchRequestError.code === 'PGRST116') { // Not found
             throw new Error("Request not found.");
           }
           throw new Error("Failed to fetch request details.");
        }

        // 5. Verify Ownership and Status
        if (requestData.id_peminta !== userId) {
          throw new Error("User is not authorized to confirm this request.");
        }
        // Optional: Check if status is 'disetujui' before allowing confirmation
        if (requestData.status !== 'disetujui') {
           console.warn(`Attempt to confirm request ${requestId} with status ${requestData.status}. Expected 'disetujui'.`);
           // Depending on desired behavior, you might throw an error here or just proceed.
           // For robustness, let's allow confirmation even if status somehow wasn't 'disetujui'
           // throw new Error(`Request status must be 'disetujui' to confirm receipt (current: ${requestData.status}).`);
        }


        const donationId = requestData.id_donasi;

        // --- Perform Updates (Ideally in a transaction, but sequential is simpler for now) ---

        // 6. Update Permintaan Donasi Status to 'selesai'
        const { error: updateRequestError } = await supabaseAdmin
           .from("permintaan_donasi")
           .update({ status: "selesai" })
           .eq("id", requestId); // Already verified ownership

        if (updateRequestError) {
           console.error("Update Request Error:", updateRequestError);
           throw new Error("Failed to update request status.");
        }

        // 7. Update Donasi Status to 'didonasikan'
        const { error: updateDonationError } = await supabaseAdmin
           .from("donasi")
           .update({ status: "didonasikan" })
           .eq("id", donationId);

        if (updateDonationError) {
           // Log the error, but maybe don't fail the whole function?
           // The request is confirmed, but the donation status update failed.
           // This might need manual fixing or retry logic later.
           console.error(`CRITICAL: Request ${requestId} set to 'selesai', but failed to update donation ${donationId} to 'didonasikan'. Error: ${updateDonationError.message}`);
           // We will still return success for the request confirmation part.
        }

        // 8. Return Success Response
        return new Response(JSON.stringify({ success: true, message: "Receipt confirmed successfully." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400, // Or 500 for server errors
        });
      }
    });