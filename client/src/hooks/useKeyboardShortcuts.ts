import { useEffect } from 'react';
import { useUI } from '../context/UIContext';

export function useKeyboardShortcuts(searchInputRef?: React.RefObject<HTMLInputElement | null>) {
  const {
    openCreateTaskModal,
    closeCreateTaskModal,
    isCreateTaskModalOpen,
    selectedTaskId,
    setSelectedTaskId,
    searchQuery,
    setSearchQuery,
    setActiveView,
    setMobileActiveTab,
  } = useUI();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName.toUpperCase()));

      // Escape always handles closing modals / drawers / clearing search
      if (e.key === 'Escape') {
        if (isCreateTaskModalOpen) {
          e.preventDefault();
          closeCreateTaskModal();
        } else if (selectedTaskId) {
          e.preventDefault();
          setSelectedTaskId(null);
        } else if (searchQuery) {
          e.preventDefault();
          setSearchQuery('');
          if (searchInputRef?.current) {
            searchInputRef.current.blur();
          }
        }
        return;
      }

      // If user is currently typing in an input/textarea/select, do NOT trigger single key shortcuts
      if (isInput) return;

      // Do not trigger if any modifier keys like Ctrl, Cmd, Alt are pressed
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openCreateTaskModal('todo');
      } else if (e.key === '/') {
        e.preventDefault();
        if (searchInputRef?.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setActiveView('board');
        setMobileActiveTab('todo');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setActiveView('board');
        setMobileActiveTab('in-progress');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setActiveView('board');
        setMobileActiveTab('completed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCreateTaskModalOpen,
    selectedTaskId,
    searchQuery,
    openCreateTaskModal,
    closeCreateTaskModal,
    setSelectedTaskId,
    setSearchQuery,
    setActiveView,
    setMobileActiveTab,
    searchInputRef,
  ]);
}
