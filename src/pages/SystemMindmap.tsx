import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Check, Copy, Download } from 'lucide-react';
import { SYSTEM_MINDMAP_MARKDOWN, SYSTEM_MINDMAP_MERMAID, SYSTEM_MINDMAP_PROMPT } from '@/data/systemMindmap';

type CopiedSection = 'mermaid' | 'prompt' | 'markdown' | null;

export default function SystemMindmap() {
  const navigate = useNavigate();
  const [copiedSection, setCopiedSection] = useState<CopiedSection>(null);
  const [advancedMode, setAdvancedMode] = useState(() => localStorage.getItem('advanced-settings-enabled') === 'true');

  useEffect(() => {
    if (!advancedMode) navigate('/settings');
  }, [advancedMode, navigate]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') setAdvancedMode(e.newValue === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const copyToClipboard = async (text: string, section: CopiedSection) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast({ title: 'In Zwischenablage kopiert', duration: 2000 });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadMarkdown = async () => {
    const blob = new Blob([SYSTEM_MINDMAP_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bestellung-system-mindmap.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const mermaidValue = useMemo(() => SYSTEM_MINDMAP_MERMAID, []);
  const promptValue = useMemo(() => SYSTEM_MINDMAP_PROMPT, []);
  const markdownValue = useMemo(() => SYSTEM_MINDMAP_MARKDOWN, []);

  if (!advancedMode) return null;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Zurück">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">System Mindmap (Mermaid)</h1>
            </div>
            <p className="text-muted-foreground">Sehr detaillierte Systembeschreibung zum Kopieren in deine KI-App.</p>
          </div>
          <Button variant="outline" onClick={downloadMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Download .md
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inhalt</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="mermaid">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <TabsList>
                  <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
                  <TabsTrigger value="prompt">Prompt</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown (.md)</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="mermaid" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Mermaid mindmap</h2>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(mermaidValue, 'mermaid')} className="h-8 px-2">
                    {copiedSection === 'mermaid' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea value={mermaidValue} readOnly className="min-h-[520px] font-mono text-xs" />
              </TabsContent>

              <TabsContent value="prompt" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">KI-Prompt</h2>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(promptValue, 'prompt')} className="h-8 px-2">
                    {copiedSection === 'prompt' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea value={promptValue} readOnly className="min-h-[360px] font-mono text-xs" />
              </TabsContent>

              <TabsContent value="markdown" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Markdown Export</h2>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(markdownValue, 'markdown')} className="h-8 px-2">
                    {copiedSection === 'markdown' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Textarea value={markdownValue} readOnly className="min-h-[520px] font-mono text-xs" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
