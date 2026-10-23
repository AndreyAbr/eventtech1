import React, { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  CheckSquare,
  Wallet,
  Users,
  Briefcase,
  Calendar,
  Sparkles,
  Plus,
  X,
  ChevronDown
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
    currentUserRole
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
    leadOrganizer: 'Алексей Морозов'
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
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
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
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
          перерасход
        </span>
      ) : null
    },
    { id: 'guests', label: currentUserRole === 'guest' ? 'Регистрация & Билет' : 'Гости и QR-билеты', icon: Users },
    { id: 'team', label: 'Команда и подрядчики', icon: Briefcase, hideInGuest: true },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    {
      id: 'ai_assistant',
      label: 'Автоматизация и аудит',
      icon: Sparkles,
      hideInGuest: true,
      badge: (
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/80 text-zinc-700 font-medium">
          AUTO
        </span>
      )
    }
  ];

  const visibleMenuItems = menuItems.filter(item => !(currentUserRole === 'guest' && item.hideInGuest));

  return (
    <>
      <aside className="w-60 min-w-[240px] bg-[#F4F4F5]/70 border-r border-zinc-200 flex flex-col h-screen select-none sticky top-0 z-20">
        {/* Brand Header */}
        <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between bg-white/50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-zinc-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              E
            </span>
            <span className="text-xs font-semibold text-zinc-900 tracking-tight">
              EventTech Hub
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
            v1.0
          </span>
        </div>

        {/* Project Switcher */}
        {currentUserRole !== 'guest' ? (
          <div className="p-3 border-b border-zinc-200">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <select
                  aria-label="Выбрать активное мероприятие"
                  value={activeEventId}
                  onChange={(e) => setActiveEventId(e.target.value)}
                  className="w-full h-8 pl-2.5 pr-7 appearance-none bg-white border border-zinc-200 hover:border-zinc-300 rounded-md text-xs font-medium text-zinc-900 truncate focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 cursor-pointer shadow-sm transition-colors"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-zinc-900 transition-colors shadow-sm shrink-0"
                title="Новое мероприятие"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 border-b border-zinc-200">
            <div className="px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-xs font-medium text-zinc-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Гостевой портал
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            {currentUserRole === 'guest' ? 'Гостевой вид' : 'Разделы'}
          </div>
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full h-8 px-2.5 rounded-md text-[13px] font-medium flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-zinc-200/80 text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-900' : 'text-zinc-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && <span className="ml-2 shrink-0">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 text-xs text-zinc-500 flex items-center justify-between bg-white/40">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Локальная БД
          </span>
          <span className="font-mono text-[11px] text-zinc-400">MVP</span>
        </div>
      </aside>

      {/* Modal: New Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40">
          <div className="bg-white border border-zinc-200 rounded-lg w-full max-w-lg shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Создание нового мероприятия</h3>
                <p className="text-xs text-zinc-500">Заполните базовый паспорт события</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Тип события</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="input-base w-full cursor-pointer"
                  >
                    <option value="Хакатон">Хакатон</option>
                    <option value="Конференция">Конференция</option>
                    <option value="Корпоратив">Корпоратив</option>
                    <option value="Форум">Форум</option>
                    <option value="Воркшоп">Воркшоп</option>
                    <option value="Выставка">Выставка</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Главный организатор</label>
                  <input
                    type="text"
                    required
                    value={formData.leadOrganizer}
                    onChange={e => setFormData({ ...formData, leadOrganizer: e.target.value })}
                    className="input-base w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Дата старта</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Время</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Лимит бюджета (₽)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={formData.totalBudgetLimit}
                    onChange={e => setFormData({ ...formData, totalBudgetLimit: Math.max(0, Number(e.target.value)) })}
                    className="input-base w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">План гостей (чел.)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.plannedHeadcount}
                    onChange={e => setFormData({ ...formData, plannedHeadcount: Math.max(1, Number(e.target.value)) })}
                    className="input-base w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Локация проведения</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Конгресс-центр Технопарка, Москва"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="isOnlineCheck"
                  checked={formData.isOnline}
                  onChange={e => setFormData({ ...formData, isOnline: e.target.checked })}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-3.5 h-3.5"
                />
                <label htmlFor="isOnlineCheck" className="text-xs text-zinc-700 cursor-pointer">
                  Онлайн-формат (трансляция / виртуальная платформа)
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Описание и формат</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2">
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
                  Создать проект
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
