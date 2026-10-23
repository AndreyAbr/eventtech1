import React from 'react';
import {
  Calendar,
  RotateCcw,
  Shield,
  Users2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatDate } from '../../utils/analytics';
import { UserRole } from '../../types/event';

export const Topbar: React.FC = () => {
  const {
    activeEvent,
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
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <>
      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Event Summary & Readiness Progress */}
        <div className="flex items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate max-w-[280px] md:max-w-[420px]" title={activeEvent?.title}>
                {activeEvent?.title || 'Мероприятие не выбрано'}
              </h2>
              {activeEvent?.type && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                  {activeEvent.type}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {activeEvent?.startDate ? formatDate(activeEvent.startDate) : '—'}
              </span>
              <span>•</span>
              <span>Организатор: <strong className="text-slate-300 font-medium">{activeEvent?.leadOrganizer || '—'}</strong></span>
            </div>
          </div>

          {/* Readiness Bar */}
          <div className="hidden xl:flex items-center gap-3 pl-6 border-l border-slate-800">
            <div className="text-right">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Готовность</div>
              <div className="text-xs font-bold text-white font-mono">{metrics.readinessPercent}%</div>
            </div>
            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${metrics.readinessPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Role Switcher & Reset Button */}
        <div className="flex items-center gap-3">
          {/* Role Switcher */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentUserRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Полные права: редактирование, бюджет, удаление"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Администратор</span>
            </button>

            <button
              onClick={() => handleRoleChange('team')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentUserRole === 'team'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Права команды: просмотр, задачи, комментарии"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Команда</span>
            </button>

            <button
              onClick={() => handleRoleChange('guest')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                currentUserRole === 'guest'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Гостевой режим: регистрация, билет с QR-кодом, опросы"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Гость (Вид)</span>
            </button>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={resetDemoData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition shadow-sm"
            title="Восстановить эталонные демо-данные хакатона"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Сброс данных</span>
          </button>
        </div>
      </header>

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {notifications.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs text-slate-200 animate-slide-up transition"
          >
            {getNotificationIcon(toast.type)}
            <div className="flex-1 leading-snug">{toast.message}</div>
            <button
              onClick={() => dismissNotification(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition -mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
