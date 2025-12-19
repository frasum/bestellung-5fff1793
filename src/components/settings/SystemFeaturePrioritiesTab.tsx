import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { FileJson, FileText, Circle, MessageSquare } from 'lucide-react';
import { SYSTEM_FEATURES, getTotalFeatureCount } from '@/data/systemFeatures';
import {
  useSystemFeaturePriorities,
  useUpsertFeaturePriority,
  useUpdateFeatureNotes,
  useBulkSetCategoryPriority,
  FeaturePriority,
} from '@/hooks/useSystemFeaturePriorities';
import { exportPrioritiesToPdf, exportPrioritiesToJson } from '@/lib/systemPrioritiesExport';
import { useOrganization } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

const PriorityButton = ({
  priority,
  currentPriority,
  onClick,
  disabled,
}: {
  priority: FeaturePriority;
  currentPriority: FeaturePriority;
  onClick: () => void;
  disabled: boolean;
}) => {
  const isActive = priority === currentPriority;

  const colors: Record<string, string> = {
    green: 'bg-green-500 hover:bg-green-600 border-green-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
    red: 'bg-red-500 hover:bg-red-600 border-red-600',
  };

  const inactiveColors: Record<string, string> = {
    green: 'border-green-300 hover:border-green-500 hover:bg-green-50',
    yellow: 'border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50',
    red: 'border-red-300 hover:border-red-500 hover:bg-red-50',
  };

  if (!priority) return null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
        isActive ? colors[priority] : inactiveColors[priority],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={
        priority === 'green' ? 'Kritisch' : priority === 'yellow' ? 'Wichtig' : 'Unwichtig'
      }
    >
      {isActive && <Circle className="w-2 h-2 fill-white text-white" />}
    </button>
  );
};

const FeatureRow = ({
  category,
  featureKey,
  labelDe,
  labelEn,
  currentPriority,
  notes,
}: {
  category: string;
  featureKey: string;
  labelDe: string;
  labelEn: string;
  currentPriority: FeaturePriority;
  notes: string | null;
}) => {
  const { i18n } = useTranslation();
  const [showNotes, setShowNotes] = useState(false);
  const [noteValue, setNoteValue] = useState(notes || '');
  const upsertMutation = useUpsertFeaturePriority();
  const notesMutation = useUpdateFeatureNotes();

  const label = i18n.language === 'de' ? labelDe : labelEn;

  const handlePriorityClick = (priority: FeaturePriority) => {
    const newPriority = currentPriority === priority ? null : priority;
    upsertMutation.mutate({ category, featureKey, priority: newPriority });
  };

  const handleNotesBlur = () => {
    if (noteValue !== (notes || '')) {
      notesMutation.mutate({ category, featureKey, notes: noteValue });
    }
  };

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 py-2.5 px-2">
        <div className="flex gap-1.5">
          <PriorityButton
            priority="green"
            currentPriority={currentPriority}
            onClick={() => handlePriorityClick('green')}
            disabled={upsertMutation.isPending}
          />
          <PriorityButton
            priority="yellow"
            currentPriority={currentPriority}
            onClick={() => handlePriorityClick('yellow')}
            disabled={upsertMutation.isPending}
          />
          <PriorityButton
            priority="red"
            currentPriority={currentPriority}
            onClick={() => handlePriorityClick('red')}
            disabled={upsertMutation.isPending}
          />
        </div>
        <span className="flex-1 text-sm">{label}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => setShowNotes(!showNotes)}
        >
          <MessageSquare
            className={cn('h-4 w-4', notes ? 'text-primary' : 'text-muted-foreground')}
          />
        </Button>
      </div>
      {showNotes && (
        <div className="px-2 pb-2">
          <Input
            placeholder="Notizen für den Entwickler..."
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={handleNotesBlur}
            className="text-sm h-8"
          />
        </div>
      )}
    </div>
  );
};

