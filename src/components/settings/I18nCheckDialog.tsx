import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Globe, Copy, Check } from 'lucide-react';
import { checkI18nCompleteness, languageNames, type LanguageCode, type I18nCheckResult } from '@/lib/i18n-check';
import { toast } from 'sonner';

interface I18nCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const I18nCheckDialog = ({ open, onOpenChange }: I18nCheckDialogProps) => {
  const [filterLang, setFilterLang] = useState<LanguageCode | 'all'>('all');
  const [copied, setCopied] = useState(false);
  
  const result = useMemo<I18nCheckResult>(() => checkI18nCompleteness(), []);
  
  const filteredMissingKeys = useMemo(() => {
    if (filterLang === 'all') return result.missingKeys;
    return result.missingKeys.filter(mk => mk.missingIn.includes(filterLang));
  }, [result.missingKeys, filterLang]);
  
  const copyMissingKeys = () => {
    const text = filteredMissingKeys
      .map(mk => `${mk.key} (missing in: ${mk.missingIn.join(', ')})`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('In Zwischenablage kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  const allComplete = result.missingKeys.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            i18n Vollständigkeits-Check
          </DialogTitle>
          <DialogDescription>
            Überprüft alle {result.totalKeys} Übersetzungsschlüssel auf Vollständigkeit
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {(Object.entries(result.completeness) as [LanguageCode, typeof result.completeness[LanguageCode]][]).map(([lang, stats]) => (
              <div
                key={lang}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  filterLang === lang 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                } ${stats.percentage === 100 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-amber-50 dark:bg-amber-950/20'}`}
                onClick={() => setFilterLang(filterLang === lang ? 'all' : lang)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{lang.toUpperCase()}</span>
                  {stats.percentage === 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                </div>
                <Progress value={stats.percentage} className="h-1.5 mb-1" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{stats.percentage}%</span>
                  <span>{stats.missing} fehlen</span>
                </div>
              </div>
            ))}
          </div>

          {/* Status Message */}
          {allComplete ? (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Alle Übersetzungen vollständig!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Alle {result.totalKeys} Schlüssel sind in allen 6 Sprachen vorhanden.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {result.missingKeys.length} fehlende Übersetzungen gefunden
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {filterLang === 'all' 
                    ? 'Zeige alle fehlenden Schlüssel' 
                    : `Zeige ${filteredMissingKeys.length} fehlende Schlüssel für ${languageNames[filterLang]}`}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyMissingKeys}
                disabled={filteredMissingKeys.length === 0}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* Missing Keys List */}
          {!allComplete && (
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-3 space-y-2">
                {filteredMissingKeys.map((mk, index) => (
                  <div 
                    key={mk.key} 
                    className="p-2 bg-muted/50 rounded-md text-sm"
                  >
                    <code className="font-mono text-xs bg-background px-1.5 py-0.5 rounded">
                      {mk.key}
                    </code>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {mk.missingIn.map(lang => (
                        <Badge key={lang} variant="destructive" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                      {mk.presentIn.map(lang => (
                        <Badge key={lang} variant="secondary" className="text-xs opacity-50">
                          {lang} ✓
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredMissingKeys.length === 0 && filterLang !== 'all' && (
                  <p className="text-center text-muted-foreground py-4">
                    Keine fehlenden Schlüssel für {languageNames[filterLang]}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
