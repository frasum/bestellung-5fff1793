import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Copy } from "lucide-react";
import { toast } from "sonner";
import manifest from "../../.lovable/mcp/manifest.json";

interface McpTool {
  name: string;
  title: string;
  description: string;
  annotations?: Record<string, boolean>;
  inputSchema: {
    type: string;
    properties?: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}

const MCP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp`;

// Sensible example inputs per tool for one-click testing.
const EXAMPLES: Record<string, unknown> = {
  list_suppliers: { limit: 5 },
  list_orders: { limit: 5 },
  search_articles: { query: "wein", limit: 5 },
  get_order: { order_number: "ORD-2026-01-0001" },
  create_order: {
    supplier_id: "00000000-0000-0000-0000-000000000000",
    items: [{ article_id: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
    is_test_order: true,
  },
};

interface ToolCardProps {
  tool: McpTool;
}

const ToolCard = ({ tool }: ToolCardProps) => {
  const initial = useMemo(
    () => JSON.stringify(EXAMPLES[tool.name] ?? {}, null, 2),
    [tool.name],
  );
  const [input, setInput] = useState(initial);
  const [output, setOutput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const invoke = async () => {
    setStatus("loading");
    setOutput("");
    setDurationMs(null);
    const started = performance.now();

    let args: unknown;
    try {
      args = input.trim() ? JSON.parse(input) : {};
    } catch (err) {
      setStatus("error");
      setOutput(`Ungültiges JSON: ${(err as Error).message}`);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setStatus("error");
      setOutput("Nicht eingeloggt – bitte anmelden.");
      return;
    }

    const body = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name: tool.name, arguments: args },
    };

    try {
      const res = await fetch(MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type") ?? "";
      let parsed: unknown;
      const raw = await res.text();
      if (contentType.includes("text/event-stream")) {
        // Take the first "data: ..." line and parse it.
        const dataLine = raw
          .split("\n")
          .find((l) => l.startsWith("data: "));
        parsed = dataLine ? JSON.parse(dataLine.slice(6)) : raw;
      } else {
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
      }

      setDurationMs(Math.round(performance.now() - started));
      const pretty = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
      setOutput(pretty);

      const isError =
        !res.ok ||
        (typeof parsed === "object" && parsed !== null && "error" in parsed) ||
        (typeof parsed === "object" &&
          parsed !== null &&
          "result" in parsed &&
          (parsed as { result?: { isError?: boolean } }).result?.isError === true);

      setStatus(isError ? "error" : "success");
    } catch (err) {
      setStatus("error");
      setOutput(`Netzwerkfehler: ${(err as Error).message}`);
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success("Response kopiert");
  };

  const required = tool.inputSchema.required ?? [];
  const props = tool.inputSchema.properties ?? {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <code className="text-sm font-mono">{tool.name}</code>
              <span className="text-sm font-normal text-muted-foreground">{tool.title}</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {tool.annotations?.readOnlyHint && <Badge variant="secondary">read-only</Badge>}
            {tool.annotations?.destructiveHint && (
              <Badge variant="destructive">destructive</Badge>
            )}
            {tool.annotations?.readOnlyHint === false && !tool.annotations?.destructiveHint && (
              <Badge>mutation</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.keys(props).length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Parameter: </span>
            {Object.entries(props).map(([key, val], i) => (
              <span key={key}>
                {i > 0 && ", "}
                <code>{key}</code>
                <span>: {val.type}</span>
                {required.includes(key) && <span className="text-destructive"> *</span>}
              </span>
            ))}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-muted-foreground">Input (JSON)</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono text-xs mt-1 min-h-[100px]"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={invoke} disabled={status === "loading"} size="sm">
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Ausführen
          </Button>
          {durationMs !== null && (
            <span className="text-xs text-muted-foreground">{durationMs} ms</span>
          )}
          {status === "success" && <Badge variant="secondary">OK</Badge>}
          {status === "error" && <Badge variant="destructive">Fehler</Badge>}
          {output && (
            <Button variant="ghost" size="sm" onClick={copyOutput}>
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>

        {output && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Response</label>
            <pre
              className={`mt-1 p-3 rounded-md bg-muted text-xs overflow-auto max-h-[400px] font-mono ${
                status === "error" ? "border border-destructive/50" : ""
              }`}
            >
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const McpTest = () => {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setAuthed(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const tools = (manifest.mcp.tools ?? []) as unknown as McpTool[];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">MCP Tools testen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ruft die deployten MCP-Tools direkt gegen{" "}
          <code className="text-xs">{MCP_URL}</code> auf – mit deiner aktuellen
          App-Session. Alle Tools laufen unter der RLS deines Users.
        </p>
      </div>

      {authed === false && (
        <Card className="mb-4 border-destructive/50">
          <CardContent className="p-4 text-sm">
            Du bist nicht eingeloggt. Bitte melde dich an, um Tools auszuführen.
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>
    </div>
  );
};

export default McpTest;
