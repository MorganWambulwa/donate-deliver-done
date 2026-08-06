import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_donation",
  title: "Create donation",
  description: "Create a new food donation listing owned by the signed-in donor.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Short title of the donation."),
    description: z.string().trim().min(1).describe("What the food is and its condition."),
    food_type: z.string().trim().min(1).describe("Category, e.g. cooked meals, produce, bakery."),
    quantity: z.string().trim().min(1).describe("Quantity description, e.g. '5 kg' or '20 meals'."),
    pickup_location: z.string().trim().min(1).describe("Address or area for pickup."),
    expiry_date: z.string().describe("Expiry / best-before date as an ISO date or timestamp."),
    serves_people: z.number().int().positive().optional().describe("Approximate number of people served."),
    allergens: z.array(z.string()).optional().describe("Allergens present in the food."),
    dietary_info: z.array(z.string()).optional().describe("Dietary tags, e.g. vegetarian, halal."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("food_donations")
      .insert({ ...input, donor_id: ctx.getUserId() })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { donation: data },
    };
  },
});
