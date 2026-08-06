import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listAvailableDonations from "./tools/list-available-donations";
import createDonation from "./tools/create-donation";
import requestDonation from "./tools/request-donation";
import respondToRequest from "./tools/respond-to-request";
import listMyActivity from "./tools/list-my-activity";
import getMyProfile from "./tools/get-my-profile";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "foodshare-connect",
  title: "FoodShare Connect",
  version: "0.1.0",
  instructions:
    "Tools for FoodShare Connect, a surplus-food sharing app. Use `get_my_profile` to learn the signed-in user's role, `list_available_donations` to browse food that can be requested, `create_donation` for donors listing surplus food, `request_donation` for receivers claiming food, `respond_to_request` for donors accepting or rejecting requests, and `list_my_activity` to review the user's own donations and requests.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyProfile,
    listAvailableDonations,
    listMyActivity,
    createDonation,
    requestDonation,
    respondToRequest,
  ],
});
