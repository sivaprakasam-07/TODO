import React from 'react';
import { useUI } from '../../context/UIContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { Header } from './Header';
import { Board } from '../board/Board';
import { CalendarView } from '../calendar/CalendarView';
import { ProfileView } from '../profile/ProfileView';
import { TaskDetails } from '../task/TaskDetails';
import { TaskDialog } from '../task/TaskDialog';
import { ToastContainer } from '../ui/ToastContainer';

export const AppLayout: React.FC = () => {
  const { activeView } = useUI();

  // Initialize keyboard shortcuts (N, Esc)
  useKeyboardShortcuts();

  const renderActiveView = () => {
    switch (activeView) {
      case 'board':
        return <Board />;
      case 'calendar':
        return <CalendarView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <Board />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex flex-col antialiased">
      {/* Navigation Header */}
      <Header />

      {/* Main Workspace View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {renderActiveView()}
      </main>

      {/* Task Details Drawer */}
      <TaskDetails />

      {/* Task Creation Modal */}
      <TaskDialog />

      {/* Toast Notification Stack */}
      <ToastContainer />
    </div>
  );
};
