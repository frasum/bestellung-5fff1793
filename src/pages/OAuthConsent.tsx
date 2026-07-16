import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";

// Beta @supabase/supabase-js namespace — typed locally so this file compiles
// cleanly under strictNullChecks / noImplicitAny.
type AuthorizationDetails = {
  client?: { name?: string; client_name?: string; logo_uri?: string } | null;
  scope?: string | null;
  scopes?: string[] | null;
  redirect_uri?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthResult = {
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type SupabaseOAuth = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthResult | null; error: { message: string } | null }>;
};

function getOAuth(): SupabaseOAuth {
  const authAny = supabase.auth as unknown as { oauth?: SupabaseOAuth };
  if (!authAny.oauth) {
    throw new Error(
      "OAuth server helpers are not available in this Supabase client build.",
    );
  }
  return authAny.oauth;
}

function humanScope(scope: string): string {
  if (scope === "openid") return "Verify your identity";
  if (scope === "email") return "Share your email address";
  if (scope === "profile") return "Share your basic profile";
  return `Additional permission: ${scope}`;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the request URL.");
        setLoading(false);
        return;
      }
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) {
          const next = window.location.pathname + window.location.search;
          window.location.href = "/auth?next=" + encodeURIComponent(next);
          return;
        }
        const oauth = getOAuth();
        const { data, error: detErr } = await oauth.getAuthorizationDetails(
          authorizationId,
        );
        if (!active) return;
        if (detErr) {
          setError(detErr.message);
          setLoading(false);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load authorization.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const oauth = getOAuth();
      const { data, error: actErr } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      if (actErr) {
        setError(actErr.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization action failed.");
      setBusy(false);
    }
  }

  const scopeList: string[] =
    details?.scopes ??
    (details?.scope ? details.scope.split(/\s+/).filter(Boolean) : []);
  const clientName =
    details?.client?.name ?? details?.client?.client_name ?? "an app";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img
            src={logoImage}
            alt="Bestellung.pro"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="font-bold text-2xl text-foreground">Bestellung.pro</span>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Authorisierung wird geladen…
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground mb-2">
                Autorisierung fehlgeschlagen
              </h1>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Erneut versuchen
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold text-foreground">
                  {clientName} mit Bestellung.pro verbinden
                </h1>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {clientName} kann die aktivierten Tools dieser App aufrufen,
                während Sie angemeldet sind. Ihre Berechtigungen und die
                Datenbank-Richtlinien der App bleiben weiterhin gültig.
              </p>

              {scopeList.length > 0 && (
                <ul className="mb-6 space-y-1 text-sm text-foreground/90">
                  {scopeList.map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{humanScope(s)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => decide(true)}
                  disabled={busy}
                  className="w-full"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Zugriff erlauben"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => decide(false)}
                  disabled={busy}
                  className="w-full"
                >
                  Abbrechen
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
