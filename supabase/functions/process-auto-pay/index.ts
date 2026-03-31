import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Reset daily counters if needed
    await supabase
      .from("auto_pay_rules")
      .update({ daily_spent: 0, leads_purchased_today: 0, last_reset_date: today })
      .neq("last_reset_date", today)
      .eq("is_active", true);

    // Fetch active rules
    const { data: rules, error: rulesErr } = await supabase
      .from("auto_pay_rules")
      .select("*")
      .eq("is_active", true);

    if (rulesErr) throw rulesErr;
    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ message: "No active rules", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalPurchased = 0;

    for (const rule of rules) {
      // Skip if daily limits hit
      if (rule.leads_purchased_today >= rule.max_leads_per_day) continue;
      if (rule.daily_spent >= rule.daily_budget) continue;

      // Get dealer info
      const { data: dealer } = await supabase
        .from("dealers")
        .select("id, wallet_balance, subscription_tier, delivery_preference")
        .eq("id", rule.dealer_id)
        .single();

      if (!dealer || dealer.wallet_balance < rule.max_price) continue;

      // Build lead query
      let query = supabase
        .from("leads")
        .select("id, price, province, buyer_type, ai_score, quality_grade")
        .eq("sold_status", "available")
        .lte("price", rule.max_price)
        .gte("ai_score", rule.min_ai_score);

      if (rule.quality_grades && rule.quality_grades.length > 0) {
        query = query.in("quality_grade", rule.quality_grades);
      }
      if (rule.provinces && rule.provinces.length > 0) {
        query = query.in("province", rule.provinces);
      }
      if (rule.buyer_types && rule.buyer_types.length > 0) {
        query = query.in("buyer_type", rule.buyer_types);
      }

      const remainingLeads = rule.max_leads_per_day - rule.leads_purchased_today;
      const remainingBudget = rule.daily_budget - rule.daily_spent;

      const { data: matchingLeads } = await query
        .order("ai_score", { ascending: false })
        .limit(remainingLeads);

      if (!matchingLeads || matchingLeads.length === 0) continue;

      let spentThisRound = 0;
      let purchasedThisRound = 0;

      for (const lead of matchingLeads) {
        if (spentThisRound + lead.price > remainingBudget) continue;
        if (dealer.wallet_balance - spentThisRound < lead.price) break;

        // Use the atomic purchase function
        const { data: result } = await supabase.rpc("purchase_lead", {
          _dealer_id: dealer.id,
          _lead_id: lead.id,
          _price: lead.price,
          _tier: dealer.subscription_tier,
          _delivery_method: dealer.delivery_preference,
        });

        if (result && result.success) {
          spentThisRound += lead.price;
          purchasedThisRound++;
          totalPurchased++;
        }
      }

      // Update rule counters
      if (purchasedThisRound > 0) {
        await supabase
          .from("auto_pay_rules")
          .update({
            daily_spent: rule.daily_spent + spentThisRound,
            leads_purchased_today: rule.leads_purchased_today + purchasedThisRound,
          })
          .eq("id", rule.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: totalPurchased }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auto-pay processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
