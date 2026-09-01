import React from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TaskProvider } from './context/TaskContext';
import { UIProvider } from './context/UIContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { Loader2 } from 'lucide-react';

const AppRoot: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#141414] text-[#F5F5F5] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white text-black font-bold text-sm flex items-center justify-center shadow-sm">
            F
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8A8A8A]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A5A5A5]" />
            <span>Loading FocusFlow...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <TaskProvider>
      <UIProvider>
        <AppLayout />
      </UIProvider>
    </TaskProvider>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppRoot />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
