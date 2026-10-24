import React from 'react';
import { EventProvider, useEventContext } from './context/EventContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/views/DashboardView';
import { EventSettingsView } from './components/views/EventSettingsView';
import { TasksView } from './components/views/TasksView';
import { BudgetView } from './components/views/BudgetView';
import { GuestsView } from './components/views/GuestsView';
import { TeamContractorsView } from './components/views/TeamContractorsView';
import { CalendarView } from './components/views/CalendarView';
import { AiAssistantView } from './components/views/AiAssistantView';

const MainContent: React.FC = () => {
  const { activeTab, currentUserRole } = useEventContext();

  const renderActiveView = () => {
    // If in guest mode and restricted tab is requested, fallback to guests portal
    if (currentUserRole === 'guest' && (activeTab === 'settings' || activeTab === 'budget' || activeTab === 'team' || activeTab === 'ai_assistant')) {
      return <GuestsView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'settings':
        return <EventSettingsView />;
      case 'tasks':
        return <TasksView />;
      case 'budget':
        return <BudgetView />;
      case 'guests':
        return <GuestsView />;
      case 'team':
        return <TeamContractorsView />;
      case 'calendar':
        return <CalendarView />;
      case 'ai_assistant':
        return <AiAssistantView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-5 bg-[#FAFAFA] dark:bg-[#09090B]">
          <div className="max-w-6xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <EventProvider>
      <MainContent />
    </EventProvider>
  );
};

export default App;
