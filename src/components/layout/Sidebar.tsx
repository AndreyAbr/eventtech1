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
  PlusCircle,
  X,
  CalendarDays,
  MapPin,
  AlertTriangle,
  ChevronDown,
  Building2
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
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
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
        <span className="ml-auto inline-flex items-center p-1 rounded-full bg-rose-500/20 text-rose-300" title="Превышение бюджета">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        </span>
      ) : null
    },
    { id: 'guests', label: currentUserRole === 'guest' ? 'Регистрация & Билет' : 'Гости и QR-билеты', icon: Users },
    { id: 'team', label: 'Команда и подрядчики', icon: Briefcase, hideInGuest: true },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
    {
      id: 'ai_assistant',
      label: 'ИИ-Ассистент',
      icon: Sparkles,
      hideInGuest: true,
      badge: (
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          AI
        </span>
      )
    }
  ];

  const visibleMenuItems = menuItems.filter(item => !(currentUserRole === 'guest' && item.hideInGuest));

  return (
    <>
      <aside className="w-64 min-w-[16rem] bg-slate-950/90 border-r border-slate-800 flex flex-col h-screen sticky top-0 select-none z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                EventTech <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Hub управления ивентами</p>
            </div>
          </div>
        </div>

        {/* Event Selector & New Button */}
        {currentUserRole !== 'guest' ? (
          <div className="p-3 border-b border-slate-800/60 bg-slate-900/40">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
              Текущее мероприятие
            </label>
            <div className="relative mb-2">
              <select
                aria-label="Выбрать активное мероприятие"
                value={activeEventId}
                onChange={(e) => setActiveEventId(e.target.value)}
                className="w-full bg-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-2 pr-8 appearance-none border border-slate-700/70 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium hover:border-slate-600 transition truncate"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition group shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-indigo-400" />
              <span>+ Новое мероприятие</span>
            </button>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-800/60 bg-indigo-950/20">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Гостевой портал участника
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-1">
            {currentUserRole === 'guest' ? 'Навигация гостя' : 'Разделы системы'}
          </p>
          {visibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition group relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="truncate">{item.label}</span>
                {item.badge}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Локальная БД активна
          </span>
          <span className="font-mono text-[10px] text-slate-600">MVP v1.0</span>
        </div>
      </aside>

      {/* Modal: Create New Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Создание нового мероприятия</h3>
                  <p className="text-xs text-slate-400">Заполните базовый паспорт события для открытия проекта</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Название мероприятия <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Хакатон «Код Будущего 2026»"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Тип события</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Главный организатор</label>
                  <input
                    type="text"
                    required
                    value={formData.leadOrganizer}
                    onChange={e => setFormData({ ...formData, leadOrganizer: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Дата старта</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Время старта</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Дата завершения</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Лимит бюджета (₽)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={formData.totalBudgetLimit}
                    onChange={e => setFormData({ ...formData, totalBudgetLimit: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">План гостей (чел.)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.plannedHeadcount}
                    onChange={e => setFormData({ ...formData, plannedHeadcount: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Локация проведения</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Например: Конгресс-центр Технопарка, Москва"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isOnlineCheck"
                  checked={formData.isOnline}
                  onChange={e => setFormData({ ...formData, isOnline: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 w-4 h-4"
                />
                <label htmlFor="isOnlineCheck" className="text-xs text-slate-300 cursor-pointer">
                  Онлайн-формат (трансляция / виртуальная платформа)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Описание и формат</label>
                <textarea
                  rows={2}
                  placeholder="Краткое описание мероприятия и целевой аудитории..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Цели и ключевые результаты (OKR)</label>
                <input
                  type="text"
                  placeholder="Например: Создать 15 работающих прототипов, привлечь 300 разработчиков"
                  value={formData.goals}
                  onChange={e => setFormData({ ...formData, goals: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
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
