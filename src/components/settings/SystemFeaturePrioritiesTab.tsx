import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileJson, FileText, Circle, MessageSquare, Check, Plus, ChevronDown, StickyNote, Loader2 } from 'lucide-react';
import { SYSTEM_FEATURES, getTotalFeatureCount, SystemFeatureCategory } from '@/data/systemFeatures';
import {
  useSystemFeaturePriorities,
  useUpsertFeaturePriority,
  useUpdateFeatureNotes,
  useBulkSetCategoryPriority,
  useToggleFeatureWorkedOn,
  FeaturePriority,
} from '@/hooks/useSystemFeaturePriorities';
import { useEdgeFunctionRegistry } from '@/hooks/useEdgeFunctionRegistry';
import { exportPrioritiesToPdf, exportPrioritiesToJson } from '@/lib/systemPrioritiesExport';
import { useOrganizationDetails, useUpdateChecklistNotes } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useAddEdgeFunction } from '@/hooks/useEdgeFunctionRegistry';
import { toast } from 'sonner';
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

const WorkedOnButton = ({
  isWorkedOn,
  onClick,
  disabled,
}: {
  isWorkedOn: boolean;
  onClick: () => void;
  disabled: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
        isWorkedOn
          ? 'bg-blue-500 hover:bg-blue-600 border-blue-600'
          : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={isWorkedOn ? 'Bearbeitet' : 'Als bearbeitet markieren'}
    >
      {isWorkedOn && <Check className="w-3 h-3 text-white" />}
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
  isWorkedOn,
}: {
  category: string;
  featureKey: string;
  labelDe: string;
  labelEn: string;
  currentPriority: FeaturePriority;
  notes: string | null;
  isWorkedOn: boolean;
}) => {
  const { i18n } = useTranslation();
  const [showNotes, setShowNotes] = useState(false);
  const [noteValue, setNoteValue] = useState(notes || '');
  const upsertMutation = useUpsertFeaturePriority();
  const notesMutation = useUpdateFeatureNotes();
  const workedOnMutation = useToggleFeatureWorkedOn();

  const label = i18n.language === 'de' ? labelDe : labelEn;

  // Sync noteValue when notes prop changes
  useEffect(() => {
    setNoteValue(notes || '');
  }, [notes]);

  const handlePriorityClick = (priority: FeaturePriority) => {
    const newPriority = currentPriority === priority ? null : priority;
    upsertMutation.mutate({ category, featureKey, priority: newPriority });
  };

  const handleWorkedOnClick = () => {
    workedOnMutation.mutate({ category, featureKey, isWorkedOn: !isWorkedOn });
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
          <div className="w-px h-4 bg-border mx-1" />
          <WorkedOnButton
            isWorkedOn={isWorkedOn}
            onClick={handleWorkedOnClick}
            disabled={workedOnMutation.isPending}
          />
        </div>
        <span className={cn('flex-1 text-sm', isWorkedOn && 'line-through text-muted-foreground')}>
          {label}
        </span>
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

const AddEdgeFunctionDialog = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [functionName, setFunctionName] = useState('');
  const [labelDe, setLabelDe] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const addMutation = useAddEdgeFunction();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!functionName || !labelDe || !labelEn) return;
    
    addMutation.mutate(
      { functionName, labelDe, labelEn },
      {
        onSuccess: () => {
          setOpen(false);
          setFunctionName('');
          setLabelDe('');
          setLabelEn('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7">
          <Plus className="h-3 w-3 mr-1" />
          {i18n.language === 'de' ? 'Function hinzufügen' : 'Add Function'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {i18n.language === 'de' ? 'Edge Function registrieren' : 'Register Edge Function'}
          </DialogTitle>
          <DialogDescription>
            {i18n.language === 'de'
              ? 'Neue Edge Function zur Checkliste hinzufügen'
              : 'Add new Edge Function to the checklist'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="functionName">Function Name</Label>
            <Input
              id="functionName"
              placeholder="z.B. my-new-function"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labelDe">Label (Deutsch)</Label>
            <Input
              id="labelDe"
              placeholder="z.B. Meine neue Funktion"
              value={labelDe}
              onChange={(e) => setLabelDe(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labelEn">Label (English)</Label>
            <Input
              id="labelEn"
              placeholder="e.g. My new function"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={addMutation.isPending || !functionName || !labelDe || !labelEn}>
            {addMutation.isPending ? 'Wird gespeichert...' : 'Registrieren'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const SystemFeaturePrioritiesTab = () => {
  const { t, i18n } = useTranslation();
  const { data: priorities, isLoading } = useSystemFeaturePriorities();
  const { data: edgeFunctions, isLoading: edgeFunctionsLoading } = useEdgeFunctionRegistry();
  const { data: organization } = useOrganizationDetails();
  const bulkMutation = useBulkSetCategoryPriority();
  const notesMutation = useUpdateChecklistNotes();
  const isSuperAdmin = useIsSuperAdmin();
  const [activeFilter, setActiveFilter] = useState<FeaturePriority | 'unrated' | 'worked_on' | 'not_worked_on' | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [globalNotes, setGlobalNotes] = useState('');

  // Sync global notes when organization loads
  useEffect(() => {
    if (organization?.developer_checklist_notes !== undefined) {
      setGlobalNotes(organization.developer_checklist_notes || '');
    }
  }, [organization?.developer_checklist_notes]);

  const handleGlobalNotesBlur = () => {
    if (organization && globalNotes !== (organization.developer_checklist_notes || '')) {
      notesMutation.mutate(
        { id: organization.id, notes: globalNotes },
        { onSuccess: () => toast.success(i18n.language === 'de' ? 'Notizen gespeichert' : 'Notes saved') }
      );
    }
  };

  // Combine static features with dynamic edge functions
  const allFeatures = useMemo((): SystemFeatureCategory[] => {
    const staticFeatures = [...SYSTEM_FEATURES];
    
    if (edgeFunctions && edgeFunctions.length > 0) {
      const edgeFunctionsCategory: SystemFeatureCategory = {
        key: 'edge_functions',
        labelDe: 'Edge Functions',
        labelEn: 'Edge Functions',
        features: edgeFunctions.map(ef => ({
          key: ef.function_name,
          labelDe: ef.label_de,
          labelEn: ef.label_en,
        })),
      };
      staticFeatures.push(edgeFunctionsCategory);
    }
    
    return staticFeatures;
  }, [edgeFunctions]);

  const totalFeatures = useMemo(() => {
    return allFeatures.reduce((sum, cat) => sum + cat.features.length, 0);
  }, [allFeatures]);

  const stats = useMemo(() => {
    if (!priorities) return { green: 0, yellow: 0, red: 0, unrated: totalFeatures, workedOn: 0 };

    // Count priorities for features that exist in allFeatures
    const validPriorities = priorities.filter(p => 
      allFeatures.some(cat => 
        cat.key === p.category && 
        cat.features.some(f => f.key === p.feature_key)
      )
    );

    const green = validPriorities.filter((p) => p.priority === 'green').length;
    const yellow = validPriorities.filter((p) => p.priority === 'yellow').length;
    const red = validPriorities.filter((p) => p.priority === 'red').length;
    const workedOn = validPriorities.filter((p) => p.is_worked_on).length;
    const rated = green + yellow + red;

    return { green, yellow, red, unrated: totalFeatures - rated, workedOn };
  }, [priorities, totalFeatures, allFeatures]);

  const getPriorityForFeature = (category: string, featureKey: string): FeaturePriority => {
    const found = priorities?.find(
      (p) => p.category === category && p.feature_key === featureKey
    );
    return found?.priority || null;
  };

  const getWorkedOnForFeature = (category: string, featureKey: string): boolean => {
    const found = priorities?.find(
      (p) => p.category === category && p.feature_key === featureKey
    );
    return found?.is_worked_on || false;
  };

  const filteredFeatures = useMemo(() => {
    if (!activeFilter) return allFeatures;
    
    return allFeatures.map(category => ({
      ...category,
      features: category.features.filter(feature => {
        const priority = getPriorityForFeature(category.key, feature.key);
        const isWorkedOn = getWorkedOnForFeature(category.key, feature.key);
        
        if (activeFilter === 'unrated') return !priority;
        if (activeFilter === 'worked_on') return isWorkedOn;
        if (activeFilter === 'not_worked_on') return !isWorkedOn;
        return priority === activeFilter;
      })
    })).filter(category => category.features.length > 0);
  }, [activeFilter, priorities, allFeatures]);

  const progressPercent = ((totalFeatures - stats.unrated) / totalFeatures) * 100;

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

  if (isLoading || edgeFunctionsLoading) {
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

        {/* Global Notes */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen} className="mt-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                {i18n.language === 'de' ? 'Allgemeine Notizen' : 'General Notes'}
                {globalNotes && <Badge variant="secondary" className="ml-2 text-xs">!</Badge>}
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", notesOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="relative">
              <Textarea
                placeholder={i18n.language === 'de' 
                  ? 'Allgemeine Notizen für die Entwicklung...' 
                  : 'General notes for development...'}
                value={globalNotes}
                onChange={(e) => setGlobalNotes(e.target.value)}
                onBlur={handleGlobalNotesBlur}
                className="min-h-[100px] resize-y"
              />
              {notesMutation.isPending && (
                <div className="absolute top-2 right-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Stats */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "border-green-500 text-green-600 cursor-pointer transition-all hover:bg-green-50",
                activeFilter === 'green' && "bg-green-500 text-white hover:bg-green-600"
              )}
              onClick={() => setActiveFilter(activeFilter === 'green' ? null : 'green')}
            >
              🟢 {stats.green} {i18n.language === 'de' ? 'Kritisch' : 'Critical'}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "border-yellow-500 text-yellow-600 cursor-pointer transition-all hover:bg-yellow-50",
                activeFilter === 'yellow' && "bg-yellow-500 text-white hover:bg-yellow-600"
              )}
              onClick={() => setActiveFilter(activeFilter === 'yellow' ? null : 'yellow')}
            >
              🟡 {stats.yellow} {i18n.language === 'de' ? 'Wichtig' : 'Important'}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "border-red-500 text-red-600 cursor-pointer transition-all hover:bg-red-50",
                activeFilter === 'red' && "bg-red-500 text-white hover:bg-red-600"
              )}
              onClick={() => setActiveFilter(activeFilter === 'red' ? null : 'red')}
            >
              🔴 {stats.red} {i18n.language === 'de' ? 'Unwichtig' : 'Unimportant'}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "border-blue-500 text-blue-600 cursor-pointer transition-all hover:bg-blue-50",
                activeFilter === 'worked_on' && "bg-blue-500 text-white hover:bg-blue-600"
              )}
              onClick={() => setActiveFilter(activeFilter === 'worked_on' ? null : 'worked_on')}
            >
              🔵 {stats.workedOn} {i18n.language === 'de' ? 'Bearbeitet' : 'Worked On'}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-muted-foreground cursor-pointer transition-all hover:bg-muted",
                activeFilter === 'unrated' && "bg-gray-500 text-white border-gray-500 hover:bg-gray-600"
              )}
              onClick={() => setActiveFilter(activeFilter === 'unrated' ? null : 'unrated')}
            >
              ⚪ {stats.unrated} {i18n.language === 'de' ? 'Nicht bewertet' : 'Unrated'}
            </Badge>
            {activeFilter && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveFilter(null)}
                className="text-xs h-6 px-2"
              >
                {i18n.language === 'de' ? 'Filter zurücksetzen' : 'Reset filter'}
              </Button>
            )}
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
          {filteredFeatures.map((category) => {
            const categoryLabel = i18n.language === 'de' ? category.labelDe : category.labelEn;
            const featureKeys = category.features.map((f) => f.key);
            const categoryPriorities = category.features.map((f) =>
              getPriorityForFeature(category.key, f.key)
            );
            const categoryWorkedOn = category.features.filter((f) =>
              getWorkedOnForFeature(category.key, f.key)
            ).length;
            const greenCount = categoryPriorities.filter((p) => p === 'green').length;
            const yellowCount = categoryPriorities.filter((p) => p === 'yellow').length;
            const redCount = categoryPriorities.filter((p) => p === 'red').length;
            const isEdgeFunctions = category.key === 'edge_functions';

            return (
              <AccordionItem
                key={category.key}
                value={category.key}
                className="border rounded-lg px-3"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium text-sm">{categoryLabel}</span>
                    <div className="flex items-center gap-1 ml-auto mr-2">
                      {greenCount > 0 && (
                        <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-1.5 py-0 min-w-[1.25rem] justify-center">
                          {greenCount}
                        </Badge>
                      )}
                      {yellowCount > 0 && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white text-xs px-1.5 py-0 min-w-[1.25rem] justify-center">
                          {yellowCount}
                        </Badge>
                      )}
                      {redCount > 0 && (
                        <Badge className="bg-red-500 hover:bg-red-500 text-white text-xs px-1.5 py-0 min-w-[1.25rem] justify-center">
                          {redCount}
                        </Badge>
                      )}
                      {categoryWorkedOn > 0 && (
                        <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-xs px-1.5 py-0 min-w-[1.25rem] justify-center">
                          {categoryWorkedOn}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs px-1.5 py-0 min-w-[1.5rem] justify-center">
                        {category.features.length}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Bulk actions */}
                  <div className="flex gap-2 mb-3 pt-1 items-center">
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
                    {isEdgeFunctions && isSuperAdmin && (
                      <div className="ml-auto">
                        <AddEdgeFunctionDialog />
                      </div>
                    )}
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
                        isWorkedOn={getWorkedOnForFeature(category.key, feature.key)}
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
