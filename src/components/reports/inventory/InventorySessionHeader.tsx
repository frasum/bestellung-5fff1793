import { useTranslation } from 'react-i18next';
import { format, Locale } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  FileText, 
  FileSpreadsheet, 
  Save, 
  CheckCircle 
} from 'lucide-react';

interface SessionStats {
  totalArticles: number;
  capturedArticles: number;
  totalValue: number;
  progressPercent: number;
}

interface InventorySession {
  id: string;
  name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface InventorySessionHeaderProps {
  session: InventorySession;
  stats: SessionStats;
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onComplete: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export function InventorySessionHeader({
  session,
  stats,
  hasChanges,
  isSaving,
  onSave,
  onComplete,
  onExportPdf,
  onExportExcel,
}: InventorySessionHeaderProps) {
  const { t, i18n } = useTranslation();
  
  const getDateLocale = (): Locale => {
    const locales: Record<string, Locale> = { de, en: enUS, fr, it, th, vi };
    return locales[i18n.language] || de;
  };
  
  const isCompleted = session.status === 'completed';
  
  return (
    <Card>
      <CardHeader className="pb-3 px-4 lg:px-6">
        {/* Read-only notice for completed sessions */}
        {isCompleted && (
          <div className="mb-3 p-2 bg-muted rounded-md text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {t('inventory.viewingCompleted', 'Sie sehen eine abgeschlossene Inventur (nur Ansicht).')}
          </div>
        )}
        
        {/* Mobile View */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">{session.name}</CardTitle>
                <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-xs">
                  {isCompleted ? t('inventory.completed') : t('inventory.inProgress')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isCompleted && session.completed_at
                  ? format(new Date(session.completed_at), 'dd.MM.yy HH:mm', { locale: getDateLocale() })
                  : format(new Date(session.created_at), 'dd.MM.yy HH:mm', { locale: getDateLocale() })}
              </p>
            </div>
          </div>

          {/* Progress Stats - Mobile */}
          <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{stats.progressPercent}%</div>
              <div className="text-xs text-muted-foreground">{t('inventory.progress', 'Fortschritt')}</div>
            </div>
            <div className="text-center border-x">
              <div className="text-lg font-bold">{stats.capturedArticles}/{stats.totalArticles}</div>
              <div className="text-xs text-muted-foreground">{t('inventory.captured')}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">€{stats.totalValue.toFixed(0)}</div>
              <div className="text-xs text-muted-foreground">{t('inventory.value')}</div>
            </div>
          </div>

          <div className={`grid gap-2 ${isCompleted ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <Button variant="outline" size="sm" onClick={onExportPdf} className="h-10">
              <FileText className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onExportExcel} className="h-10">
              <FileSpreadsheet className="w-4 h-4" />
            </Button>
            {!isCompleted && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSave}
                  disabled={!hasChanges || isSaving}
                  className="h-10"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={onComplete} className="h-10">
                  <CheckCircle className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Desktop View */}
        <div className="hidden sm:block">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{session.name}</CardTitle>
                  <Badge variant={isCompleted ? 'default' : 'secondary'}>
                    {isCompleted ? t('inventory.completed') : t('inventory.inProgress')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isCompleted && session.completed_at
                    ? `${t('inventory.completedAt')} ${format(new Date(session.completed_at), 'dd.MM.yyyy HH:mm', { locale: getDateLocale() })}`
                    : `${t('inventory.startedAt')} ${format(new Date(session.created_at), 'dd.MM.yyyy HH:mm', { locale: getDateLocale() })}`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={onExportPdf}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
              {!isCompleted && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSave}
                    disabled={!hasChanges || isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save')}
                  </Button>
                  <Button size="sm" onClick={onComplete}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('inventory.completeSession')}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress Stats - Desktop */}
          <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.progressPercent}%</div>
              <div className="text-sm text-muted-foreground">{t('inventory.progress', 'Fortschritt')}</div>
            </div>
            <div className="text-center border-x">
              <div className="text-2xl font-bold">{stats.capturedArticles}</div>
              <div className="text-sm text-muted-foreground">{t('inventory.captured')} ({t('inventory.of')} {stats.totalArticles})</div>
            </div>
            <div className="text-center border-r">
              <div className="text-2xl font-bold text-green-600">
                €{stats.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">{t('inventory.totalValue')}</div>
            </div>
            <div className="text-center">
              <div className="w-full bg-muted rounded-full h-3 mt-1">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.capturedArticles} / {stats.totalArticles} {t('inventory.articles')}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
