import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PortalColumnKey, PORTAL_COLUMN_OPTIONS, DEFAULT_VISIBLE_COLUMNS } from '@/hooks/useSupplierPortalSettings';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PortalColumnsConfigProps {
  visibleColumns: PortalColumnKey[];
  onChange: (columns: PortalColumnKey[]) => void;
}

interface SortableColumnItemProps {
  column: { key: PortalColumnKey; label: string };
  isChecked: boolean;
  isRequired: boolean;
  onToggle: () => void;
}

function SortableColumnItem({ column, isChecked, isRequired, onToggle }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors ${
        isDragging ? 'opacity-50 shadow-lg z-50' : ''
      }`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none p-1 -m-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Checkbox
        id={`col-${column.key}`}
        checked={isChecked}
        onCheckedChange={onToggle}
        disabled={isRequired}
      />
      <Label
        htmlFor={`col-${column.key}`}
        className="flex-1 cursor-pointer text-sm"
      >
        {column.label}
      </Label>
      {!isChecked && (
        <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
      )}
    </div>
  );
}

function HiddenColumnItem({ column, onToggle }: { column: { key: PortalColumnKey; label: string }; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md border border-dashed bg-muted/30 hover:bg-accent/50 transition-colors">
      <div className="p-1 -m-1">
        <GripVertical className="h-4 w-4 text-muted-foreground/30" />
      </div>
      <Checkbox
        id={`col-${column.key}`}
        checked={false}
        onCheckedChange={onToggle}
      />
      <Label
        htmlFor={`col-${column.key}`}
        className="flex-1 cursor-pointer text-sm text-muted-foreground"
      >
        {column.label}
      </Label>
      <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
    </div>
  );
}

export function PortalColumnsConfig({ visibleColumns, onChange }: PortalColumnsConfigProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Visible columns in their current order
  const visibleColumnsOrdered = visibleColumns
    .map(key => PORTAL_COLUMN_OPTIONS.find(opt => opt.key === key)!)
    .filter(Boolean);

  // Hidden columns (not in visibleColumns)
  const hiddenColumns = PORTAL_COLUMN_OPTIONS
    .filter(opt => !visibleColumns.includes(opt.key));

  const toggleColumn = (key: PortalColumnKey) => {
    if (visibleColumns.includes(key)) {
      // Don't allow removing all columns - keep at least price
      if (visibleColumns.length === 1 && key === 'price') return;
      onChange(visibleColumns.filter(c => c !== key));
    } else {
      // Add column at the end
      onChange([...visibleColumns, key]);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = visibleColumns.indexOf(active.id as PortalColumnKey);
      const newIndex = visibleColumns.indexOf(over.id as PortalColumnKey);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newVisibleColumns = arrayMove(visibleColumns, oldIndex, newIndex);
        onChange(newVisibleColumns);
      }
    }
  };

  const handleSelectAll = () => {
    onChange(PORTAL_COLUMN_OPTIONS.map(opt => opt.key));
  };

  const handleSelectDefault = () => {
    onChange([...DEFAULT_VISIBLE_COLUMNS]);
  };

  const activeColumn = activeId 
    ? PORTAL_COLUMN_OPTIONS.find(col => col.key === activeId) 
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          {t('settings.visibleColumns', 'Sichtbare Spalten')}
        </p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectDefault}
            className="text-muted-foreground hover:text-foreground underline"
          >
            {t('common.default', 'Standard')}
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-muted-foreground hover:text-foreground underline"
          >
            {t('common.all', 'Alle')}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleColumns}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-2">
            {visibleColumnsOrdered.map((column) => {
              const isRequired = column.key === 'price' && visibleColumns.length === 1;
              
              return (
                <SortableColumnItem
                  key={column.key}
                  column={column}
                  isChecked={true}
                  isRequired={isRequired}
                  onToggle={() => toggleColumn(column.key)}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeColumn ? (
            <div className="flex items-center gap-3 p-2 rounded-md border bg-card shadow-lg">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{activeColumn.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {hiddenColumns.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <EyeOff className="h-3 w-3" />
            {t('settings.hiddenColumns', 'Ausgeblendete Spalten')}
          </p>
          <div className="grid gap-2">
            {hiddenColumns.map((column) => (
              <HiddenColumnItem
                key={column.key}
                column={column}
                onToggle={() => toggleColumn(column.key)}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {t('settings.visibleColumnsDesc', 'Wählen Sie aus, welche Artikelinformationen Lieferanten im Portal sehen und bearbeiten können. Ziehen Sie die Spalten, um die Reihenfolge zu ändern.')}
      </p>
    </div>
  );
}
