import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, FileText, ExternalLink } from 'lucide-react';

interface CommunicationTabProps {
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
  NotificationsContent: React.ComponentType;
  EmailTemplatesContent: React.ComponentType;
  SupplierPortalContent: React.ComponentType;
}

export const CommunicationTab = ({ 
  activeSubTab, 
  onSubTabChange, 
  NotificationsContent, 
  EmailTemplatesContent,
  SupplierPortalContent,
}: CommunicationTabProps) => {
  return (
    <div className="bg-muted/30 rounded-lg p-2 sm:p-4 border border-border/50">
      <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="space-y-4">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="bg-muted/50 p-1 w-max min-w-full sm:w-auto">
          <TabsTrigger 
            value="notifications" 
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Benachrichtigungen</span>
            <span className="sm:hidden">Meldungen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="email-templates" 
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">E-Mail-Vorlagen</span>
            <span className="sm:hidden">E-Mail</span>
          </TabsTrigger>
          <TabsTrigger 
            value="supplier-portal" 
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Lieferantenportal</span>
            <span className="sm:hidden">Portal</span>
          </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notifications" className="mt-4 animate-in fade-in-50 slide-in-from-left-2 duration-200">
          <NotificationsContent />
        </TabsContent>

        <TabsContent value="email-templates" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <EmailTemplatesContent />
        </TabsContent>

        <TabsContent value="supplier-portal" className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
          <SupplierPortalContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};
