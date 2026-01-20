import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionName: string;
  onSessionNameChange: (value: string) => void;
  onCreateSession: () => void;
  isCreating: boolean;
}

export function NewSessionDialog({
  open,
  onOpenChange,
  sessionName,
  onSessionNameChange,
  onCreateSession,
  isCreating,
}: NewSessionDialogProps) {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inventory.newSession')}</DialogTitle>
          <DialogDescription>
            {t('inventory.newSessionDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="sessionName">{t('inventory.sessionName')}</Label>
          <Input
            id="sessionName"
            value={sessionName}
            onChange={(e) => onSessionNameChange(e.target.value)}
            placeholder={t('inventory.sessionNamePlaceholder')}
            className="mt-2 h-11 sm:h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && sessionName.trim()) {
                onCreateSession();
              }
            }}
          />
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-11 sm:h-9"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={onCreateSession}
            disabled={!sessionName.trim() || isCreating}
            className="w-full sm:w-auto h-11 sm:h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('inventory.startSession')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
