import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { FileUp, Loader2, CheckCircle2, AlertCircle, HelpCircle, Wine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Dynamic import for pdfjs-dist to avoid top-level await issues
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

const loadPdfJs = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
};

interface ExtractedWine {
  name: string;
  description?: string;
  grape_variety?: string;
  origin_country?: string;
  flavor_profile?: string;
  food_pairings?: string;
}

interface MatchResult {
  extracted: ExtractedWine;
  matchedArticle?: {
    id: string;
    name: string;
  };
  confidence: 'high' | 'medium' | 'low' | 'none';
  updated?: boolean;
}

interface ImportStats {
  totalExtracted: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  noMatch: number;
  updated: number;
}

interface WineImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function WineImportDialog({ open, onOpenChange, onImportComplete }: WineImportDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState(0);

  // Fetch organization_id from profiles
  useEffect(() => {
    if (!user?.id) return;
    
    supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.organization_id) {
          setOrganizationId(data.organization_id);
        }
      });
  }, [user?.id]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organizationId) return;

    setIsAnalyzing(true);
    setStep('upload');

    try {
      // Dynamically load pdfjs-dist
      const pdfjs = await loadPdfJs();
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Use pdfjs-dist to render pages
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const renderedPages: string[] = [];

      toast.info(t('wines.import.analyzingPages', 'Analysiere {{count}} Seiten...', { count: numPages }));

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // Higher scale for better quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        
        const dataUrl = canvas.toDataURL('image/png');
        renderedPages.push(dataUrl);
      }

      // Send to Edge Function
      const { data, error } = await supabase.functions.invoke('import-wine-descriptions', {
        body: {
          pageImages: renderedPages,
          organizationId,
          dryRun: true,
        },
      });

      if (error) throw error;

      setResults(data.results || []);
      setStats(data.stats || null);
      
      // Pre-select high and medium confidence matches
      const preSelected = new Set<string>();
      (data.results || []).forEach((r: MatchResult) => {
        if (r.matchedArticle && (r.confidence === 'high' || r.confidence === 'medium')) {
          preSelected.add(r.matchedArticle.id);
        }
      });
      setSelectedIds(preSelected);
      
      setStep('preview');
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      toast.error(t('wines.import.analyzeError', 'Fehler beim Analysieren der Weinkarte'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [organizationId, t]);

  const handleImport = useCallback(async () => {
    if (!organizationId || selectedIds.size === 0) return;

    setStep('importing');
    setImportProgress(0);

    try {
      const toImport = results.filter(r => r.matchedArticle && selectedIds.has(r.matchedArticle.id));
      let successCount = 0;

      for (let i = 0; i < toImport.length; i++) {
        const result = toImport[i];
        if (!result.matchedArticle) continue;

        const updateData: Record<string, string> = {};
        if (result.extracted.description) updateData.description = result.extracted.description;
        if (result.extracted.grape_variety) updateData.grape_variety = result.extracted.grape_variety;
        if (result.extracted.origin_country) updateData.origin_country = result.extracted.origin_country;
        if (result.extracted.flavor_profile) updateData.flavor_profile = result.extracted.flavor_profile;
        if (result.extracted.food_pairings) updateData.food_pairings = result.extracted.food_pairings;

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('articles')
            .update(updateData)
            .eq('id', result.matchedArticle.id);

          if (!error) successCount++;
        }

        setImportProgress(((i + 1) / toImport.length) * 100);
      }

      toast.success(t('wines.import.success', '{{count}} Weine aktualisiert', { count: successCount }));
      onImportComplete();
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Error importing wines:', error);
      toast.error(t('wines.import.importError', 'Fehler beim Importieren'));
    }
  }, [organizationId, selectedIds, results, t, onImportComplete, onOpenChange]);

  const resetState = () => {
    setStep('upload');
    setResults([]);
    setStats(null);
    setSelectedIds(new Set());
    setImportProgress(0);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">Hoch</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">Mittel</Badge>;
      case 'low':
        return <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30">Niedrig</Badge>;
      default:
        return <Badge variant="secondary">Kein Match</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wine className="h-5 w-5" />
            {t('wines.import.title', 'Weinkarte importieren')}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && t('wines.import.uploadDescription', 'Laden Sie eine PDF-Weinkarte hoch, um Beschreibungen automatisch zuzuordnen.')}
            {step === 'preview' && t('wines.import.previewDescription', 'Überprüfen Sie die Zuordnungen und wählen Sie die zu importierenden Einträge.')}
            {step === 'importing' && t('wines.import.importingDescription', 'Die Beschreibungen werden importiert...')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground">{t('wines.import.analyzing', 'Analysiere PDF mit AI Vision...')}</p>
                </>
              ) : (
                <>
                  <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileUp className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-center max-w-sm">
                    {t('wines.import.dropzone', 'PDF-Weinkarte hier hochladen')}
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button asChild>
                      <span>{t('wines.import.selectFile', 'PDF auswählen')}</span>
                    </Button>
                  </label>
                </>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats */}
              {stats && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="gap-1">
                    <Wine className="h-3 w-3" />
                    {stats.totalExtracted} {t('wines.import.extracted', 'extrahiert')}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {stats.highConfidence} {t('wines.import.highMatch', 'sicher')}
                  </Badge>
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {stats.mediumConfidence} {t('wines.import.mediumMatch', 'wahrscheinlich')}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <HelpCircle className="h-3 w-3" />
                    {stats.noMatch} {t('wines.import.noMatch', 'kein Match')}
                  </Badge>
                </div>
              )}

              {/* Results list */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {results.filter(r => r.matchedArticle).map((result, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        selectedIds.has(result.matchedArticle!.id)
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(result.matchedArticle!.id)}
                          onCheckedChange={() => toggleSelection(result.matchedArticle!.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{result.extracted.name}</span>
                            {getConfidenceBadge(result.confidence)}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            → {result.matchedArticle?.name}
                          </div>
                          {result.extracted.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {result.extracted.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* No matches section */}
                  {results.filter(r => !r.matchedArticle).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('wines.import.noMatchSection', 'Nicht zugeordnet:')}
                      </p>
                      {results.filter(r => !r.matchedArticle).map((result, idx) => (
                        <div key={`no-${idx}`} className="p-2 rounded bg-muted/30 text-sm text-muted-foreground">
                          {result.extracted.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">{t('wines.import.importing', 'Importiere Beschreibungen...')}</p>
              <Progress value={importProgress} className="w-64" />
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { resetState(); }}>
                {t('common.cancel', 'Abbrechen')}
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedIds.size === 0}
              >
                {t('wines.import.importSelected', '{{count}} importieren', { count: selectedIds.size })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
