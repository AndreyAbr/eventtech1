import React, { useState } from 'react';
import {
  Sparkles,
  CheckSquare,
  Wallet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
  ListTodo
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { generateEventBlueprint, GeneratedTask, GeneratedBudgetDistribution } from '../../utils/aiGenerator';
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
    return <div className="p-8 text-center text-slate-400">Мероприятие не выбрано.</div>;
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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* AI Assistant Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  EventTech AI Координатор
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  Модель: Детерминированный Аналитик
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {blueprint.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400">
              Статус анализа: <strong className="text-emerald-400">Готов</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Module Selector Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveModule('checklist')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeModule === 'checklist'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
              : 'glass-panel text-slate-300 hover:border-slate-700'
          }`}
        >
          <ListTodo className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold">1. План & Чек-лист</div>
            <div className={`text-[10px] ${activeModule === 'checklist' ? 'text-indigo-200' : 'text-slate-500'}`}>
              Рекомендуемые задачи
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModule('budget')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeModule === 'budget'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
              : 'glass-panel text-slate-300 hover:border-slate-700'
          }`}
        >
          <Wallet className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold">2. Смета & Бюджет</div>
            <div className={`text-[10px] ${activeModule === 'budget' ? 'text-indigo-200' : 'text-slate-500'}`}>
              Оптимальные доли
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModule('risks')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeModule === 'risks'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
              : 'glass-panel text-slate-300 hover:border-slate-700'
          }`}
        >
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold">3. Аудит рисков</div>
            <div className={`text-[10px] ${activeModule === 'risks' ? 'text-indigo-200' : 'text-slate-500'}`}>
              {blueprint.detectedRisks.length} предупреждений
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveModule('schedule')}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            activeModule === 'schedule'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
              : 'glass-panel text-slate-300 hover:border-slate-700'
          }`}
        >
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <div className="text-xs font-bold">4. Тайминг дня</div>
            <div className={`text-[10px] ${activeModule === 'schedule' ? 'text-indigo-200' : 'text-slate-500'}`}>
              Почасовая программа
            </div>
          </div>
        </button>
      </div>

      {/* MODULE 1: CHECKLIST GENERATOR */}
      {activeModule === 'checklist' && (
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                Рекомендованный чек-лист подготовки для «{activeEvent.type}»
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Сгенерировано с учетом даты старта ({formatDate(activeEvent.startDate)}) и масштаба мероприятия
              </p>
            </div>

            <button
              onClick={handleApplySelectedTasks}
              disabled={selectedTaskIndices.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Добавить в план ({selectedTaskIndices.length} задач)</span>
            </button>
          </div>

          <div className="space-y-3">
            {blueprint.recommendedTasks.map((task, idx) => {
              const isSelected = selectedTaskIndices.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleTaskSelection(idx)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4 ${
                    isSelected
                      ? 'bg-indigo-950/20 border-indigo-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 w-4 h-4 cursor-pointer"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold text-white">
                        {task.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        {task.category}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'critical'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {task.priority === 'critical' ? 'Критично' : 'Высокий'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-2">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 text-indigo-300">
                        <Calendar className="w-3 h-3" />
                        Рекомендуемый дедлайн: {formatDate(task.deadlineDate)}
                      </span>
                      <span>•</span>
                      <span>За {Math.abs(task.daysBeforeStart)} дн. до старта</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE 2: BUDGET DISTRIBUTION */}
      {activeModule === 'budget' && (
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-400" />
                Оптимальное процентное распределение бюджета ({formatCurrency(activeEvent.totalBudgetLimit)})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Отраслевые бенчмарки распределения средств для формата «{activeEvent.type}»
              </p>
            </div>

            <button
              onClick={handleApplyBudgetDistribution}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Применить распределение к смете</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blueprint.recommendedBudget.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{item.category}</span>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-white font-mono">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="text-xs text-indigo-400 font-bold ml-1.5 font-mono">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {item.rationale}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 3: RISK AUDIT */}
      {activeModule === 'risks' && (
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Аудит уязвимостей и рисков проекта
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Автоматический анализ текущих метрик готовности, дедлайнов и бюджета
            </p>
          </div>

          <div className="space-y-3.5">
            {blueprint.detectedRisks.map(risk => (
              <div
                key={risk.id}
                className={`p-4 rounded-2xl border space-y-2 ${
                  risk.severity === 'critical'
                    ? 'bg-rose-950/25 border-rose-500/40'
                    : risk.severity === 'high'
                    ? 'bg-amber-950/25 border-amber-500/40'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        risk.severity === 'critical'
                          ? 'text-rose-400'
                          : risk.severity === 'high'
                          ? 'text-amber-400'
                          : 'text-indigo-400'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-white">{risk.title}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      risk.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-300'
                        : risk.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {risk.severity === 'critical' ? 'Критично' : risk.severity === 'high' ? 'Высокий риск' : 'В норме'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {risk.description}
                </p>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                    Рекомендация ИИ-Ассистента:
                  </span>
                  <span className="text-slate-200">{risk.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 4: EVENT TIMING / SCHEDULE */}
      {activeModule === 'schedule' && (
        <div className="glass-panel p-6 rounded-3xl space-y-5 animate-fade-in">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Тайминг и поминутная программа дня мероприятия
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Эталонное расписание для «{activeEvent.title}»
            </p>
          </div>

          <div className="space-y-3">
            {blueprint.eventSchedule.map((slot, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-xs shrink-0">
                    {slot.time}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{slot.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{slot.description}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700 shrink-0 self-end sm:self-center">
                  📍 {slot.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
