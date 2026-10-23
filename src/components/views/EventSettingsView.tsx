import React, { useState, useEffect } from 'react';
import {
  Save,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Wallet,
  AlertTriangle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { EventEntity, EventType } from '../../types/event';

export const EventSettingsView: React.FC = () => {
  const {
    activeEvent,
    updateEvent,
    deleteEvent,
    events,
    currentUserRole
  } = useEventContext();

  const [formData, setFormData] = useState<EventEntity | null>(null);

  useEffect(() => {
    if (activeEvent) {
      setFormData({ ...activeEvent });
    }
  }, [activeEvent]);

  if (!formData || !activeEvent) {
    return (
      <div className="p-8 text-center text-slate-400">
        Мероприятие не выбрано.
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
    <div className="max-w-4xl space-y-6 pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Паспорт и параметры мероприятия
          </h2>
          <p className="text-xs text-slate-400">
            Редактирование базовой конфигурации, дат, локации и целевых лимитов
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Основная информация
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Название мероприятия <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Тип мероприятия
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as EventType })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Главный организатор / Lead
                </label>
                <input
                  type="text"
                  required
                  value={formData.leadOrganizer}
                  onChange={e => setFormData({ ...formData, leadOrganizer: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Дата начала
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Время открытия
                </label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Дата окончания
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Локация / Адрес площадки
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isOnlineEdit"
                checked={formData.isOnline}
                onChange={e => setFormData({ ...formData, isOnline: e.target.checked })}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isOnlineEdit" className="text-xs text-slate-300 cursor-pointer select-none">
                Мероприятие проводится в онлайн-формате (или гибридно)
              </label>
            </div>
          </div>
        </div>

        {/* Goals & Limits */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Лимиты, описание и ключевые цели
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Общий лимит бюджета (₽)
                  {isTeam && <span className="ml-2 text-[10px] text-amber-400 font-normal">(только чтение для команды)</span>}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    disabled={isTeam}
                    value={formData.totalBudgetLimit}
                    onChange={e => setFormData({ ...formData, totalBudgetLimit: Math.max(0, Number(e.target.value)) })}
                    className={`w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono transition ${
                      isTeam ? 'opacity-60 cursor-not-allowed' : 'focus:outline-none focus:border-indigo-500'
                    }`}
                  />
                  <Wallet className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Планируемое количество гостей (чел.)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={formData.plannedHeadcount}
                    onChange={e => setFormData({ ...formData, plannedHeadcount: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                  <Users className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Подробное описание события
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Цели мероприятия и ожидаемые результаты (OKR)
              </label>
              <textarea
                rows={2}
                value={formData.goals}
                onChange={e => setFormData({ ...formData, goals: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          {currentUserRole === 'admin' ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
            >
              <Trash2 className="w-4 h-4" />
              Удалить мероприятие
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <Save className="w-4 h-4" />
            Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  );
};
