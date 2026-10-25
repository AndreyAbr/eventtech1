import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Wallet,
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { EventEntity, EventType } from '../../types/event';

export const EventSettingsView: React.FC = () => {
  const {
    activeEvent,
    updateEvent,
    deleteEvent,
    events,
    currentUserRole,
    sysCatalogs
  } = useEventContext();

  const eventTypes = useMemo(() => {
    const fromCat = sysCatalogs.filter(c => c.catalogType === 'event_types').map(c => c.name);
    return fromCat.length > 0 ? fromCat : ['Хакатон', 'Конференция', 'Корпоратив', 'Форум', 'Воркшоп', 'Выставка'];
  }, [sysCatalogs]);

  const [formData, setFormData] = useState<EventEntity | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (activeEvent) {
      setFormData({ ...activeEvent });
    }
  }, [activeEvent]);

  if (!formData || !activeEvent) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        Мероприятие не выбрано. Выберите или создайте проект в меню слева.
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    updateEvent({
      ...formData,
      plannedHeadcount: Math.max(1, Number(formData.plannedHeadcount) || 1),
      totalBudgetLimit: Math.max(0, Number(formData.totalBudgetLimit) || 0)
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleDelete = () => {
    if (events.length <= 1) {
      alert('Невозможно удалить единственное оставшееся мероприятие.');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите безвозвратно удалить проект «${formData.title}» и все привязанные данные?`)) {
      deleteEvent(formData.id);
    }
  };

  const isTeam = currentUserRole === 'team';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Паспорт и параметры мероприятия
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Редактирование базовой конфигурации, расписания, площадки и целевых лимитов
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Изменения сохранены
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            {formData.type}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card 1: Basic Information */}
        <div className="card-surface p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              Основная информация
            </h2>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">ID: {formData.id}</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Название мероприятия <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="input-base w-full"
                placeholder="Например: AI Summit 2026"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Тип мероприятия
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
                  className="input-base w-full"
                >
                  {eventTypes.map((t: string) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Главный организатор / Lead <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.leadOrganizer}
                  onChange={e => setFormData({ ...formData, leadOrganizer: e.target.value })}
                  className="input-base w-full"
                  placeholder="Имя Фамилия"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Дата начала
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="input-base w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  Время открытия
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="input-base w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  Дата окончания
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="input-base w-full font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Локация / Адрес площадки
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="input-base w-full pl-8"
                  placeholder="Город, адрес или название площадки"
                />
                <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="isOnlineEdit"
                  checked={formData.isOnline}
                  onChange={e => setFormData({ ...formData, isOnline: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 w-3.5 h-3.5 cursor-pointer"
                />
                <span className="text-xs text-zinc-700 dark:text-zinc-300">
                  Мероприятие проводится в онлайн-формате (или гибридно с трансляцией)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Goals, Limits & Description */}
        <div className="card-surface p-4 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              Лимиты бюджета и ключевые цели
            </h2>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Общий лимит бюджета (₽)
                  {isTeam && (
                    <span className="ml-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-normal">
                      (только чтение для роли «Команда»)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    disabled={isTeam}
                    value={formData.totalBudgetLimit}
                    onChange={e => setFormData({ ...formData, totalBudgetLimit: Math.max(0, Number(e.target.value)) })}
                    className={`input-base w-full font-mono tabular-nums pr-8 ${
                      isTeam ? 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 cursor-not-allowed' : ''
                    }`}
                  />
                  <Wallet className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Планируемое количество гостей (чел.)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.plannedHeadcount}
                    onChange={e => setFormData({ ...formData, plannedHeadcount: Math.max(1, Number(e.target.value)) })}
                    className="input-base w-full font-mono tabular-nums pr-8"
                  />
                  <Users className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Подробное описание события
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-2.5 py-2 rounded-md bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-colors resize-none leading-relaxed"
                placeholder="Краткое описание программы, целевой аудитории и формата..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Цели мероприятия и ожидаемые результаты (OKR / KPI)
              </label>
              <textarea
                rows={2}
                value={formData.goals}
                onChange={e => setFormData({ ...formData, goals: e.target.value })}
                className="w-full px-2.5 py-2 rounded-md bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-colors resize-none leading-relaxed"
                placeholder="Ключевые метрики успеха (например: 300+ участников, NPS 85+)..."
              />
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-1">
          {currentUserRole === 'admin' ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-red-200 dark:border-red-900/60 bg-white dark:bg-red-950/20 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Удалить мероприятие
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="btn-primary"
            >
              <Save className="w-3.5 h-3.5" />
              Сохранить параметры
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
