import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_available_donations",
  title: "List available donations",
  description: "List food donations that are currently available to request.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max donations to return (default 20)."),
    search: z.string().optional().describe("Optional text to match against title, food type or pickup location."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, search }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("food_donations")
      .select("id,title,description,food_type,quantity,serves_people,pickup_location,expiry_date,status,created_at")
      .eq("status", "available")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      query = query.or(
        `title.ilike.${term},food_type.ilike.${term},pickup_location.ilike.${term}`
      );
    }

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { donations: data ?? [] },
    };
  },
});
