import { useTranslation } from 'react-i18next';
import type { AuthTab } from './schemas';

interface AuthTabsProps {
  activeTab: AuthTab;
  setActiveTab: (tab: AuthTab) => void;
  hideDemo?: boolean;
}

export function AuthTabs({ activeTab, setActiveTab, hideDemo }: AuthTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 mb-8 p-1 bg-muted rounded-lg">
      <button
        onClick={() => setActiveTab('login')}
        className={`flex-1 py-2.5 text-center font-medium rounded-md transition-all duration-200 ${
          activeTab === 'login'
            ? 'bg-accent text-accent-foreground shadow-sm'
            : 'text-muted-foreground hover:text-accent'
        }`}
      >
        {t('auth.signIn')}
      </button>
      <button
        onClick={() => setActiveTab('signup')}
        className={`flex-1 py-2.5 text-center font-medium rounded-md transition-all duration-200 ${
          activeTab === 'signup'
            ? 'bg-accent text-accent-foreground shadow-sm'
            : 'text-muted-foreground hover:text-accent'
        }`}
      >
        {t('auth.signUp')}
      </button>
      {!hideDemo && (
        <button
          onClick={() => setActiveTab('demo')}
          className={`flex-1 py-2.5 text-center font-medium rounded-md transition-all duration-200 ${
            activeTab === 'demo'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:text-accent'
          }`}
        >
          Demo
        </button>
      )}
    </div>
  );
}
