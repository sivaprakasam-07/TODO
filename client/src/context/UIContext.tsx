import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ActiveView, Status } from '../types/task';

interface UIContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isCreateTaskModalOpen: boolean;
  createInitialStatus: Status;
  openCreateTaskModal: (initialStatus?: Status) => void;
  closeCreateTaskModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [createInitialStatus, setCreateInitialStatus] = useState<Status>('todo');

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
