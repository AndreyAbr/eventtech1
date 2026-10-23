import React from 'react';
import {
  CheckCircle2,
  Clock,
  Users,
  Wallet,
  Star,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  Sparkles,
  QrCode,
  Calendar
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { formatCurrency, formatDate, isTaskOverdue } from '../../utils/analytics';
import { exportBudgetToCSV, exportGuestsToCSV } from '../../utils/csvExport';

export const DashboardView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeBudget,
    activeGuests,
    activeSurveys,
    metrics,
    setActiveTab,
    updateTask
  } = useEventContext();

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-slate-400">
        Мероприятие не выбрано. Выберите или создайте новое в меню слева.
      </div>
    );
  }

  // Filter urgent & overdue tasks
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
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Critical Alert Banner */}
      {(metrics.isOverTotalLimit || metrics.criticalOverdueTasksCount > 0) && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-200">
                Требуется внимание организатора!
              </h4>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {metrics.isOverTotalLimit && (
                  <span>
                    Зафиксирован перерасход бюджета на{' '}
                    <strong className="text-white font-mono">{formatCurrency(metrics.budgetOverrunAmount)}</strong>.
                  </span>
                )}
                {metrics.isOverTotalLimit && metrics.criticalOverdueTasksCount > 0 && ' • '}
                {metrics.criticalOverdueTasksCount > 0 && (
                  <span>
                    Есть <strong className="text-white font-bold">{metrics.criticalOverdueTasksCount}</strong> критических просроченных задач!
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {metrics.isOverTotalLimit && (
              <button
                onClick={() => setActiveTab('budget')}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 text-xs font-semibold transition"
              >
                Ревизия сметы
              </button>
            )}
            {metrics.criticalOverdueTasksCount > 0 && (
              <button
                onClick={() => setActiveTab('tasks')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition"
              >
                Открыть задачи
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Row: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Readiness */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Готовность ивента</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {metrics.readinessPercent}%
            </span>
            <span className="text-xs text-slate-400">
              ({metrics.completedTasksCount} из {metrics.totalTasksCount} задач)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${metrics.readinessPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Просроченные задачи:</span>
            {metrics.overdueTasksCount > 0 ? (
              <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <Clock className="w-3 h-3" />
                {metrics.overdueTasksCount} шт.
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Нет просрочек</span>
            )}
          </div>
        </div>

        {/* Card 2: Attendees & Conversion */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Участники & Чек-ин</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {metrics.registeredCount}
            </span>
            <span className="text-xs text-slate-400">
              / план {activeEvent.plannedHeadcount} чел.
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((metrics.registeredCount / Math.max(1, activeEvent.plannedHeadcount)) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Чек-ин на входе:</span>
            <span className="font-semibold text-emerald-300 font-mono">
              {metrics.checkedInCount} чел. ({metrics.attendanceRate}%)
            </span>
          </div>
        </div>

        {/* Card 3: Budget & Cost per attendee */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Бюджет (Факт / План)</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mb-2">
            <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {formatCurrency(metrics.totalActualBudget)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              лимит: {formatCurrency(activeEvent.totalBudgetLimit)}
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                metrics.isOverTotalLimit ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.round((metrics.totalActualBudget / Math.max(1, activeEvent.totalBudgetLimit)) * 100))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Ср. стоимость гостя:</span>
            <span className="font-mono text-slate-200 font-semibold">
              {formatCurrency(metrics.costPerAttendee)}
            </span>
          </div>
        </div>

        {/* Card 4: Feedback / NPS */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Оценка гостей (NPS)</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {metrics.averageRating > 0 ? metrics.averageRating : '—'}
            </span>
            <span className="text-xs text-slate-400">/ 5.0 звезд</span>
          </div>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(metrics.averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">Получено отзывов:</span>
            <span className="font-semibold text-purple-300 font-mono">
              {metrics.surveysCount} ответов
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Tasks Overview & Budget Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Urgent & Overdue Tasks */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Срочные и просроченные задачи
              </h3>
              <p className="text-xs text-slate-400">Задачи, требующие первоочередного выполнения</p>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              Все задачи ({activeTasks.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {urgentTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Все задачи завершены! Отличная работа команды.
              </div>
            ) : (
              urgentTasks.map(task => {
                const isOverdue = isTaskOverdue(task.deadline, task.status);
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                      isOverdue
                        ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => updateTask({ ...task, status: 'done' })}
                        title="Отметить как выполненное"
                        className="mt-0.5 w-4 h-4 rounded border border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition shrink-0"
                      >
                        <CheckCircle2 className="w-3 h-3 text-transparent hover:text-emerald-400" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-semibold text-slate-200">
                            {task.title}
                          </h4>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              task.priority === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : task.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {task.priority === 'critical' ? 'Критично' : task.priority === 'high' ? 'Высокий' : 'Средний'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className={isOverdue ? 'text-rose-400 font-bold flex items-center gap-1' : ''}>
                            {isOverdue && <AlertTriangle className="w-3 h-3" />}
                            Дедлайн: {formatDate(task.deadline)}
                          </span>
                          <span>•</span>
                          <span>{task.comments.length} комментариев</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-md shrink-0 ${
                        task.status === 'in_progress'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : task.status === 'review'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.status === 'in_progress' ? 'В работе' : task.status === 'review' ? 'Проверка' : 'К исполнению'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (1 col): Budget Category Breakdown */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                Расходы по категориям
              </h3>
              <p className="text-xs text-slate-400">Фактическое освоение сметы</p>
            </div>
            <button
              onClick={() => setActiveTab('budget')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              Смета
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 flex-1">
            {categoryList.slice(0, 5).map(([category, amounts]) => {
              const pct = amounts.planned > 0 ? Math.round((amounts.actual / amounts.planned) * 100) : 100;
              const isOver = amounts.actual > amounts.planned && amounts.planned > 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[170px]" title={category}>
                      {category}
                    </span>
                    <span className="font-mono text-slate-300">
                      {formatCurrency(amounts.actual)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOver ? 'bg-rose-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>План: {formatCurrency(amounts.planned)}</span>
                    <span className={isOver ? 'text-rose-400 font-bold' : ''}>
                      {isOver ? `Перерасход (+${formatCurrency(amounts.actual - amounts.planned)})` : `${pct}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex justify-between items-center text-xs">
            <span className="text-slate-400">Всего фактически:</span>
            <span className="font-bold text-white font-mono">{formatCurrency(metrics.totalActualBudget)}</span>
          </div>
        </div>
      </div>

      {/* Bottom: Quick Actions Bar */}
      <div className="glass-panel p-5 rounded-2xl">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Быстрые действия организатора
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('guests')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-indigo-500/40 text-xs font-semibold transition group shadow-sm"
          >
            <QrCode className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>Регистрация гостя</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-emerald-500/40 text-xs font-semibold transition group shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Добавить задачу</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_assistant')}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition group shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>ИИ-Аудит рисков</span>
          </button>

          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 hover:border-amber-500/40 text-xs font-semibold transition group shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Экспорт сметы CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
