import { ToastProvider } from './context/ToastContext';
import { TaskProvider } from './context/TaskContext';
import { UIProvider } from './context/UIContext';
import { AppLayout } from './components/layout/AppLayout';

export function App() {
  return (
    <ToastProvider>
      <TaskProvider>
        <UIProvider>
          <AppLayout />
        </UIProvider>
      </TaskProvider>
    </ToastProvider>
  );
}

export default App;
