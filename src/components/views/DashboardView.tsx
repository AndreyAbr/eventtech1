import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Plus,
  FileSpreadsheet,
  QrCode,
  Sparkles
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatCurrency, formatDate, isTaskOverdue } from '../../utils/analytics';
import { exportBudgetToCSV } from '../../utils/csvExport';

export const DashboardView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeBudget,
    metrics,
    setActiveTab,
    updateTask
  } = useEventContext();

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        Мероприятие не выбрано. Выберите или создайте проект в меню слева.
      </div>
    );
  }

  // Urgent & overdue tasks
  const urgentTasks = activeTasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      const aOverdue = isTaskOverdue(a.deadline, a.status);
      const bOverdue = isTaskOverdue(b.deadline, b.status);
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
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Сводка проекта
          </h1>
          <p className="text-xs text-zinc-500">
            Ключевые метрики готовности, дедлайны и финансовый баланс
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="btn-secondary"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
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
        <div className="bg-red-50/80 border border-red-200 rounded-md px-3.5 py-2 text-xs text-red-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              {metrics.isOverTotalLimit && (
                <span>
                  Перерасход сметы: <strong className="font-mono">{formatCurrency(metrics.budgetOverrunAmount)}</strong>.
                </span>
              )}
              {metrics.isOverTotalLimit && metrics.criticalOverdueTasksCount > 0 && ' '}
              {metrics.criticalOverdueTasksCount > 0 && (
                <span>
                  Обнаружено <strong className="font-mono">{metrics.criticalOverdueTasksCount}</strong> критических просроченных задач.
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {metrics.isOverTotalLimit && (
              <button
                onClick={() => setActiveTab('budget')}
                className="text-xs font-medium text-red-700 hover:text-red-900 underline"
              >
                Ревизия сметы
              </button>
            )}
            {metrics.criticalOverdueTasksCount > 0 && (
              <button
                onClick={() => setActiveTab('tasks')}
                className="text-xs font-medium text-red-700 hover:text-red-900 underline"
              >
                К задачам →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Horizontal KPI Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 shadow-sm">
        {/* Metric 1 */}
        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">
            Готовность ивента
          </div>
          <div className="text-2xl font-semibold text-zinc-900 font-mono tabular-nums mt-1">
            {metrics.readinessPercent}%
          </div>
          <div className="text-xs text-zinc-500 mt-1.5 flex items-center justify-between">
            <span>{metrics.completedTasksCount} из {metrics.totalTasksCount} задач</span>
            {metrics.overdueTasksCount > 0 ? (
              <span className="text-red-600 font-medium font-mono text-[11px]">
                {metrics.overdueTasksCount} просрочено
              </span>
            ) : (
              <span className="text-emerald-600 font-medium text-[11px]">В графике</span>
            )}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">
            Участники & Чек-ин
          </div>
          <div className="text-2xl font-semibold text-zinc-900 font-mono tabular-nums mt-1">
            {metrics.registeredCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5 flex items-center justify-between">
            <span>План: {activeEvent.plannedHeadcount} чел.</span>
            <span className="font-mono text-[11px] text-zinc-700 font-medium">
              Чек-ин: {metrics.checkedInCount} ({metrics.attendanceRate}%)
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">
            Фактические расходы
          </div>
          <div className={`text-2xl font-semibold font-mono tabular-nums mt-1 ${
            metrics.isOverTotalLimit ? 'text-red-600' : 'text-zinc-900'
          }`}>
            {formatCurrency(metrics.totalActualBudget)}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5 flex items-center justify-between">
            <span>Лимит: {formatCurrency(activeEvent.totalBudgetLimit)}</span>
            <span className="font-mono text-[11px] text-zinc-700">
              {formatCurrency(metrics.costPerAttendee)}/гость
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">
            Оценка гостей (NPS)
          </div>
          <div className="text-2xl font-semibold text-zinc-900 font-mono tabular-nums mt-1">
            {metrics.averageRating > 0 ? `${metrics.averageRating} / 5.0` : '—'}
          </div>
          <div className="text-xs text-zinc-500 mt-1.5 flex items-center justify-between">
            <span>{metrics.surveysCount} ответов</span>
            <button
              onClick={() => setActiveTab('guests')}
              className="text-zinc-600 hover:text-zinc-900 text-[11px] font-medium"
            >
              Отзывы →
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2 cols): Urgent and Overdue Tasks */}
        <div className="lg:col-span-2 card-surface p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Требуют внимания (Дедлайны и задачи)
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1"
            >
              Все задачи ({activeTasks.length})
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-zinc-200 flex-1">
            {urgentTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Нет нерешенных задач
              </div>
            ) : (
              urgentTasks.map(task => {
                const isOverdue = isTaskOverdue(task.deadline, task.status);
                return (
                  <div
                    key={task.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50/60 px-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => updateTask({ ...task, status: 'done' })}
                        className="w-4 h-4 rounded border border-zinc-300 hover:border-zinc-900 flex items-center justify-center transition-colors shrink-0"
                        title="Отметить выполненной"
                      >
                        <Check className="w-3 h-3 text-transparent hover:text-zinc-900" />
                      </button>
                      <div className="truncate">
                        <span className="font-medium text-zinc-900 truncate block">
                          {task.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {isOverdue ? (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                          {formatDate(task.deadline)}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-500">
                          {formatDate(task.deadline)}
                        </span>
                      )}

                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        task.priority === 'critical'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : task.priority === 'high'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-zinc-100 text-zinc-600'
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
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                Исполнение сметы по статьям
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('budget')}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1"
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
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 font-medium truncate max-w-[150px]">
                      {category}
                    </span>
                    <span className="font-mono text-zinc-900 tabular-nums">
                      {formatCurrency(amounts.actual)}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOver ? 'bg-red-600' : 'bg-zinc-900'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                    <span>План: {formatCurrency(amounts.planned)}</span>
                    <span className={isOver ? 'text-red-600 font-medium' : ''}>
                      {isOver ? `+${formatCurrency(amounts.actual - amounts.planned)}` : `${pct}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-200 mt-2 flex justify-between items-center text-xs">
            <span className="text-zinc-500">Всего затрачено:</span>
            <span className="font-mono font-semibold text-zinc-900">
              {formatCurrency(metrics.totalActualBudget)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access Bar */}
      <div className="card-surface p-3.5 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-medium text-zinc-500">Быстрые действия:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('guests')}
            className="btn-secondary"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-500" />
            Регистрация гостя
          </button>
          <button
            onClick={() => setActiveTab('ai_assistant')}
            className="btn-secondary"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            Аудит рисков
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className="btn-secondary"
          >
            Управление сметой
          </button>
        </div>
      </div>
    </div>
  );
};
