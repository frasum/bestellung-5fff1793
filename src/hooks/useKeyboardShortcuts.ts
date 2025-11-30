import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const shortcuts: ShortcutConfig[] = [
    // Navigation shortcuts
    {
      key: 'd',
      alt: true,
      action: () => navigate('/dashboard'),
      description: 'Dashboard',
    },
    {
      key: 's',
      alt: true,
      action: () => navigate('/suppliers'),
      description: t('nav.suppliers'),
    },
    {
      key: 'a',
      alt: true,
      action: () => navigate('/articles'),
      description: t('nav.articles'),
    },
    {
      key: 'o',
      alt: true,
      action: () => navigate('/orders'),
      description: t('nav.orders'),
    },
    {
      key: 'i',
      alt: true,
      action: () => navigate('/inventory'),
      description: t('nav.inventory'),
    },
    {
      key: 'r',
      alt: true,
      action: () => navigate('/reports'),
      description: t('nav.reports'),
    },
    {
      key: ',',
      ctrl: true,
      action: () => navigate('/settings'),
      description: t('nav.settings'),
    },
    // Cart shortcut
    {
      key: 'c',
      alt: true,
      action: () => navigate('/cart'),
      description: t('nav.cart'),
    },
    // Help shortcut - show shortcuts toast
    {
      key: '?',
      shift: true,
      action: () => {
        toast.info(
          `Tastaturkürzel:\n⌘/Ctrl+K - Suche\nAlt+D - Dashboard\nAlt+S - Lieferanten\nAlt+A - Artikel\nAlt+O - Bestellungen\nAlt+I - Inventur\nAlt+C - Warenkorb\nCtrl+, - Einstellungen`,
          { duration: 5000 }
        );
      },
      description: t('common.help') || 'Hilfe',
    },
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey || shortcut.meta;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey || shortcut.ctrl;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, location.pathname]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
}
