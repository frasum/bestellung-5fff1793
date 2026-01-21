import { Skeleton } from '@/components/ui/skeleton';
import { useB2BInventoryState } from './useB2BInventoryState';
import { SessionControls } from './SessionControls';
import { SessionStatsCard } from './SessionStatsCard';
import { InventoryFilters } from './InventoryFilters';
import { VendorArticlesList } from './VendorArticlesList';
import {
  NewSessionDialog,
  HistoryDialog,
  VoiceDialog,
  DeleteConfirmDialog,
} from './InventoryDialogs';
import { B2BInventoryTabProps } from './types';

const B2BInventoryTab = ({ accountId, supplierId }: B2BInventoryTabProps) => {
  const state = useB2BInventoryState({ accountId, supplierId });

  if (state.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <SessionControls
        sessions={state.sessions}
        activeSessionId={state.activeSessionId}
        activeSessionStatus={state.activeSession?.status}
        onSessionChange={state.setActiveSessionId}
        onNewSession={() => state.setShowNewSessionDialog(true)}
        onHistoryOpen={() => state.setShowHistoryDialog(true)}
        onVoiceOpen={() => state.setShowVoiceDialog(true)}
        onExport={state.handleExportExcel}
      />

      {/* Active Session Stats */}
      {state.activeSessionId && state.activeSession?.status === 'in_progress' && (
        <SessionStatsCard
          stats={state.sessionStats}
          hasChanges={state.hasChanges}
          isSaving={state.bulkUpsertPending}
          isCompleting={state.updateSessionPending}
          onSave={state.handleSave}
          onComplete={state.handleComplete}
        />
      )}

      {/* Filters */}
      <InventoryFilters
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        vendorFilter={state.vendorFilter}
        onVendorFilterChange={state.setVendorFilter}
        categoryFilter={state.categoryFilter}
        onCategoryFilterChange={state.setCategoryFilter}
        vendors={state.vendors}
        categories={state.categories}
      />

      {/* Articles List */}
      <VendorArticlesList
        hasActiveSession={!!state.activeSessionId}
        isSessionCompleted={state.activeSession?.status === 'completed'}
        groupedArticles={state.groupedArticles}
        openVendors={state.openVendors}
        onToggleVendor={state.toggleVendor}
        getItemValues={state.getItemValues}
        onItemChange={state.handleItemChange}
        onNewSession={() => state.setShowNewSessionDialog(true)}
      />

      {/* Dialogs */}
      <NewSessionDialog
        open={state.showNewSessionDialog}
        onOpenChange={state.setShowNewSessionDialog}
        sessionName={state.newSessionName}
        onSessionNameChange={state.setNewSessionName}
        onSubmit={state.handleCreateSession}
        isPending={state.createSessionPending}
      />

      <HistoryDialog
        open={state.showHistoryDialog}
        onOpenChange={state.setShowHistoryDialog}
        sessions={state.sessions}
        onLoadSession={state.handleLoadSession}
        onDeleteSession={state.setDeleteSessionId}
      />

      <VoiceDialog
        open={state.showVoiceDialog}
        onOpenChange={state.setShowVoiceDialog}
        language={state.i18n.language}
        onResult={state.handleVoiceResult}
      />

      <DeleteConfirmDialog
        open={!!state.deleteSessionId}
        onOpenChange={() => state.setDeleteSessionId(null)}
        onConfirm={state.handleDeleteSession}
      />
    </div>
  );
};

export default B2BInventoryTab;
