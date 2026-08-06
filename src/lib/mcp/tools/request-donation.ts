import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "request_donation",
  title: "Request a donation",
  description: "Request an available food donation on behalf of the signed-in receiver.",
  inputSchema: {
    donation_id: z.string().uuid().describe("ID of the donation to request."),
    message: z.string().trim().optional().describe("Optional message to the donor."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ donation_id, message }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("donation_requests")
      .insert({ donation_id, message: message ?? null, receiver_id: ctx.getUserId() })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { request: data },
    };
  },
});
