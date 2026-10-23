import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Check,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatCurrency, formatDate, isTaskOverdue, pluralizeRu } from '../../utils/analytics';
import { exportBudgetToCSV } from '../../utils/csvExport';

export const DashboardView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeBudget,
    activeKanbanStages,
    metrics,
    setActiveTab,
    updateTask,
    notify
  } = useEventContext();

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Мероприятие не выбрано. Выберите или создайте проект в меню слева.
      </div>
    );
  }

  // Set of completed stage IDs (custom stages with isCompletedStage or ending in -done, plus 'done')
  const completedStageSet = new Set(
    activeKanbanStages
      .filter(s => s.isCompletedStage || s.id.endsWith('-done'))
      .map(s => s.id)
  );
  completedStageSet.add('done');
  const completedStageIds = Array.from(completedStageSet);

  // Urgent & overdue tasks: exclude all completed tasks, sort overdue first, then closest deadline
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

  // Group budget spending by category
  const categoryExpenses = activeBudget.reduce<Record<string, { planned: number; actual: number }>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { planned: 0, actual: 0 };
    }
    acc[item.category].planned += Number(item.plannedAmount) || 0;
    acc[item.category].actual += Number(item.actualAmount) || 0;
    return acc;
  }, {});

  const categoryList = Object.entries(categoryExpenses).sort((a, b) => b[1].actual - a[1].actual);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Сводка проекта
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ключевые метрики готовности, дедлайны и финансовый баланс
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="btn-secondary"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            Экспорт сметы
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Новая задача
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {(metrics.isOverTotalLimit || metrics.criticalOverdueTasksCount > 0) && (
        <div className="bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md px-3.5 py-2 text-xs text-red-800 dark:text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span>
              {metrics.isOverTotalLimit && (
                <span>
                  Перерасход сметы: <strong className="font-mono">{formatCurrency(metrics.budgetOverrunAmount)}</strong>.
                </span>
              )}
              {metrics.isOverTotalLimit && metrics.criticalOverdueTasksCount > 0 && ' '}
              {metrics.criticalOverdueTasksCount > 0 && (
                <span>
                  Обнаружено <strong className="font-mono">{metrics.criticalOverdueTasksCount}</strong>{' '}
                  {pluralizeRu(metrics.criticalOverdueTasksCount, [
                    'критическая просроченная задача',
                    'критические просроченные задачи',
                    'критических просроченных задач'
                  ])}.
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {metrics.isOverTotalLimit && (
              <button
                onClick={() => setActiveTab('budget')}
                className="text-xs font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline cursor-pointer"
              >
                Ревизия сметы
              </button>
            )}
            {metrics.criticalOverdueTasksCount > 0 && (
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline cursor-pointer"
              >
                К задачам →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Horizontal KPI Metric Bar (All Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 shadow-sm">
        {/* Metric 1: Readiness -> Tasks */}
        <div
          onClick={() => setActiveTab('tasks')}
          className="p-4 cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group relative"
          title="Нажмите для перехода к задачам"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Готовность ивента
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-1">
            {metrics.readinessPercent}%
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center justify-between">
            <span>
              {metrics.completedTasksCount} из {metrics.totalTasksCount}{' '}
              {pluralizeRu(metrics.totalTasksCount, ['задачи', 'задач', 'задач'])}
            </span>
            {metrics.overdueTasksCount > 0 ? (
              <span className="text-red-600 dark:text-red-400 font-medium font-mono text-[11px]">
                {metrics.overdueTasksCount} просрочено
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">В графике</span>
            )}
          </div>
        </div>

        {/* Metric 2: Guests & Check-in -> Guests */}
        <div
          onClick={() => setActiveTab('guests')}
          className="p-4 cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group relative"
          title="Нажмите для перехода к списку гостей и чек-ину"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Участники & Чек-ин
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-1">
            {metrics.registeredCount}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center justify-between">
            <span>План: {activeEvent.plannedHeadcount} чел.</span>
            <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 font-medium">
              Чек-ин: {metrics.checkedInCount} ({metrics.attendanceRate}%)
            </span>
          </div>
        </div>

        {/* Metric 3: Budget -> Budget */}
        <div
          onClick={() => setActiveTab('budget')}
          className="p-4 cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group relative"
          title="Нажмите для перехода к смете и бюджету"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Фактические расходы
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className={`text-2xl font-semibold font-mono tabular-nums mt-1 ${
            metrics.isOverTotalLimit ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'
          }`}>
            {formatCurrency(metrics.totalActualBudget)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center justify-between">
            <span>Лимит: {formatCurrency(activeEvent.totalBudgetLimit)}</span>
            <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
              {formatCurrency(metrics.costPerAttendee)}/гость
            </span>
          </div>
        </div>

        {/* Metric 4: NPS & Feedback -> Guests (Surveys) */}
        <div
          onClick={() => setActiveTab('guests')}
          className="p-4 cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group relative"
          title="Нажмите для перехода к отзывам участников"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Оценка гостей (NPS)
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-1">
            {metrics.averageRating > 0 ? `${metrics.averageRating} / 5.0` : '—'}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center justify-between">
            <span>{metrics.surveysCount} {pluralizeRu(metrics.surveysCount, ['ответ', 'ответа', 'ответов'])}</span>
            <span className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 text-[11px] font-medium flex items-center gap-0.5">
              Отзывы →
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2 cols): Urgent and Overdue Tasks */}
        <div className="card-surface p-4 flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Требуют внимания (Дедлайны и задачи)
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium flex items-center gap-1 cursor-pointer"
            >
              Все задачи ({activeTasks.length})
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 flex-1">
            {urgentTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
                Нет нерешенных задач
              </div>
            ) : (
              urgentTasks.map(task => {
                const isOverdue = isTaskOverdue(task, completedStageIds);
                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTab('tasks')}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 px-1.5 rounded transition-colors cursor-pointer group"
                    title="Нажмите для перехода к задаче в плане"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          updateTask({ ...task, status: 'done' });
                          notify(`Задача «${task.title}» отмечена как выполненная`, 'success');
                        }}
                        className="w-4 h-4 rounded border border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-300 flex items-center justify-center transition-colors shrink-0 bg-white dark:bg-zinc-800"
                        title="Отметить выполненной"
                      >
                        <Check className="w-3 h-3 text-transparent hover:text-zinc-900 dark:hover:text-zinc-100" />
                      </button>
                      <div className="truncate">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline truncate block">
                          {task.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {isOverdue ? (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-medium">
                          {formatDate(task.deadline)}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                          {formatDate(task.deadline)}
                        </span>
                      )}

                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        task.priority === 'critical'
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60'
                          : task.priority === 'high'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {task.priority === 'critical' ? 'крит.' : task.priority === 'high' ? 'высок.' : 'средн.'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (1 col): Budget Execution by Categories */}
        <div className="card-surface p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Исполнение сметы по статьям
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('budget')}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium flex items-center gap-1 cursor-pointer"
            >
              Смета
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 pt-3 flex-1">
            {categoryList.slice(0, 5).map(([category, amounts]) => {
              const pct = amounts.planned > 0 ? Math.round((amounts.actual / amounts.planned) * 100) : 100;
              const isOver = amounts.actual > amounts.planned && amounts.planned > 0;
              return (
                <div
                  key={category}
                  onClick={() => setActiveTab('budget')}
                  className="space-y-1 p-1 -m-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  title="Нажмите для перехода в смету"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate max-w-[150px]">
                      {category}
                    </span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {formatCurrency(amounts.actual)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOver ? 'bg-red-600 dark:bg-red-500' : 'bg-zinc-900 dark:bg-zinc-100'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                    <span>План: {formatCurrency(amounts.planned)}</span>
                    <span className={isOver ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
