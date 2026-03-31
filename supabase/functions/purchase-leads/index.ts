import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body
    const body = await req.json();
    const { lead_ids } = body as { lead_ids: string[] };

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return new Response(JSON.stringify({ error: "lead_ids array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lead_ids.length > 10) {
      return new Response(JSON.stringify({ error: "Max 10 leads per purchase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for the atomic DB function
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get dealer record for this user
    const { data: dealer, error: dealerError } = await adminClient
      .from("dealers")
      .select("id, subscription_tier, delivery_preference, approval_status")
      .eq("user_id", user.id)
      .single();

    if (dealerError || !dealer) {
      return new Response(JSON.stringify({ error: "Dealer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (dealer.approval_status !== "approved") {
      return new Response(JSON.stringify({ error: "Dealer not approved" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get lead prices
    const { data: leads, error: leadsError } = await adminClient
      .from("leads")
      .select("id, price, sold_status")
      .in("id", lead_ids);

    if (leadsError || !leads) {
      return new Response(JSON.stringify({ error: "Failed to fetch leads" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process each lead purchase atomically
    const results: Array<{ lead_id: string; success: boolean; error?: string; purchase_id?: string }> = [];
    let finalBalance: number | null = null;

    for (const leadId of lead_ids) {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) {
        results.push({ lead_id: leadId, success: false, error: "Lead not found" });
        continue;
      }

      const { data: result, error: rpcError } = await adminClient.rpc("purchase_lead", {
        _dealer_id: dealer.id,
        _lead_id: leadId,
        _price: lead.price,
        _tier: dealer.subscription_tier,
        _delivery_method: dealer.delivery_preference,
      });

      if (rpcError) {
        results.push({ lead_id: leadId, success: false, error: rpcError.message });
        continue;
      }

      const res = result as { success: boolean; error?: string; purchase_id?: string; new_balance?: number };
      if (res.success) {
        results.push({ lead_id: leadId, success: true, purchase_id: res.purchase_id });
        finalBalance = res.new_balance ?? null;
      } else {
        results.push({ lead_id: leadId, success: false, error: res.error });
        // Stop on insufficient balance
        if (res.error === "Insufficient wallet balance") break;
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        purchased: successCount,
        total: lead_ids.length,
        new_balance: finalBalance,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
