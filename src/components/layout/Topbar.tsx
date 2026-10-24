import React, { useState } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronDown,
  Menu,
  Plus,
  Calendar,
  Wallet,
  Users,
  Check,
  Sun,
  Moon,
  LogOut,
  Shield,
  User
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatDate, formatCurrency } from '../../utils/analytics';
import { UserRole, ActiveTab, EventType } from '../../types/event';

const TAB_NAMES: Record<ActiveTab, string> = {
  dashboard: 'Дашборд',
  settings: 'Параметры ивента',
  tasks: 'План и задачи',
  budget: 'Бюджет и смета',
  guests: 'Гости и QR-билеты',
  team: 'Команда и подрядчики',
  calendar: 'Календарь',
  ai_assistant: 'Помощник организатора',
  admin_panel: 'Управление системой'
};

export const Topbar: React.FC = () => {
  const {
    events,
    activeEvent,
    activeEventId,
    setActiveEventId,
    activeTab,
    metrics,
    currentUserRole,
    setCurrentUserRole,
    users,
    currentUser,
    loginAsUser,
    logout,
    theme,
    toggleTheme,
    resetDemoData,
    notifications,
    dismissNotification,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isEventSwitcherOpen,
    setIsEventSwitcherOpen,
    addEvent
  } = useEventContext();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Create event modal state (invoked from switcher)
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState<{
    title: string;
    type: EventType;
    startDate: string;
    startTime: string;
    endDate: string;
    location: string;
    isOnline: boolean;
    description: string;
    goals: string;
    plannedHeadcount: number;
    totalBudgetLimit: number;
    leadOrganizer: string;
  }>({
    title: '',
    type: 'Хакатон',
    startDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    startTime: '10:00',
    endDate: new Date(Date.now() + 86400000 * 16).toISOString().split('T')[0],
    location: '',
    isOnline: false,
    description: '',
    goals: '',
    plannedHeadcount: 100,
    totalBudgetLimit: 1000000,
    leadOrganizer: 'Андрей Абрамов'
  });

  const handleRoleChange = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role === 'guest') {
      setActiveTab('guests');
    }
  };

  const handleCreateNewEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.title.trim()) return;

    const newId = addEvent({
      ...newEventData,
      plannedHeadcount: Math.max(1, Number(newEventData.plannedHeadcount) || 10),
      totalBudgetLimit: Math.max(0, Number(newEventData.totalBudgetLimit) || 0)
    });

    setIsNewEventModalOpen(false);
    setIsEventSwitcherOpen(false);
    setActiveEventId(newId);
    setActiveTab('dashboard');
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
      <header className="h-12 bg-white dark:bg-[#0C0C0E] border-b border-zinc-200 dark:border-zinc-800/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 -ml-1.5 mr-0.5 rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
            aria-label="Открыть главное меню"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumb Segment 1: "Мероприятия" (opens project switcher) */}
          <button
            onClick={() => setIsEventSwitcherOpen(true)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            title="Переключить проект или открыть список мероприятий"
          >
            <span>Мероприятия</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 shrink-0" />

          {/* Breadcrumb Segment 2: Active event title (navigates to settings) */}
          <button
            onClick={() => setActiveTab('settings')}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline truncate max-w-[220px] md:max-w-[320px] xl:max-w-[440px] text-left cursor-pointer"
            title="Перейти в параметры и паспорт мероприятия"
          >
            {activeEvent?.title || 'Без названия'}
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 shrink-0" />

          {/* Breadcrumb Segment 3: Current Tab */}
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
            {TAB_NAMES[activeTab] || 'Раздел'}
          </span>

          {/* Breadcrumb Meta: Type & Date (navigates to calendar) */}
          {activeEvent && (
            <button
              onClick={() => setActiveTab('calendar')}
              className="hidden lg:flex items-center gap-1.5 ml-2 font-mono text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer whitespace-nowrap shrink-0"
              title="Открыть мероприятие в календаре"
            >
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap">
                {activeEvent.type}
              </span>
              <span>•</span>
              <span className="hover:underline whitespace-nowrap">{formatDate(activeEvent.startDate)}</span>
            </button>
          )}
        </div>

        {/* Right: Compact Readiness, Theme Toggle & User Profile Popover */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
          {/* Compact Readiness Meter */}
          <button
            onClick={() => setActiveTab('tasks')}
            className="hidden xl:flex items-center gap-1.5 pr-2.5 border-r border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-2 py-1 rounded transition-colors cursor-pointer text-left shrink-0 whitespace-nowrap"
            title="Перейти к плану задач"
          >
            <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 tabular-nums">
              {metrics.readinessPercent}%
            </span>
            <div className="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <div
                className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                style={{ width: `${metrics.readinessPercent}%` }}
              />
            </div>
          </button>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="btn-secondary w-8 h-8 px-0 flex items-center justify-center text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 shrink-0"
            title="Переключить тему (Светлая / Темная)"
            aria-label="Переключить тему"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          {/* User Profile Button with Popover */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors shadow-xs cursor-pointer"
              title="Меню профиля и переключение аккаунтов"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                {currentUser?.avatarInitials || 'User'}
              </div>
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[120px] hidden sm:inline">
                {currentUser?.name || 'Пользователь'}
              </span>
              {currentUser && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {currentUser.role === 'organizer' || currentUser.role === 'admin' ? 'Админ' : currentUser.role === 'team' ? 'Команда' : 'Гость'}
                </span>
              )}
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Dropdown Popover */}
            {isProfileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-72 rounded-lg bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden animate-fade-in text-xs">
                  {/* User Info Header */}
                  <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white text-xs font-bold font-mono flex items-center justify-center shrink-0">
                        {currentUser?.avatarInitials || 'User'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {currentUser?.name || 'Гость системы'}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                          {currentUser?.email || 'guest@eventtech.ru'}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-1">
                      {currentUser?.position}
                    </div>
                  </div>

                  {/* Demo Fast Switch Section */}
                  <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Быстрое переключение профиля (Демо)
                    </div>
                    <div className="space-y-0.5 max-h-48 overflow-y-auto">
                      {users.map(u => {
                        const isSelected = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              loginAsUser(u.id);
                              setIsProfileMenuOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[9px] font-bold font-mono flex items-center justify-center shrink-0 text-zinc-800 dark:text-zinc-200">
                                {u.avatarInitials}
                              </span>
                              <span className="truncate text-xs">{u.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                {u.role === 'organizer' || u.role === 'admin' ? 'Админ' : u.role === 'team' ? 'Команда' : 'Гость'}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 space-y-0.5">
                    {(currentUserRole === 'organizer' || currentUserRole === 'admin') && (
                      <button
                        onClick={() => {
                          setActiveTab('admin_panel');
                          setIsProfileMenuOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Управление системой и профилями</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        resetDemoData();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Сбросить демо-данные</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Выйти на главную</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MODAL: Project Switcher ("Все мероприятия") */}
      {isEventSwitcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 animate-fade-in">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/60">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Все мероприятия (Переключатель проектов)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Выберите активное событие для работы или создайте новое
                </p>
              </div>
              <button
                onClick={() => setIsEventSwitcherOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {events.map(evt => {
                const isCurrent = evt.id === activeEventId;
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setActiveEventId(evt.id);
                      setIsEventSwitcherOpen(false);
                    }}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrent
                        ? 'border-zinc-900 dark:border-zinc-500 bg-zinc-50/90 dark:bg-zinc-800/40 shadow-xs ring-1 ring-zinc-900 dark:ring-zinc-500'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181D] hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium">
                          {evt.type}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {evt.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Активный
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          {formatDate(evt.startDate)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          {formatCurrency(evt.totalBudgetLimit)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                          {evt.plannedHeadcount} чел.
                        </span>
                        {evt.location && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{evt.location}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setActiveEventId(evt.id);
                          setIsEventSwitcherOpen(false);
                        }}
                        className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                          isCurrent
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'
                            : 'btn-secondary'
                        }`}
                      >
                        {isCurrent ? 'Выбрано' : 'Выбрать'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Всего событий: {events.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Создать мероприятие
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Event Form (invoked from Switcher) */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/60">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Новое мероприятие
              </h3>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewEventSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Название мероприятия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: AI Summit 2026"
                  value={newEventData.title}
                  onChange={e => setNewEventData({ ...newEventData, title: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Формат / Тип
                  </label>
                  <select
                    value={newEventData.type}
                    onChange={e => setNewEventData({ ...newEventData, type: e.target.value as EventType })}
                    className="input-base w-full cursor-pointer"
                  >
                    <option value="Хакатон">Хакатон</option>
                    <option value="Конференция">Конференция</option>
                    <option value="Форум">Форум</option>
                    <option value="Воркшоп">Воркшоп</option>
                    <option value="Выставка">Выставка</option>
                    <option value="Корпоратив">Корпоратив</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Планируемые участники
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEventData.plannedHeadcount}
                    onChange={e => setNewEventData({ ...newEventData, plannedHeadcount: Number(e.target.value) })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventData.startDate}
                    onChange={e => setNewEventData({ ...newEventData, startDate: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Лимит бюджета (₽)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={newEventData.totalBudgetLimit}
                    onChange={e => setNewEventData({ ...newEventData, totalBudgetLimit: Number(e.target.value) })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Место проведения / Площадка
                </label>
                <input
                  type="text"
                  placeholder="Адрес или ссылка на онлайн-трансляцию"
                  value={newEventData.location}
                  onChange={e => setNewEventData({ ...newEventData, location: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Создать проект
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
