import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatDate, isTaskOverdue } from '../../utils/analytics';

export const CalendarView: React.FC = () => {
  const {
    events,
    tasks,
    activeEventId,
    setActiveEventId,
    setActiveTab
  } = useEventContext();

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Calculate calendar days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week offset for Monday start: Sunday is 0 -> 6, Mon is 1 -> 0
  let startDayOffset = firstDayOfMonth.getDay() - 1;
  if (startDayOffset === -1) startDayOffset = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const calendarCells: { dayNumber: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  for (let i = startDayOffset - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ dayNumber: day, dateStr, isCurrentMonth: false });
  }

  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({ dayNumber: i, dateStr, isCurrentMonth: true });
  }

  // Next month leading days to complete full weeks
  const remainingCells = 42 - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    const m = month + 2 > 12 ? 1 : month + 2;
    const y = month + 2 > 12 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarCells.push({ dayNumber: i, dateStr, isCurrentMonth: false });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Timeline items across all events
  const timelineItems = [
    ...events.map(ev => ({
      id: ev.id,
      date: ev.startDate,
      type: 'event' as const,
      title: `Ивент: ${ev.title}`,
      subtitle: `${ev.type} • ${ev.location}`,
      eventId: ev.id,
      priority: 'high'
    })),
    ...tasks.map(t => {
      const isOver = isTaskOverdue(t.deadline, t.status);
      return {
        id: t.id,
        date: t.deadline,
        type: 'task' as const,
        title: `Дедлайн: ${t.title}`,
        subtitle: `Статус: ${t.status === 'done' ? 'Готово' : isOver ? 'Просрочено' : 'В работе'}`,
        eventId: t.eventId,
        priority: t.priority,
        isOverdue: isOver,
        isDone: t.status === 'done'
      };
    })
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleItemClick = (eventId: string, type: 'event' | 'task') => {
    setActiveEventId(eventId);
    if (type === 'event') {
      setActiveTab('settings');
    } else {
      setActiveTab('tasks');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Calendar Header with Navigation */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white capitalize">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400">
              Календарная сетка событий и контрольных точек дедлайнов
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Сегодня
          </button>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Следующий месяц"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Month Calendar & Upcoming Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left (2 cols): Calendar Grid */}
        <div className="xl:col-span-2 glass-panel p-4 sm:p-5 rounded-2xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs mb-2 uppercase tracking-wider">
            {daysOfWeek.map(d => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const dayEvents = events.filter(e => e.startDate === cell.dateStr);
              const dayTasks = tasks.filter(t => t.deadline === cell.dateStr);

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[105px] p-1.5 rounded-xl border flex flex-col justify-between transition ${
                    isToday
                      ? 'border-indigo-500 bg-indigo-950/25 ring-1 ring-indigo-500/50'
                      : cell.isCurrentMonth
                      ? 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/40'
                      : 'border-slate-900/60 bg-slate-950/30 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {(dayEvents.length > 0 || dayTasks.length > 0) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16 mt-1">
                    {/* Events badges */}
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => handleItemClick(ev.id, 'event')}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold truncate cursor-pointer transition"
                        title={ev.title}
                      >
                        🎯 {ev.title}
                      </div>
                    ))}

                    {/* Tasks badges */}
                    {dayTasks.map(t => {
                      const isOver = isTaskOverdue(t.deadline, t.status);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleItemClick(t.eventId, 'task')}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium truncate cursor-pointer transition ${
                            t.status === 'done'
                              ? 'bg-slate-800 text-slate-400 line-through'
                              : isOver
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                          title={t.title}
                        >
                          • {t.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (1 col): Chronological Timeline / Milestones */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col max-h-[700px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Таймлайн контрольных точек
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {timelineItems.length} событий
            </span>
          </div>

          <div className="space-y-3.5 overflow-y-auto flex-1 pr-1">
            {timelineItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                События не запланированы
              </div>
            ) : (
              timelineItems.map((item, index) => {
                const isEvent = item.type === 'event';
                return (
                  <div
                    key={item.id + index}
                    onClick={() => handleItemClick(item.eventId, item.type)}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 hover:border-indigo-500/40 transition cursor-pointer group flex items-start gap-3"
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isEvent
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'isOverdue' in item && item.isOverdue
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {isEvent ? (
                        <CalendarDays className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] text-slate-400">
                          {formatDate(item.date)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isEvent
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'isOverdue' in item && item.isOverdue
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isEvent ? 'Ивент' : 'Дедлайн'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
