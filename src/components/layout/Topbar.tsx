import React from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  ChevronRight
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatDate } from '../../utils/analytics';
import { UserRole, ActiveTab } from '../../types/event';

const TAB_NAMES: Record<ActiveTab, string> = {
  dashboard: 'Дашборд',
  settings: 'Параметры ивента',
  tasks: 'План и задачи',
  budget: 'Бюджет и смета',
  guests: 'Гости и QR-билеты',
  team: 'Команда и подрядчики',
  calendar: 'Календарь',
  ai_assistant: 'Автоматизация и аудит'
};

export const Topbar: React.FC = () => {
  const {
    activeEvent,
    activeTab,
    metrics,
    currentUserRole,
    setCurrentUserRole,
    resetDemoData,
    notifications,
    dismissNotification,
    setActiveTab
  } = useEventContext();

  const handleRoleChange = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role === 'guest') {
      setActiveTab('guests');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-zinc-300 shrink-0" />;
    }
  };

  return (
    <>
      <header className="h-12 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left: Breadcrumbs & Meta */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-medium text-zinc-400">
            Мероприятия
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="text-xs font-medium text-zinc-700 truncate max-w-[200px] sm:max-w-[280px]" title={activeEvent?.title}>
            {activeEvent?.title || 'Без названия'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="text-xs font-semibold text-zinc-900 shrink-0">
            {TAB_NAMES[activeTab] || 'Раздел'}
          </span>

          {activeEvent && (
            <div className="hidden lg:flex items-center gap-1.5 ml-2 font-mono text-[11px] text-zinc-400">
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {activeEvent.type}
              </span>
              <span>•</span>
              <span>{formatDate(activeEvent.startDate)}</span>
            </div>
          )}
        </div>

        {/* Right: Readiness, Role Switcher & Reset */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Readiness Meter */}
          <div className="hidden md:flex items-center gap-2 pr-3 border-r border-zinc-200">
            <span className="text-xs font-mono text-zinc-600 tabular-nums">
              Готовность {metrics.readinessPercent}%
            </span>
            <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
              <div
                className="h-full bg-zinc-900 transition-all duration-300"
                style={{ width: `${metrics.readinessPercent}%` }}
              />
            </div>
          </div>

          {/* Segmented Role Switcher */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/80">
            <button
              onClick={() => handleRoleChange('admin')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                currentUserRole === 'admin'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Админ
            </button>
            <button
              onClick={() => handleRoleChange('team')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                currentUserRole === 'team'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Команда
            </button>
            <button
              onClick={() => handleRoleChange('guest')}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                currentUserRole === 'guest'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Гость
            </button>
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={resetDemoData}
            className="btn-secondary h-7 px-2.5 text-xs text-zinc-600 hover:text-zinc-900"
            title="Сбросить к исходным демонстрационным данным"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Сбросить демо</span>
          </button>
        </div>
      </header>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-zinc-900 text-white text-xs px-3.5 py-2.5 rounded-md shadow-md border border-zinc-800 flex items-center justify-between gap-3 animate-fade-in"
          >
            <div className="flex items-center gap-2">
              {getNotificationIcon(toast.type)}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissNotification(toast.id)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
