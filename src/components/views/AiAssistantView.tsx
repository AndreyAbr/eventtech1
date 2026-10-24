import React, { useState } from 'react';
import {
  CheckSquare,
  Wallet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  ListTodo,
  Check,
  Info,
  Plus
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { generateEventBlueprint } from '../../utils/aiGenerator';
import { formatCurrency, formatDate } from '../../utils/analytics';

export const AiAssistantView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeBudget,
    metrics,
    applyAiTasks,
    applyAiBudget,
    setActiveTab
  } = useEventContext();

  const [activeModule, setActiveModule] = useState<'checklist' | 'budget' | 'risks' | 'schedule'>('checklist');

  // Selected tasks checkbox state
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<number[]>([0, 1, 2]);

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        Мероприятие не выбрано. Выберите или создайте проект в меню слева.
      </div>
    );
  }

  // Generate blueprint based on current event state
  const blueprint = generateEventBlueprint(
    activeEvent,
    activeTasks,
    activeBudget,
    metrics.registeredCount
  );

  const toggleTaskSelection = (index: number) => {
    setSelectedTaskIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAllTasks = () => {
    if (selectedTaskIndices.length === blueprint.recommendedTasks.length) {
      setSelectedTaskIndices([]);
    } else {
      setSelectedTaskIndices(blueprint.recommendedTasks.map((_, idx) => idx));
    }
  };

  const handleApplySelectedTasks = () => {
    const tasksToApply = blueprint.recommendedTasks
      .filter((_, idx) => selectedTaskIndices.includes(idx))
      .map(t => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        deadline: t.deadlineDate
      }));

    if (tasksToApply.length === 0) return;
    applyAiTasks(tasksToApply);
    setActiveTab('tasks');
  };

  const handleApplyBudgetDistribution = () => {
    applyAiBudget(
      blueprint.recommendedBudget.map(b => ({
        category: b.category,
        amount: b.amount,
        rationale: b.rationale
      }))
    );
    setActiveTab('budget');
  };

  const criticalRisksCount = blueprint.detectedRisks.filter(r => r.severity === 'critical').length;

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* 1. Header (Clean & Human B2B) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Помощник организатора и проверка проекта
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Быстрое формирование чек-листа задач, расчёт базовой сметы, проверка рисков подготовки и расписания
          </p>
        </div>
      </div>

      {/* 2. Project Summary Card */}
      <div className="card-surface p-4 bg-zinc-50/60 dark:bg-zinc-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-zinc-500 shrink-0" />
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Сводка проекта
              </span>
              <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                формат: {activeEvent.type}
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {blueprint.summary}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right">
              <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">Статус данных</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Готов к применению
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Module Selector Navigation Tabs (Calm, no sparkles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveModule('checklist')}
          className={`p-3 rounded-md border text-left transition-colors flex items-center justify-between cursor-pointer ${
            activeModule === 'checklist'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
              : 'bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ListTodo className={`w-4 h-4 shrink-0 ${activeModule === 'checklist' ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <div>
              <div className="text-xs font-semibold">Шаблон задач</div>
              <div className={`text-[11px] font-mono ${activeModule === 'checklist' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {blueprint.recommendedTasks.length} задач
              </div>
            </div>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${activeModule === 'checklist' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
        </button>

        <button
          onClick={() => setActiveModule('budget')}
          className={`p-3 rounded-md border text-left transition-colors flex items-center justify-between cursor-pointer ${
            activeModule === 'budget'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
              : 'bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Wallet className={`w-4 h-4 shrink-0 ${activeModule === 'budget' ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <div>
              <div className="text-xs font-semibold">Расчёт сметы</div>
              <div className={`text-[11px] font-mono ${activeModule === 'budget' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {blueprint.recommendedBudget.length} категорий
              </div>
            </div>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${activeModule === 'budget' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
        </button>

        <button
          onClick={() => setActiveModule('risks')}
          className={`p-3 rounded-md border text-left transition-colors flex items-center justify-between cursor-pointer ${
            activeModule === 'risks'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
              : 'bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className={`w-4 h-4 shrink-0 ${activeModule === 'risks' ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <div>
              <div className="text-xs font-semibold">Проверка рисков</div>
              <div className={`text-[11px] font-mono ${activeModule === 'risks' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {blueprint.detectedRisks.length} проверок
                {criticalRisksCount > 0 && (
                  <span className={`ml-1 font-semibold ${activeModule === 'risks' ? 'text-red-300 dark:text-red-700' : 'text-red-600 dark:text-red-400'}`}>
                    ({criticalRisksCount} крит.)
                  </span>
                )}
              </div>
            </div>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${activeModule === 'risks' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
        </button>

        <button
          onClick={() => setActiveModule('schedule')}
          className={`p-3 rounded-md border text-left transition-colors flex items-center justify-between cursor-pointer ${
            activeModule === 'schedule'
              ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
              : 'bg-white dark:bg-[#121215] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock className={`w-4 h-4 shrink-0 ${activeModule === 'schedule' ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
            <div>
              <div className="text-xs font-semibold">Тайминг программы</div>
              <div className={`text-[11px] font-mono ${activeModule === 'schedule' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {blueprint.eventSchedule.length} слотов дня
              </div>
            </div>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${activeModule === 'schedule' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
        </button>
      </div>

      {/* MODULE 1: CHECKLIST / TASK TEMPLATE */}
      {activeModule === 'checklist' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/60">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                Рекомендованный чек-лист подготовки («{activeEvent.type}»)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Сформировано с учетом даты старта (<span className="font-mono">{formatDate(activeEvent.startDate)}</span>) и масштаба мероприятия
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleSelectAllTasks}
                className="btn-secondary h-8"
              >
                {selectedTaskIndices.length === blueprint.recommendedTasks.length
                  ? 'Снять выбор'
                  : 'Выбрать все'}
              </button>

              <button
                onClick={handleApplySelectedTasks}
                disabled={selectedTaskIndices.length === 0}
                className="btn-primary h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить в план задач ({selectedTaskIndices.length})</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Выбрать все задачи"
                      checked={selectedTaskIndices.length === blueprint.recommendedTasks.length && blueprint.recommendedTasks.length > 0}
                      onChange={toggleSelectAllTasks}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3.5">Задача и описание</th>
                  <th className="py-2.5 px-3.5">Категория</th>
                  <th className="py-2.5 px-3.5">Приоритет</th>
                  <th className="py-2.5 px-3.5">Рекомендуемый дедлайн</th>
                  <th className="py-2.5 px-3.5 text-right">Смещение</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {blueprint.recommendedTasks.map((task, idx) => {
                  const isSelected = selectedTaskIndices.includes(idx);
                  return (
                    <tr
                      key={idx}
                      onClick={() => toggleTaskSelection(idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-zinc-50 dark:bg-zinc-800/40' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Выбрать задачу ${task.title}`}
                          checked={isSelected}
                          onChange={() => toggleTaskSelection(idx)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{task.title}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{task.description}</div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded">
                          {task.category}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            task.priority === 'critical'
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200/70 dark:border-red-900/60'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                            }`}
                          />
                          {task.priority === 'critical' ? 'Критично' : 'Высокий'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-zinc-600 dark:text-zinc-300">
                        {formatDate(task.deadlineDate)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        За {Math.abs(task.daysBeforeStart)} дн.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 2: BUDGET DISTRIBUTION */}
      {activeModule === 'budget' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/60">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                Расчет сметы по нормативам (лимит: <span className="font-mono">{formatCurrency(activeEvent.totalBudgetLimit)}</span>)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Отраслевые бенчмарки и целевые доли расходов для формата «{activeEvent.type}»
              </p>
            </div>

            <button
              onClick={handleApplyBudgetDistribution}
              className="btn-primary h-8 shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Заполнить смету</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Статья затрат</th>
                  <th className="py-2.5 px-3.5 text-right w-24">Доля (%)</th>
                  <th className="py-2.5 px-3.5 text-right w-36">Расчетная сумма (₽)</th>
                  <th className="py-2.5 px-3.5 w-44">Распределение</th>
                  <th className="py-2.5 px-3.5">Обоснование норматива</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {blueprint.recommendedBudget.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {item.category}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {item.percentage}%
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full"
                            style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {item.rationale}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 3: RISK AUDIT */}
      {activeModule === 'risks' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              Проверка рисков и узких мест проекта
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Анализ метрик готовности, дедлайнов задач и структуры бюджета
            </p>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {blueprint.detectedRisks.map(risk => (
              <div key={risk.id} className="p-4 space-y-2 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 ${
                        risk.severity === 'critical'
                          ? 'text-red-600 dark:text-red-400'
                          : risk.severity === 'high'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    />
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{risk.title}</h3>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                      risk.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200/70 dark:border-red-900/60'
                        : risk.severity === 'high'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/60'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        risk.severity === 'critical'
                          ? 'bg-red-500'
                          : risk.severity === 'high'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    {risk.severity === 'critical'
                      ? 'Критично'
                      : risk.severity === 'high'
                      ? 'Предупреждение'
                      : 'Норма'}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed pl-6">
                  {risk.description}
                </p>

                <div className="ml-6 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded p-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                    Рекомендация:
                  </span>
                  <span>{risk.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 4: EVENT TIMING / SCHEDULE */}
      {activeModule === 'schedule' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              Тайминг программы («{activeEvent.title}»)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Хронологическая поминутная программа и распределение потоков по локациям
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-32">Время</th>
                  <th className="py-2.5 px-3.5">Блок программы</th>
                  <th className="py-2.5 px-3.5 w-44">Сцена / Локация</th>
                  <th className="py-2.5 px-3.5">Описание регламента</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {blueprint.eventSchedule.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
                        {slot.time}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                      {slot.title}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded">
                        {slot.stage}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {slot.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
