import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "respond_to_request",
  title: "Respond to a donation request",
  description: "Accept or reject a request made on one of the signed-in donor's donations.",
  inputSchema: {
    request_id: z.string().uuid().describe("ID of the donation request."),
    decision: z.enum(["accepted", "rejected"]).describe("Whether to accept or reject the request."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ request_id, decision }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("donation_requests")
      .update({ status: decision, responded_at: new Date().toISOString() })
      .eq("id", request_id)
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: "Request not found or you are not allowed to respond to it." }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { request: data },
    };
  },
});
