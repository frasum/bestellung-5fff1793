import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { email, password } = await req.json();

  const { data: list, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 400 });

  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
