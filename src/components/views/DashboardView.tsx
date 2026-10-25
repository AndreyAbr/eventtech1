import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  Users,
  CheckSquare,
  Wallet,
  Clock,
  Star,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatCurrency, formatDate, isTaskOverdue, pluralizeRu } from '../../utils/analytics';
import { exportBudgetToCSV } from '../../utils/csvExport';
import { CATEGORY_COLORS } from './BudgetView';
import { TaskItem } from '../../types/event';

export const DashboardView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeBudget,
    activeGuests,
    activeContractors,
    activeTeam,
    activeKanbanStages,
    metrics,
    setActiveTab,
    updateTask,
    notify
  } = useEventContext();

  // Donut chart state
  const [donutMode, setDonutMode] = useState<'actual' | 'planned'>('actual');
  const [hoveredDonutCategory, setHoveredDonutCategory] = useState<string | null>(null);

  // Kanban breakdown hover state
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Мероприятие не выбрано. Выберите или создайте проект в меню слева.
      </div>
    );
  }

  // Set of completed stage IDs
  const completedStageSet = new Set(
    activeKanbanStages
      .filter(s => s.isCompletedStage || s.id.endsWith('-done'))
      .map(s => s.id)
  );
  completedStageSet.add('done');
  const completedStageIds = Array.from(completedStageSet);

  // Urgent & overdue tasks: exclude completed tasks, sort overdue first, then nearest deadline
  const urgentTasks = activeTasks
    .filter(t => !completedStageSet.has(t.status) && !t.status.endsWith('-done'))
    .sort((a, b) => {
      const aOverdue = isTaskOverdue(a, completedStageIds);
      const bOverdue = isTaskOverdue(b, completedStageIds);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    })
    .slice(0, 5);

  const handleQuickCompleteTask = (task: TaskItem) => {
    const doneStage = activeKanbanStages.find(s => s.isCompletedStage || s.id.endsWith('-done'))?.id || 'done';
    updateTask({
      ...task,
      status: doneStage
    });
    notify(`Задача «${task.title}» отмечена как выполненная!`, 'success');
  };

  // Group budget spending by category
  const categoryExpenses = useMemo(() => {
    const map: Record<string, { planned: number; actual: number }> = {};
    activeBudget.forEach(item => {
      if (!map[item.category]) {
        map[item.category] = { planned: 0, actual: 0 };
      }
      map[item.category].planned += Number(item.plannedAmount) || 0;
      map[item.category].actual += Number(item.actualAmount) || 0;
    });
    return map;
  }, [activeBudget]);

  // Donut chart segments calculation
  const donutData = useMemo(() => {
    const entries = Object.entries(categoryExpenses);
    const total = entries.reduce((s, [, v]) => s + (donutMode === 'actual' ? v.actual : v.planned), 0);
    const effectiveTotal = Math.max(1, total);

    let currentOffset = 0;
    const circumference = 2 * Math.PI * 52; // r = 52

    const slices = entries
      .map(([cat, val]) => {
        const amount = donutMode === 'actual' ? val.actual : val.planned;
        const pct = (amount / effectiveTotal) * 100;
        const strokeLength = (pct / 100) * circumference;
        const offset = currentOffset;
        currentOffset += strokeLength;

        return {
          category: cat,
          amount,
          pct: Number(pct.toFixed(1)),
          strokeLength,
          offset,
          color: CATEGORY_COLORS[cat] || '#71717A'
        };
      })
      .filter(s => s.amount > 0);

    return { slices, total, circumference };
  }, [categoryExpenses, donutMode]);

  // Kanban Stage Breakdown Chart Data
  const kanbanBreakdown = useMemo(() => {
    return activeKanbanStages.map(stage => {
      const stageTasks = activeTasks.filter(t => t.status === stage.id);
      const isStageCompleted = stage.isCompletedStage || stage.id.endsWith('-done') || stage.id === 'done';

      const critical = stageTasks.filter(t => t.priority === 'critical').length;
      const high = stageTasks.filter(t => t.priority === 'high').length;
      const regular = stageTasks.filter(t => t.priority === 'medium' || t.priority === 'low').length;
      const overdue = stageTasks.filter(t => !isStageCompleted && isTaskOverdue(t, completedStageIds)).length;

      return {
        stageId: stage.id,
        title: stage.title,
        color: stage.color,
        total: stageTasks.length,
        critical,
        high,
        regular,
        overdue
      };
    });
  }, [activeKanbanStages, activeTasks, completedStageIds]);

  const maxStageCount = Math.max(1, ...kanbanBreakdown.map(k => k.total));

  // Attendance Funnel Data
  const funnelData = useMemo(() => {
    const quota = Math.max(1, Number(activeEvent.plannedHeadcount) || 100);
    const registered = activeGuests.filter(g => g.status !== 'cancelled').length;
    const confirmed = activeGuests.filter(g => g.status === 'confirmed' || g.status === 'checked_in').length;
    const checkedIn = activeGuests.filter(g => g.status === 'checked_in').length;

    // Ticket breakdown
    const tickets: Record<string, number> = {
      'VIP': 0,
      'Спикер': 0,
      'Стандарт': 0,
      'Пресса': 0
    };
    activeGuests.forEach(g => {
      if (g.status !== 'cancelled') {
        tickets[g.ticketType] = (tickets[g.ticketType] || 0) + 1;
      }
    });

    return {
      steps: [
        { label: 'Квота зала', count: quota, pct: 100, color: 'bg-zinc-200 dark:bg-zinc-800' },
        { label: 'Регистрации', count: registered, pct: Math.round((registered / quota) * 100), color: 'bg-blue-500' },
        { label: 'Подтверждено', count: confirmed, pct: registered > 0 ? Math.round((confirmed / registered) * 100) : 0, color: 'bg-violet-500' },
        { label: 'Чек-ин (зал)', count: checkedIn, pct: confirmed > 0 ? Math.round((checkedIn / confirmed) * 100) : 0, color: 'bg-emerald-500' }
      ],
      tickets
    };
  }, [activeEvent, activeGuests]);

  // Over-budget items list
  const overBudgetItems = activeBudget
    .filter(b => (Number(b.actualAmount) || 0) > (Number(b.plannedAmount) || 0))
    .slice(0, 4);

  // Negotiating contractors
  const negotiatingContractors = activeContractors
    .filter(c => c.status === 'negotiation')
    .slice(0, 4);

  const activeDonutSlice = donutData.slices.find(s => s.category === hoveredDonutCategory);

  return (
    <div className="space-y-4 animate-fade-in pb-12 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Сводка проекта
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Оперативная аналитика готовности, финансового баланса и конверсии гостей
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="btn-secondary h-8 text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Экспорт сметы</span>
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className="btn-primary h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Новая задача</span>
          </button>
        </div>
      </div>

      {/* 1. Unified Telemetry Strip (Single Monolithic Row with 1px dividers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#111114] shadow-xs overflow-hidden">
        {/* Metric 1: Readiness -> Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="p-4 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group relative"
          title="Перейти к доске задач"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Готовность ивента
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {metrics.readinessPercent}%
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {metrics.completedTasksCount}/{metrics.totalTasksCount} задач
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
              style={{ width: `${metrics.readinessPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>Просрочено:</span>
            {metrics.overdueTasksCount > 0 ? (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {metrics.overdueTasksCount} {pluralizeRu(metrics.overdueTasksCount, ['задача', 'задачи', 'задач'])}
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">В графике</span>
            )}
          </div>
        </div>

        {/* Metric 2: Guests & Check-in -> Guests */}
        <div
          onClick={() => setActiveTab('guests')}
          className="p-4 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group relative"
          title="Перейти к реестру гостей"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Участники & Чек-ин
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {metrics.registeredCount}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              из {activeEvent.plannedHeadcount} мест
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((metrics.registeredCount / Math.max(1, activeEvent.plannedHeadcount)) * 100))}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>На площадке:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {metrics.checkedInCount} ({metrics.attendanceRate}%)
            </span>
          </div>
        </div>

        {/* Metric 3: Budget -> Budget */}
        <div
          onClick={() => setActiveTab('budget')}
          className="p-4 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group relative"
          title="Перейти к смете"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Фактический расход
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-semibold font-mono tabular-nums ${
              metrics.isOverTotalLimit ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'
            }`}>
              {formatCurrency(metrics.totalActualBudget)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.isOverTotalLimit ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.round((metrics.totalActualBudget / Math.max(1, activeEvent.totalBudgetLimit)) * 100))}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>Лимит:</span>
            <span>{formatCurrency(activeEvent.totalBudgetLimit)}</span>
          </div>
        </div>

        {/* Metric 4: NPS & Feedback -> Surveys */}
        <div
          onClick={() => setActiveTab('guests')}
          className="p-4 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors group relative"
          title="Перейти к отзывам"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Оценка гостей (NPS)
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
              {metrics.averageRating > 0 ? `${metrics.averageRating}` : '—'}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">из 5.0</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(metrics.averageRating || 0)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-300 dark:text-zinc-700'
                }`}
              />
            ))}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-between font-mono">
            <span>Всего ответов:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {metrics.surveysCount} {pluralizeRu(metrics.surveysCount, ['анкета', 'анкеты', 'анкет'])}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Visual Analytics Block (3 Charts in 1 Unified Grid) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#111114] grid grid-cols-1 lg:grid-cols-3 overflow-hidden shadow-xs">
        {/* CHART 1: Interactive SVG Donut Chart for Budget */}
        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Структура расходов
              </h3>
            </div>
            {/* Mode toggle */}
            <div className="inline-flex rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setDonutMode('actual')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  donutMode === 'actual'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Факт
              </button>
              <button
                type="button"
                onClick={() => setDonutMode('planned')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  donutMode === 'planned'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                План
              </button>
            </div>
          </div>

          {/* SVG Donut Visual */}
          <div className="relative flex items-center justify-center my-1 cursor-pointer" onClick={() => setActiveTab('budget')}>
            <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-[-90deg]">
              {/* Background circle track */}
              <circle
                cx="90"
                cy="90"
                r="52"
                fill="none"
                stroke="currentColor"
                className="text-zinc-100 dark:text-zinc-800/80"
                strokeWidth="16"
              />

              {/* Slices */}
              {donutData.slices.map(slice => {
                const isHovered = hoveredDonutCategory === slice.category;
                const isDimmed = hoveredDonutCategory && !isHovered;

                return (
                  <circle
                    key={slice.category}
                    cx="90"
                    cy="90"
                    r="52"
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 20 : 16}
                    strokeDasharray={`${slice.strokeLength} ${donutData.circumference - slice.strokeLength}`}
                    strokeDashoffset={-slice.offset}
                    onMouseEnter={() => setHoveredDonutCategory(slice.category)}
                    onMouseLeave={() => setHoveredDonutCategory(null)}
                    className="transition-all duration-200 cursor-pointer"
                    style={{ opacity: isDimmed ? 0.35 : 1 }}
                  />
                );
              })}
            </svg>

            {/* Center Dynamic Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeDonutSlice ? (
                <div className="animate-fade-in space-y-0.5">
                  <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[110px]">
                    {activeDonutSlice.category}
                  </div>
                  <div className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {formatCurrency(activeDonutSlice.amount)}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {activeDonutSlice.pct}% сметы
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {donutMode === 'actual' ? 'Освоено' : 'План'}
                  </div>
                  <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {Math.round((donutData.total / Math.max(1, activeEvent.totalBudgetLimit)) * 100)}%
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formatCurrency(donutData.total)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Legend Chips */}
          <div className="flex flex-wrap gap-1 justify-center pt-1 border-t border-zinc-100 dark:border-zinc-800">
            {donutData.slices.slice(0, 4).map(slice => (
              <span
                key={slice.category}
                onMouseEnter={() => setHoveredDonutCategory(slice.category)}
                onMouseLeave={() => setHoveredDonutCategory(null)}
                className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: slice.color }} />
                <span>{slice.category.split(' ')[0]}</span>
                <span className="text-zinc-400">{slice.pct}%</span>
              </span>
            ))}
          </div>
        </div>

        {/* CHART 2: Kanban Stages & Priority Breakdown Chart */}
        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Задачи по этапам
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5 cursor-pointer"
            >
              Доска <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Stage Columns Distribution */}
          <div className="space-y-2.5 my-auto pt-1">
            {kanbanBreakdown.map(stage => {
              const barWidth = Math.round((stage.total / maxStageCount) * 100);
              const isHovered = hoveredStageId === stage.stageId;

              return (
                <div
                  key={stage.stageId}
                  onMouseEnter={() => setHoveredStageId(stage.stageId)}
                  onMouseLeave={() => setHoveredStageId(null)}
                  onClick={() => setActiveTab('tasks')}
                  className={`p-2 rounded-md transition-colors cursor-pointer border ${
                    isHovered
                      ? 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700'
                      : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[160px]">
                      {stage.title}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      <strong>{stage.total}</strong> {pluralizeRu(stage.total, ['задача', 'задачи', 'задач'])}
                    </span>
                  </div>

                  {/* Multi-segment priority progress bar */}
                  <div className="h-2 w-full bg-zinc-200/70 dark:bg-zinc-800 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                    {stage.critical > 0 && (
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(stage.critical / Math.max(1, stage.total)) * 100}%` }}
                        title={`Критичные: ${stage.critical}`}
                      />
                    )}
                    {stage.high > 0 && (
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${(stage.high / Math.max(1, stage.total)) * 100}%` }}
                        title={`Высокий приоритет: ${stage.high}`}
                      />
                    )}
                    {stage.regular > 0 && (
                      <div
                        className="h-full bg-zinc-600 dark:bg-zinc-400 rounded-full"
                        style={{ width: `${(stage.regular / Math.max(1, stage.total)) * 100}%` }}
                        title={`Обычные: ${stage.regular}`}
                      />
                    )}
                  </div>

                  {/* Overdue alert indicator */}
                  {stage.overdue > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-red-600 dark:text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>{stage.overdue} просрочено</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Priority Legend */}
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Крит.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Высок.
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-600 dark:bg-zinc-400" /> Стандарт
            </span>
          </div>
        </div>

        {/* CHART 3: Attendance Funnel Chart */}
        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Воронка участников
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('guests')}
              className="text-[11px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5 cursor-pointer"
            >
              Гости <ArrowRight className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Funnel Steps */}
          <div
            onClick={() => setActiveTab('guests')}
            className="space-y-2 my-auto pt-1 cursor-pointer"
          >
            {funnelData.steps.map((step, idx) => (
              <div key={step.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    {idx + 1}. {step.label}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {step.count} чел.
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      ({step.pct}%)
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${step.color}`}
                    style={{ width: `${Math.min(100, step.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Ticket types breakdown */}
          <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            {Object.entries(funnelData.tickets).map(([type, count]) => (
              <span key={type} className="truncate">
                {type}: <strong className="text-zinc-900 dark:text-zinc-100">{count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Lower Dual Work Block (Unified Monolithic Split Table) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-[#111114] grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-xs">
        {/* Left Column (7 cols): Urgent & Overdue Tasks */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Горящие дедлайны и просроченные задачи
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer"
            >
              Все задачи ({activeTasks.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {urgentTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Горящих или просроченных задач нет. Все в графике!
              </div>
            ) : (
              urgentTasks.map(task => {
                const overdue = isTaskOverdue(task, completedStageIds);
                const member = activeTeam.find(m => m.id === task.assigneeId);

                return (
                  <div
                    key={task.id}
                    className="p-3.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Quick complete checkbox */}
                      <button
                        type="button"
                        onClick={() => handleQuickCompleteTask(task)}
                        className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                        title="Отметить задачу как выполненную"
                      >
                        <Check className="w-2.5 h-2.5 text-transparent hover:text-emerald-600" />
                      </button>

                      <div className="min-w-0">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {task.title}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{member ? member.fullName : 'Не назначен'}</span>
                          <span>•</span>
                          <span className="font-mono">{formatDate(task.deadline)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          task.priority === 'critical'
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200/70 dark:border-red-900/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60'
                        }`}
                      >
                        {task.priority === 'critical' ? 'Критично' : 'Высокий'}
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-semibold">
                          Просрочено
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Budget Risks & Contractor Agreements */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Риски сметы и подрядчики
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('budget')}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer"
            >
              Смета <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
            {/* Over budget items */}
            {overBudgetItems.length > 0 && (
              <div className="p-3.5 space-y-2 bg-red-50/20 dark:bg-red-950/10">
                <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider block">
                  Превышение плана по статьям ({overBudgetItems.length}):
                </span>
                <div className="space-y-1.5">
                  {overBudgetItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
                        {item.title}
                      </span>
                      <span className="font-mono text-red-600 dark:text-red-400 font-semibold text-[11px]">
                        +{formatCurrency(item.actualAmount - item.plannedAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contractors in negotiation */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Подрядчики на согласовании ({negotiatingContractors.length}):
                </span>
                <button
                  onClick={() => setActiveTab('team')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer"
                >
                  К подрядчикам
                </button>
              </div>

              {negotiatingContractors.length === 0 ? (
                <div className="text-zinc-400 text-xs py-1">
                  Все подрядчики законтрактованы.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {negotiatingContractors.map(c => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {c.companyName}
                        </span>
                        <span className="text-[11px] text-zinc-400 ml-1.5">({c.serviceType})</span>
                      </div>
                      <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                        {formatCurrency(c.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
