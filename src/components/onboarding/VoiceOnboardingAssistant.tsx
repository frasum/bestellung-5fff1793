import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCreateSupplier } from "@/hooks/useSuppliers";
import { useCreateArticle } from "@/hooks/useArticles";
import { useCategories } from "@/hooks/useCategories";
import { useUnits } from "@/hooks/useUnits";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Loader2, CheckCircle2, X, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface OnboardingStats {
  suppliersCreated: number;
  articlesCreated: number;
}

export function VoiceOnboardingAssistant() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [stats, setStats] = useState<OnboardingStats>({ suppliersCreated: 0, articlesCreated: 0 });
  const [currentSupplier, setCurrentSupplier] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);

  const createSupplier = useCreateSupplier();
  const createArticle = useCreateArticle();
  const { data: categories } = useCategories();
  const { data: units } = useUnits();
  const { data: suppliers, refetch: refetchSuppliers } = useSuppliers();

  const conversation = useConversation({
    clientTools: {
      create_supplier: async (params: { name: string; email?: string; customer_number?: string }) => {
        try {
          const result = await createSupplier.mutateAsync({
            name: params.name,
            email: params.email || `${params.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
            customer_number: params.customer_number,
          });
          setStats(prev => ({ ...prev, suppliersCreated: prev.suppliersCreated + 1 }));
          setCurrentSupplier(result.id);
          await refetchSuppliers();
          return `Lieferant "${params.name}" wurde erfolgreich erstellt.`;
        } catch (error) {
          console.error("Error creating supplier:", error);
          return `Fehler beim Erstellen des Lieferanten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
        }
      },

      create_article: async (params: { name: string; unit: string; price?: number; category?: string; supplier_id?: string }) => {
        try {
          const supplierId = params.supplier_id || currentSupplier;
          if (!supplierId) {
            return "Bitte erstelle zuerst einen Lieferanten oder wähle einen aus.";
          }
          
          await createArticle.mutateAsync({
            name: params.name,
            unit: params.unit || "Stück",
            price: params.price || 0,
            category: params.category,
            supplier_id: supplierId,
          });
          setStats(prev => ({ ...prev, articlesCreated: prev.articlesCreated + 1 }));
          return `Artikel "${params.name}" wurde erfolgreich erstellt.`;
        } catch (error) {
          console.error("Error creating article:", error);
          return `Fehler beim Erstellen des Artikels: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
        }
      },

      get_suppliers: async () => {
        const supplierList = suppliers?.map(s => s.name).join(", ") || "Keine Lieferanten vorhanden";
        return `Vorhandene Lieferanten: ${supplierList}`;
      },

      get_categories: async () => {
        const categoryList = categories?.map(c => c.name).join(", ") || "Keine Kategorien vorhanden";
        return `Vorhandene Kategorien: ${categoryList}`;
      },

      get_units: async () => {
        const unitList = units?.map(u => u.name).join(", ") || "Keine Einheiten vorhanden";
        return `Vorhandene Einheiten: ${unitList}`;
      },

      switch_supplier: async (params: { supplier_name: string }) => {
        const supplier = suppliers?.find(s => 
          s.name.toLowerCase().includes(params.supplier_name.toLowerCase())
        );
        if (supplier) {
          setCurrentSupplier(supplier.id);
          return `Gewechselt zu Lieferant "${supplier.name}". Neue Artikel werden diesem Lieferanten zugeordnet.`;
        }
        return `Lieferant "${params.supplier_name}" nicht gefunden.`;
      },

      finish_onboarding: async () => {
        toast.success("Onboarding abgeschlossen!", {
          description: `${stats.suppliersCreated} Lieferanten und ${stats.articlesCreated} Artikel erstellt.`,
        });
        setTimeout(() => navigate("/suppliers"), 1500);
        return "Onboarding abgeschlossen! Du wirst jetzt zum Katalog weitergeleitet.";
      },
    },

    onConnect: () => {
      toast.success("Verbunden mit Sprach-Assistent");
    },

    onDisconnect: () => {
    },

    onMessage: (message) => {
      const msg = message as { type?: string; user_transcription_event?: { user_transcript?: string }; agent_response_event?: { agent_response?: string } };
      if (msg.type === "user_transcript") {
        setTranscript(prev => [...prev, `Du: ${msg.user_transcription_event?.user_transcript || ''}`]);
      } else if (msg.type === "agent_response") {
        setTranscript(prev => [...prev, `Assistent: ${msg.agent_response_event?.agent_response || ''}`]);
      }
    },

    onError: (error) => {
      console.error("Conversation error:", error);
      toast.error("Verbindungsfehler", {
        description: "Bitte versuche es erneut.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token");

      if (error || !data?.token) {
        throw new Error(error?.message || "Kein Token erhalten");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error("Verbindung fehlgeschlagen", {
        description: error instanceof Error ? error.message : "Bitte Mikrofon-Berechtigung erteilen",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const skipOnboarding = () => {
    navigate("/suppliers");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/src/assets/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="font-semibold text-lg">Bestellung.pro</span>
        </div>
        <Button variant="ghost" size="sm" onClick={skipOnboarding}>
          <X className="h-4 w-4 mr-1" />
          Überspringen
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">
        {/* Stats Cards */}
        <div className="flex gap-4">
          <Card className="p-4 flex items-center gap-3 min-w-[140px]">
            <div className="p-2 rounded-full bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.suppliersCreated}</p>
              <p className="text-xs text-muted-foreground">Lieferanten</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 min-w-[140px]">
            <div className="p-2 rounded-full bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.articlesCreated}</p>
              <p className="text-xs text-muted-foreground">Artikel</p>
            </div>
          </Card>
        </div>

        {/* Voice Interface */}
        <div className="flex flex-col items-center gap-6">
          {/* Avatar / Visualization */}
          <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            conversation.isSpeaking 
              ? 'bg-primary/20 ring-4 ring-primary/30 animate-pulse' 
              : conversation.status === 'connected'
              ? 'bg-primary/10 ring-2 ring-primary/20'
              : 'bg-muted'
          }`}>
            {conversation.isSpeaking ? (
              <Volume2 className="h-12 w-12 text-primary animate-pulse" />
            ) : conversation.status === 'connected' ? (
              <Mic className="h-12 w-12 text-primary" />
            ) : (
              <MicOff className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* Status Text */}
          <p className="text-center text-muted-foreground">
            {isConnecting 
              ? "Verbinde mit Sprach-Assistent..."
              : conversation.status === 'connected'
              ? conversation.isSpeaking 
                ? "Assistent spricht..."
                : "Ich höre zu... Sprich einfach los!"
              : "Klicke auf den Button, um zu starten"
            }
          </p>

          {/* Control Button */}
          {conversation.status === 'disconnected' ? (
            <Button 
              size="lg" 
              onClick={startConversation} 
              disabled={isConnecting}
              className="gap-2 px-8"
            >
              {isConnecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              Gespräch starten
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="destructive" 
              onClick={stopConversation}
              className="gap-2 px-8"
            >
              <MicOff className="h-5 w-5" />
              Gespräch beenden
            </Button>
          )}
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <Card className="w-full max-w-lg p-4 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {transcript.slice(-5).map((line, i) => (
                <p key={i} className={`text-sm ${line.startsWith('Du:') ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {line}
                </p>
              ))}
            </div>
          </Card>
        )}

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground max-w-md">
          <p className="font-medium mb-2">Beispiele, was du sagen kannst:</p>
          <ul className="space-y-1">
            <li>"Erstelle einen Lieferanten namens Metro"</li>
            <li>"Füge Tomaten für 2,50€ pro Kilo hinzu"</li>
            <li>"Welche Lieferanten habe ich schon?"</li>
            <li>"Ich bin fertig mit dem Onboarding"</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground">
        {currentSupplier && suppliers && (
          <p>Aktueller Lieferant: <span className="font-medium">{suppliers.find(s => s.id === currentSupplier)?.name}</span></p>
        )}
      </footer>
    </div>
  );
}
