import React, { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  CheckSquare,
  Wallet,
  Users,
  Briefcase,
  Calendar,
  Plus,
  X,
  ChevronDown,
  Shield
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { ActiveTab, EventType } from '../../types/event';

export const Sidebar: React.FC = () => {
  const {
    events,
    activeEventId,
    setActiveEventId,
    activeTab,
    setActiveTab,
    metrics,
    addEvent,
    currentUserRole,
    users,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useEventContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    addEvent({
      ...formData,
      plannedHeadcount: Math.max(1, Number(formData.plannedHeadcount) || 10),
      totalBudgetLimit: Math.max(0, Number(formData.totalBudgetLimit) || 0)
    });

    setIsModalOpen(false);
    setFormData({
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
      leadOrganizer: 'Алексей Морозов'
    });
    setActiveTab('dashboard');
    setIsMobileMenuOpen(false);
  };

  const menuItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: React.ReactNode; hideInGuest?: boolean }[] = [
    { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { id: 'settings', label: 'Параметры ивента', icon: Settings, hideInGuest: true },
    {
      id: 'tasks',
      label: 'План и задачи',
      icon: CheckSquare,
      hideInGuest: true,
      badge: metrics.overdueTasksCount > 0 ? (
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 font-medium">
          {metrics.overdueTasksCount}
        </span>
      ) : null
    },
    {
      id: 'budget',
      label: 'Бюджет и смета',
      icon: Wallet,
      hideInGuest: true,
      badge: metrics.isOverTotalLimit ? (
        <span
          title="Превышение лимита бюджета!"
          className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono font-bold rounded bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/80 dark:text-red-400 dark:border-red-800 shrink-0"
        >
          !
        </span>
      ) : null
    },
    { id: 'guests', label: currentUserRole === 'guest' ? 'Регистрация & Билет' : 'Гости и QR-билеты', icon: Users },
    { id: 'team', label: 'Команда и подрядчики', icon: Briefcase, hideInGuest: true },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    {
      id: 'ai_assistant',
      label: 'Помощник организатора',
      icon: CheckSquare,
      hideInGuest: true
    }
  ];

  const visibleMenuItems = menuItems.filter(item => !(currentUserRole === 'guest' && item.hideInGuest));

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 z-40 md:hidden animate-fade-in"
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#F4F4F5] dark:bg-[#0C0C0E] border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col h-screen select-none transition-transform duration-200 ease-in-out
        md:static md:w-64 md:min-w-[256px] md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header (Clickable -> Dashboard) */}
        <div
          onClick={() => {
            setActiveTab('dashboard');
            setIsMobileMenuOpen(false);
          }}
          className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-100/60 dark:bg-[#0C0C0E] cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-[#121215] transition-colors"
          title="На главную (Дашборд)"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src="/logo.png"
              alt="EventTech"
              className="sidebar-brand-logo h-[18px] w-auto shrink-0 object-contain transition-all"
            />
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-tight shrink-0">
              Hub
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              Alpha 0.4
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsMobileMenuOpen(false);
              }}
              className="md:hidden text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded"
              aria-label="Закрыть меню"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Project Switcher */}
        {currentUserRole !== 'guest' ? (
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  aria-label="Выбрать активное мероприятие"
                  value={activeEventId}
                  onChange={(e) => setActiveEventId(e.target.value)}
                  className="w-full h-8 pl-2.5 pr-7 appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-md text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 cursor-pointer shadow-sm transition-colors"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                      {ev.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-sm shrink-0"
                title="Новое мероприятие"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80">
            <div className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Гостевой портал
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {currentUserRole === 'guest' ? 'Гостевой вид' : 'Разделы'}
          </div>
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full h-8 px-2.5 rounded-md text-[13px] font-medium flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && <span className="ml-2 shrink-0">{item.badge}</span>}
              </button>
            );
          })}

          {/* System Section for Admins / Organizers */}
          {(currentUserRole === 'organizer' || currentUserRole === 'admin') && (
            <div className="pt-3">
              <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                СИСТЕМА
              </div>
              <button
                onClick={() => {
                  setActiveTab('admin_panel');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full h-8 px-2.5 rounded-md text-[13px] font-medium flex items-center justify-between transition-colors ${
                  activeTab === 'admin_panel'
                    ? 'bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Shield className={`w-4 h-4 shrink-0 ${activeTab === 'admin_panel' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span className="truncate">Управление системой</span>
                </div>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shrink-0">
                  {users.length}
                </span>
              </button>
            </div>
          )}
        </nav>
      </aside>

      {/* Modal: New Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-lg shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Создание нового мероприятия</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Заполните базовый паспорт события</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Название мероприятия <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Хакатон «Код Будущего 2026»"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Тип события</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
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
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Планируемое число гостей</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.plannedHeadcount}
                    onChange={e => setFormData({ ...formData, plannedHeadcount: Number(e.target.value) })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Дата начала</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Время начала</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Лимит бюджета (₽)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.totalBudgetLimit}
                    onChange={e => setFormData({ ...formData, totalBudgetLimit: Number(e.target.value) })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Локация / Адрес</label>
                <input
                  type="text"
                  placeholder="г. Москва, ул. Примерная, 10 или Ссылка на трансляцию"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ответственный организатор</label>
                <input
                  type="text"
                  placeholder="ФИО лид-организатора"
                  value={formData.leadOrganizer}
                  onChange={e => setFormData({ ...formData, leadOrganizer: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
