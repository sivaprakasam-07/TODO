import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { ActiveView, Status, SortOption } from '../types/task';

// BeforeInstallPromptEvent interface for PWA
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface UIContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isCreateTaskModalOpen: boolean;
  createInitialStatus: Status;
  openCreateTaskModal: (initialStatus?: Status) => void;
  closeCreateTaskModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  mobileActiveTab: Status;
  setMobileActiveTab: (tab: Status) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  isOnline: boolean;
  isInstallable: boolean;
  triggerInstall: () => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<Status>('todo');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileActiveTab, setMobileActiveTab] = useState<Status>('todo');
  const [sortOption, setSortOption] = useState<SortOption>('manual');
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Capture PWA install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const triggerInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const openCreateTaskModal = useCallback((initialStatus: Status = 'todo') => {
    setCreateInitialStatus(initialStatus);
    setIsCreateTaskModalOpen(true);
  }, []);

  const closeCreateTaskModal = useCallback(() => {
    setIsCreateTaskModalOpen(false);
  }, []);

  return (
    <UIContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedTaskId,
        setSelectedTaskId,
        isCreateTaskModalOpen,
        createInitialStatus,
        openCreateTaskModal,
        closeCreateTaskModal,
        searchQuery,
        setSearchQuery,
        mobileActiveTab,
        setMobileActiveTab,
        sortOption,
        setSortOption,
        isOnline,
        isInstallable: Boolean(deferredPrompt),
        triggerInstall,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
