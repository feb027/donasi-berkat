// supabase/functions/admin-delete-donation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") { return new Response("ok", { headers: corsHeaders }); }
  try {
    const supabaseAdmin = createClient( Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    const { donationId } = await req.json();
    if (!donationId) throw new Error("Missing 'donationId'");

    // TODO: Add Admin Role Verification here if needed

    const { error } = await supabaseAdmin
      .from("donasi")
      .delete()
      .eq("id", donationId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: "Donation deleted successfully." }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Function Error (admin-delete-donation):", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});