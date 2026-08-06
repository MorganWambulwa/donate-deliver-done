import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_activity",
  title: "List my donations and requests",
  description:
    "List the signed-in user's own food donations and donation requests, with their current status.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max rows per section (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const max = limit ?? 20;

    const [donations, requests] = await Promise.all([
      supabase
        .from("food_donations")
        .select("id,title,food_type,quantity,status,expiry_date,pickup_location,created_at")
        .eq("donor_id", userId)
        .order("created_at", { ascending: false })
        .limit(max),
      supabase
        .from("donation_requests")
        .select("id,donation_id,status,message,requested_at,responded_at,food_donations(title,pickup_location)")
        .eq("receiver_id", userId)
        .order("requested_at", { ascending: false })
        .limit(max),
    ]);

    const error = donations.error ?? requests.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const payload = { donations: donations.data ?? [], requests: requests.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