export const SystemFeaturePrioritiesTab = () => {
  const { t, i18n } = useTranslation();
  const { data: priorities, isLoading } = useSystemFeaturePriorities();
  const { data: organization } = useOrganization();
  const bulkMutation = useBulkSetCategoryPriority();

  const totalFeatures = getTotalFeatureCount();

  const stats = useMemo(() => {
    if (!priorities) return { green: 0, yellow: 0, red: 0, unrated: totalFeatures };

    const green = priorities.filter((p) => p.priority === 'green').length;
    const yellow = priorities.filter((p) => p.priority === 'yellow').length;
    const red = priorities.filter((p) => p.priority === 'red').length;
    const rated = green + yellow + red;

    return { green, yellow, red, unrated: totalFeatures - rated };
  }, [priorities, totalFeatures]);

  const progressPercent = ((totalFeatures - stats.unrated) / totalFeatures) * 100;

  const getPriorityForFeature = (category: string, featureKey: string): FeaturePriority => {
    const found = priorities?.find(
      (p) => p.category === category && p.feature_key === featureKey
    );
    return found?.priority || null;
  };

  const getNotesForFeature = (category: string, featureKey: string): string | null => {
    const found = priorities?.find(
      (p) => p.category === category && p.feature_key === featureKey
    );
    return found?.notes || null;
  };

  const handleBulkSet = (category: string, featureKeys: string[], priority: FeaturePriority) => {
    bulkMutation.mutate({ category, featureKeys, priority });
  };

  const handleExportPdf = () => {
    if (priorities) {
      exportPrioritiesToPdf(priorities, organization?.name);
    }
  };

  const handleExportJson = () => {
    if (priorities) {
      exportPrioritiesToJson(priorities, organization?.name);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {i18n.language === 'de' ? 'Entwickler-Checkliste' : 'Developer Checklist'}
            </CardTitle>
            <CardDescription className="mt-1">
              {i18n.language === 'de'
                ? 'Bewerte alle System-Funktionen mit Ampel-Prioritäten für den Entwickler.'
                : 'Rate all system features with traffic light priorities for the developer.'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <FileText className="h-4 w-4 mr-1.5" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJson}>
              <FileJson className="h-4 w-4 mr-1.5" />
              JSON
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-green-500 text-green-600">
              🟢 {stats.green} {i18n.language === 'de' ? 'Kritisch' : 'Critical'}
            </Badge>
            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
              🟡 {stats.yellow} {i18n.language === 'de' ? 'Wichtig' : 'Important'}
            </Badge>
            <Badge variant="outline" className="border-red-500 text-red-600">
              🔴 {stats.red} {i18n.language === 'de' ? 'Unwichtig' : 'Unimportant'}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              ⚪ {stats.unrated} {i18n.language === 'de' ? 'Nicht bewertet' : 'Unrated'}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {Math.round(progressPercent)}%{' '}
              {i18n.language === 'de' ? 'bewertet' : 'rated'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {SYSTEM_FEATURES.map((category) => {
            const categoryLabel = i18n.language === 'de' ? category.labelDe : category.labelEn;
            const featureKeys = category.features.map((f) => f.key);
            const categoryPriorities = category.features.map((f) =>
              getPriorityForFeature(category.key, f.key)
            );
            const ratedCount = categoryPriorities.filter((p) => p !== null).length;

            return (
              <AccordionItem
                key={category.key}
                value={category.key}
                className="border rounded-lg px-3"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium text-sm">{categoryLabel}</span>
                    <Badge variant="secondary" className="ml-auto mr-2 text-xs">
                      {ratedCount}/{category.features.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Bulk actions */}
                  <div className="flex gap-2 mb-3 pt-1">
                    <span className="text-xs text-muted-foreground">
                      {i18n.language === 'de' ? 'Alle setzen:' : 'Set all:'}
                    </span>
                    <button
                      className="w-5 h-5 rounded-full bg-green-500 hover:bg-green-600 border-2 border-green-600"
                      onClick={() => handleBulkSet(category.key, featureKeys, 'green')}
                      title={i18n.language === 'de' ? 'Alle Kritisch' : 'All Critical'}
                    />
                    <button
                      className="w-5 h-5 rounded-full bg-yellow-500 hover:bg-yellow-600 border-2 border-yellow-600"
                      onClick={() => handleBulkSet(category.key, featureKeys, 'yellow')}
                      title={i18n.language === 'de' ? 'Alle Wichtig' : 'All Important'}
                    />
                    <button
                      className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 border-2 border-red-600"
                      onClick={() => handleBulkSet(category.key, featureKeys, 'red')}
                      title={i18n.language === 'de' ? 'Alle Unwichtig' : 'All Unimportant'}
                    />
                  </div>

                  {/* Features list */}
                  <div className="border rounded-md">
                    {category.features.map((feature) => (
                      <FeatureRow
                        key={feature.key}
                        category={category.key}
                        featureKey={feature.key}
                        labelDe={feature.labelDe}
                        labelEn={feature.labelEn}
                        currentPriority={getPriorityForFeature(category.key, feature.key)}
                        notes={getNotesForFeature(category.key, feature.key)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SystemFeaturePrioritiesTab;
