import { Play, Mic, ClipboardList } from 'lucide-react';

interface DemoTabProps {
  onOpenDemoDialog: () => void;
  onOpenVoiceDialog: () => void;
  onOpenQuestionDialog: () => void;
}

export function DemoTab({ 
  onOpenDemoDialog, 
  onOpenVoiceDialog, 
  onOpenQuestionDialog 
}: DemoTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Demo-Zugänge</h3>
      
      {/* Demo starten - Blue Card */}
      <div
        onClick={onOpenDemoDialog}
        className="flex items-center gap-4 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex-shrink-0">
          <Play className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-blue-700 dark:text-blue-400">Demo starten</p>
          <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
            7 Tage kostenlos mit Beispieldaten
          </p>
        </div>
      </div>

      {/* Sprach-Onboarding - Green Card */}
      <div
        onClick={onOpenVoiceDialog}
        className="flex items-center gap-4 p-4 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex-shrink-0">
          <Mic className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-green-700 dark:text-green-400">Sprach-Onboarding</p>
          <p className="text-sm text-green-600/70 dark:text-green-400/70">
            Per Sprache einrichten
          </p>
        </div>
      </div>

      {/* Fragebogen-Onboarding - Orange Card */}
      <div
        onClick={onOpenQuestionDialog}
        className="flex items-center gap-4 p-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/30 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex-shrink-0">
          <ClipboardList className="h-6 w-6 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-orange-700 dark:text-orange-400">Fragebogen-Onboarding</p>
          <p className="text-sm text-orange-600/70 dark:text-orange-400/70">
            Schritt für Schritt einrichten
          </p>
        </div>
      </div>
    </div>
  );
}
