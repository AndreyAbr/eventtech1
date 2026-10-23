import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatDate, isTaskOverdue, pluralizeRu } from '../../utils/analytics';

export const CalendarView: React.FC = () => {
  const {
    events,
    tasks,
    setActiveEventId,
    setActiveTab
  } = useEventContext();

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startDayOffset = firstDayOfMonth.getDay() - 1;
  if (startDayOffset === -1) startDayOffset = 6;

  const totalDays = lastDayOfMonth.getDate();
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

  const timelineItems = [
    ...events.map(ev => ({
      id: ev.id,
      date: ev.startDate,
      type: 'event' as const,
      title: ev.title,
      subtitle: `${ev.type} • ${ev.location}`,
      eventId: ev.id
    })),
    ...tasks.map(t => {
      const isOver = isTaskOverdue(t.deadline, t.status);
      return {
        id: t.id,
        date: t.deadline,
        type: 'task' as const,
        title: t.title,
        subtitle: `Статус: ${t.status === 'done' ? 'Готово' : isOver ? 'Просрочено' : 'В работе'}`,
        eventId: t.eventId,
        isOverdue: isOver
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
    <div className="space-y-4">
      {/* Top Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight capitalize">
            {monthNames[month]} {year}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Сетка проведения мероприятий и контрольных дедлайнов
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="btn-secondary h-8"
          >
            Сегодня
          </button>
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              title="Следующий месяц"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Month Calendar & Milestones */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left (2 cols): Calendar Grid */}
        <div className="xl:col-span-2 card-surface p-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-px text-center font-medium text-zinc-400 dark:text-zinc-500 text-xs mb-1 uppercase tracking-wider">
            {daysOfWeek.map(d => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 border-t border-l border-zinc-200 dark:border-zinc-800">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const dayEvents = events.filter(e => e.startDate === cell.dateStr);
              const dayTasks = tasks.filter(t => t.deadline === cell.dateStr);

              return (
                <div
                  key={idx}
                  className={`border-r border-b border-zinc-200 dark:border-zinc-800 min-h-[96px] p-1.5 flex flex-col justify-between transition-colors ${
                    isToday
                      ? 'bg-zinc-100/70 dark:bg-zinc-800/60'
                      : cell.isCurrentMonth
                      ? 'bg-white dark:bg-[#121215] hover:bg-zinc-50/40 dark:hover:bg-zinc-800/40'
                      : 'bg-zinc-50/30 dark:bg-zinc-900/30 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium w-5 h-5 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                          : cell.isCurrentMonth
                          ? 'text-zinc-700 dark:text-zinc-300'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16 mt-1">
                    {/* Event tags */}
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => handleItemClick(ev.id, 'event')}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer"
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}

                    {/* Task tags */}
                    {dayTasks.map(t => {
                      const isOver = isTaskOverdue(t.deadline, t.status);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleItemClick(t.eventId, 'task')}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer border ${
                            t.status === 'done'
                              ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 line-through border-zinc-200 dark:border-zinc-800'
                              : isOver
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60'
                              : 'bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
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

        {/* Right (1 col): Milestones Timeline */}
        <div className="card-surface p-4 flex flex-col max-h-[700px]">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5 mb-3">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Контрольные точки
            </h2>
            <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
              {timelineItems.length} {pluralizeRu(timelineItems.length, ['событие', 'события', 'событий'])}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1 divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {timelineItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Событий нет
              </div>
            ) : (
              timelineItems.map((item, index) => {
                const isEvent = item.type === 'event';
                return (
                  <div
                    key={item.id + index}
                    onClick={() => handleItemClick(item.eventId, item.type)}
                    className="pt-2 first:pt-0 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-mono text-zinc-500 dark:text-zinc-400">
                        {formatDate(item.date)}
                      </span>
                      <span className={`font-mono text-[10px] px-1 py-0.2 rounded uppercase ${
                        isEvent ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'
                      }`}>
                        {isEvent ? 'Ивент' : 'Дедлайн'}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline truncate">
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {item.subtitle}
                    </p>
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
