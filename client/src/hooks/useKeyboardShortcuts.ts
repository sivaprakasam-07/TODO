import { useEffect } from 'react';
import { useUI } from '../context/UIContext';

export function useKeyboardShortcuts() {
  const {
    openCreateTaskModal,
    isCreateTaskModalOpen,
    closeCreateTaskModal,
    selectedTaskId,
    setSelectedTaskId,
  } = useUI();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputActive =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // Escape key closes modal or details panel
      if (e.key === 'Escape') {
        if (isCreateTaskModalOpen) {
          closeCreateTaskModal();
          return;
        }
        if (selectedTaskId) {
          setSelectedTaskId(null);
          return;
        }
        if (isInputActive) {
          (activeEl as HTMLElement).blur();
          return;
        }
      }

      // If user is currently typing in an input, do not trigger 'N' shortcut
      if (isInputActive) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        openCreateTaskModal('todo');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    openCreateTaskModal,
    isCreateTaskModalOpen,
    closeCreateTaskModal,
    selectedTaskId,
    setSelectedTaskId,
  ]);
}
