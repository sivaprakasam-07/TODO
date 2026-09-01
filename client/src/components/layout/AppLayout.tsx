import React from 'react';
import { useUI } from '../../context/UIContext';
import { Header } from './Header';
import { Board } from '../board/Board';
import { CalendarView } from '../calendar/CalendarView';
import { ProfileView } from '../profile/ProfileView';
import { TaskDetails } from '../task/TaskDetails';
import { TaskDialog } from '../task/TaskDialog';
import { ToastContainer } from '../ui/ToastContainer';
import { cn } from '../../lib/utils';

export const AppLayout: React.FC = () => {
  const { activeView } = useUI();

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

  const isBoardView = activeView === 'board';

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#141414] text-[#F5F5F5] flex flex-col antialiased select-none">
      {/* Navigation Header - Fixed at top */}
      <div className="shrink-0">
        <Header />
      </div>

      {/* Main Workspace View - Fills remaining viewport */}
      <main
        className={cn(
          'flex-1 min-h-0 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col',
          isBoardView ? 'overflow-hidden' : 'overflow-y-auto'
        )}
      >
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
