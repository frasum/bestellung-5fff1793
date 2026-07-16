import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listSuppliersTool from "./tools/list-suppliers";
import listOrdersTool from "./tools/list-orders";
import searchArticlesTool from "./tools/search-articles";
import getOrderTool from "./tools/get-order";
import createOrderTool from "./tools/create-order";

// Build the OAuth issuer from the project ref so the value survives publish
// unchanged. Vite inlines VITE_SUPABASE_PROJECT_ID as a literal at build time,
// so no runtime env read happens here.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bestellung-pro-mcp",
  title: "Bestellung.pro MCP",
  version: "0.1.0",
  instructions:
    "Tools for a Bestellung.pro account: list suppliers, search articles, list recent orders, fetch a single order with its line items, and create new orders. All calls run as the signed-in user; data is scoped to that user's organization via row-level security.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
    // Accept plain Supabase session tokens in addition to OAuth-client tokens
    // so the in-app "MCP Tools testen" page can invoke tools as the signed-in
    // user. RLS on the forwarded bearer token still enforces per-user data
    // isolation — this only relaxes the client_id/azp claim requirement.
    requireOAuthClientClaim: false,
  }),
  tools: [
    listSuppliersTool,
    listOrdersTool,
    searchArticlesTool,
    getOrderTool,
    createOrderTool,
  ],
});
