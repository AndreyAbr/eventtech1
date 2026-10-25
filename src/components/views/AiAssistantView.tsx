import React, { useState } from 'react';
import {
  CheckSquare,
  Wallet,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  ListTodo,
  Check,
  Info,
  Plus,
  SlidersHorizontal,
  Video,
  Sun,
  ShieldCheck,
  Store,
  Plane,
  Trophy,
  X,
  ExternalLink
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import {
  generateEventBlueprint,
  EVENT_MODULES,
  CustomRequirement,
  GeneratedTask,
  GeneratedBudgetDistribution
} from '../../utils/aiGenerator';
import { formatCurrency, formatDate, isTaskOverdue, pluralizeRu } from '../../utils/analytics';
import { ExpenseCategory, TaskItem } from '../../types/event';

const AVAILABLE_CATEGORIES: ExpenseCategory[] = [
  'Оборудование',
  'Аренда площадки',
  'Кейтеринг',
  'Полиграфия и мерч',
  'Маркетинг и реклама',
  'Работа подрядчиков',
  'Транспорт и проживание',
  'Прочее'
];

export const AiAssistantView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeBudget,
    activeGuests,
    activeTeam,
    activeContractors,
    activeKanbanStages,
    applyAiTasks,
    applyAiBudget,
    setActiveTab
  } = useEventContext();

  const [activeModule, setActiveModule] = useState<'checklist' | 'budget' | 'risks' | 'schedule'>('checklist');

  // Modular configurator state
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(['online_stream', 'security_vip']);
  const [customRequirements, setCustomRequirements] = useState<CustomRequirement[]>([]);
  const [newReqTitle, setNewReqTitle] = useState('');
  const [newReqCategory, setNewReqCategory] = useState<ExpenseCategory>('Оборудование');

  // Checkbox selection states (tracking deselected keys so new additions are checked by default)
  const [deselectedTaskKeys, setDeselectedTaskKeys] = useState<Set<string>>(new Set());
  const [deselectedBudgetKeys, setDeselectedBudgetKeys] = useState<Set<string>>(new Set());

  if (!activeEvent) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500">
        Мероприятие не выбрано. Выберите или создайте проект в меню слева.
      </div>
    );
  }

  // Generate blueprint based on current event state, active modules, and custom requirements
  const blueprint = generateEventBlueprint(
    activeEvent,
    activeTasks,
    activeBudget,
    activeGuests.filter(g => g.status !== 'cancelled').length,
    selectedModuleIds,
    customRequirements
  );

  // Toggle module in configurator
  const toggleModule = (moduleId: string) => {
    setSelectedModuleIds(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  // Add custom requirement
  const handleAddCustomRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newReqTitle.trim();
    if (!trimmed) return;
    const newReq: CustomRequirement = {
      id: 'custom-' + Date.now().toString(36),
      title: trimmed,
      category: newReqCategory
    };
    setCustomRequirements(prev => [...prev, newReq]);
    setNewReqTitle('');
  };

  const handleRemoveCustomRequirement = (id: string) => {
    setCustomRequirements(prev => prev.filter(r => r.id !== id));
  };

  // --- Task selection helpers ---
  const getTaskKey = (task: GeneratedTask, idx: number) => task.id || `${task.title}-${idx}`;

  const isTaskSelected = (task: GeneratedTask, idx: number) => {
    return !deselectedTaskKeys.has(getTaskKey(task, idx));
  };

  const toggleTaskSelection = (task: GeneratedTask, idx: number) => {
    const key = getTaskKey(task, idx);
    setDeselectedTaskKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectedTasksCount = blueprint.recommendedTasks.filter((t, i) => isTaskSelected(t, i)).length;

  const toggleSelectAllTasks = () => {
    if (selectedTasksCount === blueprint.recommendedTasks.length) {
      setDeselectedTaskKeys(new Set(blueprint.recommendedTasks.map((t, i) => getTaskKey(t, i))));
    } else {
      setDeselectedTaskKeys(new Set());
    }
  };

  const handleApplySelectedTasks = () => {
    const tasksToApply = blueprint.recommendedTasks
      .filter((t, i) => isTaskSelected(t, i))
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

  // --- Budget selection helpers ---
  const getBudgetKey = (item: GeneratedBudgetDistribution, idx: number) =>
    item.id || `${item.category}-${item.title}-${idx}`;

  const isBudgetItemSelected = (item: GeneratedBudgetDistribution, idx: number) => {
    return !deselectedBudgetKeys.has(getBudgetKey(item, idx));
  };

  const toggleBudgetItemSelection = (item: GeneratedBudgetDistribution, idx: number) => {
    const key = getBudgetKey(item, idx);
    setDeselectedBudgetKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectedBudgetCount = blueprint.recommendedBudget.filter((b, i) => isBudgetItemSelected(b, i)).length;

  const toggleSelectAllBudget = () => {
    if (selectedBudgetCount === blueprint.recommendedBudget.length) {
      setDeselectedBudgetKeys(new Set(blueprint.recommendedBudget.map((b, i) => getBudgetKey(b, i))));
    } else {
      setDeselectedBudgetKeys(new Set());
    }
  };

  const handleApplySelectedBudget = () => {
    const budgetToApply = blueprint.recommendedBudget
      .filter((b, i) => isBudgetItemSelected(b, i))
      .map(b => ({
        title: b.title,
        category: b.category,
        amount: b.amount,
        rationale: b.rationale
      }));

    if (budgetToApply.length === 0) return;
    applyAiBudget(budgetToApply);
    setActiveTab('budget');
  };

  // --- 6 Algorithmic Audit Checks (Live DB Data) ---
  const isTaskCompleted = (t: TaskItem) =>
    t.status === 'done' ||
    t.status.endsWith('-done') ||
    activeKanbanStages.some(s => s.id === t.status && s.isCompletedStage);

  const overdueTasks = activeTasks.filter(t => !isTaskCompleted(t) && isTaskOverdue(t));
  const criticalOverdueTasks = overdueTasks.filter(t => t.priority === 'critical');

  const totalActual = activeBudget.reduce((sum, b) => sum + (Number(b.actualAmount) || 0), 0);
  const budgetLimit = Number(activeEvent.totalBudgetLimit) || 0;
  const isBudgetLimitExceeded = totalActual > budgetLimit;
  const budgetLimitOverrun = totalActual - budgetLimit;

  const overBudgetItems = activeBudget.filter(
    b => (Number(b.actualAmount) || 0) > (Number(b.plannedAmount) || 0)
  );

  const negotiatingContractors = activeContractors.filter(c => c.status === 'negotiation');

  const unassignedTasks = activeTasks.filter(t => {
    if (isTaskCompleted(t)) return false;
    if (!t.assigneeId || t.assigneeId === 'unassigned' || t.assigneeId === 'Не назначен') return true;
    return !activeTeam.some(m => m.id === t.assigneeId);
  });

  const plannedGuests = Math.max(1, Number(activeEvent.plannedHeadcount) || 1);
  const activeRegisteredGuests = activeGuests.filter(g => g.status !== 'cancelled');
  const registrationRate = Math.round((activeRegisteredGuests.length / plannedGuests) * 100);
  const isLowAttendance = activeRegisteredGuests.length < plannedGuests * 0.3;

  interface AuditRisk {
    id: string;
    checkNum: number;
    severity: 'critical' | 'high';
    title: string;
    description: string;
    recommendation: string;
    actionText: string;
    actionTab: 'tasks' | 'budget' | 'team' | 'guests';
  }

  const detectedRisks: AuditRisk[] = [];

  // Check 1: Overdue tasks
  if (overdueTasks.length > 0) {
    detectedRisks.push({
      id: 'audit-risk-overdue',
      checkNum: 1,
      severity: 'critical',
      title: `Обнаружено ${overdueTasks.length} ${pluralizeRu(overdueTasks.length, [
        'просроченная задача',
        'просроченные задачи',
        'просроченных задач'
      ])}${
        criticalOverdueTasks.length > 0
          ? ` (${criticalOverdueTasks.length} ${pluralizeRu(criticalOverdueTasks.length, [
              'критическая',
              'критические',
              'критических'
            ])})`
          : ''
      }`,
      description: `Задачи с прошедшим дедлайном: «${overdueTasks.slice(0, 3).map(t => t.title).join('», «')}${
        overdueTasks.length > 3 ? `» и еще ${overdueTasks.length - 3}` : '»'
      }. Не переведены в статус завершения.`,
      recommendation:
        'Срочно актуализируйте дедлайны или распределите задачи между свободными сотрудниками для предотвращения срыва подготовки.',
      actionText: 'Перейти к задачам →',
      actionTab: 'tasks'
    });
  }

  // Check 2: Budget limit overrun
  if (isBudgetLimitExceeded) {
    detectedRisks.push({
      id: 'audit-risk-budget-limit',
      checkNum: 2,
      severity: 'critical',
      title: 'Превышен общий лимит бюджета мероприятия',
      description: `Фактические расходы (${formatCurrency(totalActual)}) превышают установленный лимит (${formatCurrency(
        budgetLimit
      )}) на ${formatCurrency(budgetLimitOverrun)}.`,
      recommendation:
        'Проведите ревизию второстепенных статей (мерч, полиграфия, реклама) или запросите согласование дополнительного транша у заказчика.',
      actionText: 'Открыть смету →',
      actionTab: 'budget'
    });
  }

  // Check 3: Over-budget items
  if (overBudgetItems.length > 0) {
    detectedRisks.push({
      id: 'audit-risk-budget-items',
      checkNum: 3,
      severity: 'high',
      title: `Обнаружен перерасход по ${overBudgetItems.length} ${pluralizeRu(overBudgetItems.length, [
        'статье',
        'статьям',
        'статьям'
      ])} сметы`,
      description: `Статьи с превышением плана: ${overBudgetItems
        .map(
          b =>
            `«${b.title || b.category}» (+${formatCurrency(
              (Number(b.actualAmount) || 0) - (Number(b.plannedAmount) || 0)
            )})`
        )
        .join(', ')}.`,
      recommendation:
        'Даже при соблюдении общего лимита перерасход по отдельным позициям может повлечь дефицит средств на финальных этапах.',
      actionText: 'Проверить статьи →',
      actionTab: 'budget'
    });
  }

  // Check 4: Negotiating contractors
  if (negotiatingContractors.length > 0) {
    detectedRisks.push({
      id: 'audit-risk-contractors',
      checkNum: 4,
      severity: 'high',
      title: `В статусе согласования ${negotiatingContractors.length} ${pluralizeRu(negotiatingContractors.length, [
        'подрядчик',
        'подрядчика',
        'подрядчиков'
      ])}`,
      description: `Подрядчики без зафиксированного договора: ${negotiatingContractors
        .map(c => `«${c.companyName}» (${c.serviceType}, ${formatCurrency(c.cost)})`)
        .join(', ')}.`,
      recommendation:
        'Ускорьте подписание договоров и утверждение спецификаций для бронирования слотов техники и персонала.',
      actionText: 'К подрядчикам →',
      actionTab: 'team'
    });
  }

  // Check 5: Unassigned tasks
  if (unassignedTasks.length > 0) {
    detectedRisks.push({
      id: 'audit-risk-unassigned',
      checkNum: 5,
      severity: 'high',
      title: `${unassignedTasks.length} ${pluralizeRu(unassignedTasks.length, [
        'задача',
        'задачи',
        'задач'
      ])} без назначенного ответственного`,
      description: `Задачи без ответственного исполнителя: «${unassignedTasks
        .slice(0, 3)
        .map(t => t.title)
        .join('», «')}${unassignedTasks.length > 3 ? `» и еще ${unassignedTasks.length - 3}` : '»'}.`,
      recommendation:
        'Назначьте ответственных сотрудников из команды для персонального контроля дедлайнов и отчетности.',
      actionText: 'Назначить ответственных →',
      actionTab: 'tasks'
    });
  }

  // Check 6: Low guest registration
  if (isLowAttendance) {
    detectedRisks.push({
      id: 'audit-risk-guests',
      checkNum: 6,
      severity: 'high',
      title: 'Низкая заполняемость регистраций участников',
      description: `Зарегистрировано только ${activeRegisteredGuests.length} из запланированных ${plannedGuests} участников (${registrationRate}% от плановой квоты). Порог предупреждения: 30%.`,
      recommendation:
        'Запустите email/telegram-рассылку по контактной базе, активируйте партнерские каналы и рекламные кампании.',
      actionText: 'Запустить рассылку гостям →',
      actionTab: 'guests'
    });
  }

  const criticalRisksCount = detectedRisks.filter(r => r.severity === 'critical').length;

  const allSystemChecks = [
    {
      num: 1,
      name: 'Дедлайны задач',
      passed: overdueTasks.length === 0,
      detail: overdueTasks.length === 0 ? 'Просроченных задач нет' : `${overdueTasks.length} просрочено`
    },
    {
      num: 2,
      name: 'Общий лимит бюджета',
      passed: !isBudgetLimitExceeded,
      detail: !isBudgetLimitExceeded ? 'Лимит соблюден' : `Перерасход ${formatCurrency(budgetLimitOverrun)}`
    },
    {
      num: 3,
      name: 'Баланс статей сметы',
      passed: overBudgetItems.length === 0,
      detail: overBudgetItems.length === 0 ? 'Все статьи в рамках плана' : `${overBudgetItems.length} превышений`
    },
    {
      num: 4,
      name: 'Договоры с подрядчиками',
      passed: negotiatingContractors.length === 0,
      detail: negotiatingContractors.length === 0 ? 'Все подрядчики законтрактованы' : `${negotiatingContractors.length} на согласовании`
    },
    {
      num: 5,
      name: 'Назначение ответственных',
      passed: unassignedTasks.length === 0,
      detail: unassignedTasks.length === 0 ? 'Все задачи распределены' : `${unassignedTasks.length} без исполнителя`
    },
    {
      num: 6,
      name: 'Квота регистраций',
      passed: !isLowAttendance,
      detail: !isLowAttendance ? `${registrationRate}% от квоты (норма)` : `${registrationRate}% (ниже 30%)`
    }
  ];

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'online_stream':
        return <Video className="w-4 h-4" />;
      case 'open_air':
        return <Sun className="w-4 h-4" />;
      case 'security_vip':
        return <ShieldCheck className="w-4 h-4" />;
      case 'expo_stands':
        return <Store className="w-4 h-4" />;
      case 'speakers_travel':
        return <Plane className="w-4 h-4" />;
      case 'awards_prizes':
        return <Trophy className="w-4 h-4" />;
      default:
        return <SlidersHorizontal className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* 1. Header (Clean & Minimalist B2B) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Помощник организатора и аудит проекта
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Модульный расчет плана задач, сметы по нормативам, тайминга и аудит рисков подготовки (100% офлайн)
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
              <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">Алгоритмический расчет</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Локально 0 мс
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Modular Event Configurator (Above the 4 tabs) */}
      <div className="card-surface p-4 border border-zinc-200 dark:border-zinc-800 space-y-3.5 bg-white dark:bg-[#121215]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Параметры и модули мероприятия
            </h2>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              — динамическая адаптация чек-листа, сметы и тайминга
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Подключено: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedModuleIds.length}</span> из {EVENT_MODULES.length}
            </span>
          </div>
        </div>

        {/* 6 Interactive Toggle Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {EVENT_MODULES.map(mod => {
            const isEnabled = selectedModuleIds.includes(mod.id);
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => toggleModule(mod.id)}
                className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between relative group ${
                  isEnabled
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-xs'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-md ${
                        isEnabled
                          ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {getModuleIcon(mod.id)}
                    </span>
                    <span className="text-xs font-semibold leading-tight">{mod.name}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isEnabled
                        ? 'border-transparent bg-emerald-500 text-white'
                        : 'border-zinc-300 dark:border-zinc-700 bg-transparent'
                    }`}
                  >
                    {isEnabled && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <p
                  className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${
                    isEnabled ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {mod.shortDesc}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono border-t pt-1.5 border-zinc-200/20 dark:border-zinc-700/40">
                  <span className={isEnabled ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}>
                    {mod.badge}
                  </span>
                  <span
                    className={
                      isEnabled
                        ? 'text-zinc-200 dark:text-zinc-800 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-300 font-medium'
                    }
                  >
                    +{mod.budget.percentage}% сметы
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Add Custom Requirement Row */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-zinc-500" />
            <span>Добавить своё условие в расчёт (задача + статья сметы):</span>
          </div>

          <form
            onSubmit={handleAddCustomRequirement}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              type="text"
              value={newReqTitle}
              onChange={e => setNewReqTitle(e.target.value)}
              placeholder="Например: Аренда мобильной кофейни и бариста"
              className="input-field text-xs flex-1 h-8"
            />
            <select
              value={newReqCategory}
              onChange={e => setNewReqCategory(e.target.value as ExpenseCategory)}
              className="input-field text-xs sm:w-56 h-8 cursor-pointer"
            >
              {AVAILABLE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newReqTitle.trim()}
              className="btn-secondary h-8 shrink-0 text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить в шаблон</span>
            </button>
          </form>

          {customRequirements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {customRequirements.map(req => (
                <span
                  key={req.id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                >
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">[{req.category}]</span>
                  <span>{req.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomRequirement(req.id)}
                    className="hover:text-red-500 transition-colors cursor-pointer ml-0.5"
                    title="Удалить условие"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Module Selector Navigation Tabs */}
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
                {blueprint.recommendedTasks.length} {pluralizeRu(blueprint.recommendedTasks.length, ['задача', 'задачи', 'задач'])}
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
                {blueprint.recommendedBudget.length} {pluralizeRu(blueprint.recommendedBudget.length, ['статья', 'статьи', 'статей'])}
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
                {detectedRisks.length > 0 ? (
                  <>
                    {detectedRisks.length} {pluralizeRu(detectedRisks.length, ['проверка', 'проверки', 'проверок'])}
                    {criticalRisksCount > 0 && (
                      <span className={`ml-1 font-semibold ${activeModule === 'risks' ? 'text-red-300 dark:text-red-700' : 'text-red-600 dark:text-red-400'}`}>
                        ({criticalRisksCount} крит.)
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Все 6 в норме</span>
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
                {blueprint.eventSchedule.length} {pluralizeRu(blueprint.eventSchedule.length, ['слот', 'слота', 'слотов'])} дня
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
                Сформировано с учетом даты старта (<span className="font-mono">{formatDate(activeEvent.startDate)}</span>), масштаба и {selectedModuleIds.length} активных модулей
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleSelectAllTasks}
                className="btn-secondary h-8 text-xs cursor-pointer"
              >
                {selectedTasksCount === blueprint.recommendedTasks.length
                  ? 'Снять выбор'
                  : 'Выбрать все'}
              </button>

              <button
                onClick={handleApplySelectedTasks}
                disabled={selectedTasksCount === 0}
                className="btn-primary h-8 text-xs cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить выбранные в план ({selectedTasksCount})</span>
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
                      checked={selectedTasksCount === blueprint.recommendedTasks.length && blueprint.recommendedTasks.length > 0}
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
                  const isSelected = isTaskSelected(task, idx);
                  return (
                    <tr
                      key={getTaskKey(task, idx)}
                      onClick={() => toggleTaskSelection(task, idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-zinc-50 dark:bg-zinc-800/40' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Выбрать задачу ${task.title}`}
                          checked={isSelected}
                          onChange={() => toggleTaskSelection(task, idx)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                            {task.title}
                          </div>
                          {task.moduleName && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                              {task.moduleName}
                            </span>
                          )}
                          {task.source === 'custom' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                              Пользовательское
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                          {task.description}
                        </div>
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
                              : task.priority === 'high'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/60'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'critical'
                                ? 'bg-red-500'
                                : task.priority === 'high'
                                ? 'bg-amber-500'
                                : 'bg-zinc-400'
                            }`}
                          />
                          {task.priority === 'critical'
                            ? 'Критично'
                            : task.priority === 'high'
                            ? 'Высокий'
                            : 'Средний'}
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
                Отраслевые нормативы с динамическим пересчетом под {selectedModuleIds.length} активных модулей
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleSelectAllBudget}
                className="btn-secondary h-8 text-xs cursor-pointer"
              >
                {selectedBudgetCount === blueprint.recommendedBudget.length
                  ? 'Снять выбор'
                  : 'Выбрать все'}
              </button>

              <button
                onClick={handleApplySelectedBudget}
                disabled={selectedBudgetCount === 0}
                className="btn-primary h-8 text-xs cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Добавить выбранные статьи в смету ({selectedBudgetCount})</span>
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
                      aria-label="Выбрать все статьи сметы"
                      checked={selectedBudgetCount === blueprint.recommendedBudget.length && blueprint.recommendedBudget.length > 0}
                      onChange={toggleSelectAllBudget}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3.5">Статья затрат</th>
                  <th className="py-2.5 px-3.5 text-right w-24">Доля (%)</th>
                  <th className="py-2.5 px-3.5 text-right w-36">Расчетная сумма (₽)</th>
                  <th className="py-2.5 px-3.5 w-40">Распределение</th>
                  <th className="py-2.5 px-3.5">Обоснование норматива</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {blueprint.recommendedBudget.map((item, idx) => {
                  const isSelected = isBudgetItemSelected(item, idx);
                  return (
                    <tr
                      key={getBudgetKey(item, idx)}
                      onClick={() => toggleBudgetItemSelection(item, idx)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-zinc-50 dark:bg-zinc-800/40' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Выбрать статью ${item.title}`}
                          checked={isSelected}
                          onChange={() => toggleBudgetItemSelection(item, idx)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.title}</span>
                          {item.moduleName && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                              {item.moduleName}
                            </span>
                          )}
                          {item.source === 'custom' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                              Пользовательское
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Категория: {item.category}
                        </div>
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
                              className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, item.percentage * 2.5)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {item.rationale}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 3: 6 ALGORITHMIC RISK AUDITS */}
      {activeModule === 'risks' && (
        <div className="card-surface overflow-hidden space-y-4 p-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                Системный аудит рисков подготовки проекта (6 проверок)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Автоматическая проверка по реальным данным активного мероприятия из базы данных
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                Замечаний:{' '}
                <span className={detectedRisks.length > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                  {detectedRisks.length}
                </span>{' '}
                из 6
              </span>
              {criticalRisksCount > 0 && (
                <span className="font-mono text-red-600 dark:text-red-400 font-semibold">
                  ({criticalRisksCount} крит.)
                </span>
              )}
            </div>
          </div>

          {/* If all 6 checks passed */}
          {detectedRisks.length === 0 && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  Все 6 системных проверок пройдены успешно
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  Просроченных задач нет, бюджет в рамках лимита, статьи сбалансированы, подрядчики законтрактованы, исполнители назначены, а заполняемость регистраций в зеленой зоне.
                </p>
              </div>
            </div>
          )}

          {/* Detected risks list */}
          {detectedRisks.length > 0 && (
            <div className="space-y-3">
              {detectedRisks.map(risk => (
                <div
                  key={risk.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    risk.severity === 'critical'
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${
                            risk.severity === 'critical'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        />
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {risk.title}
                        </h3>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium ${
                            risk.severity === 'critical'
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {risk.severity === 'critical' ? 'Критично' : 'Предупреждение'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed pl-6">
                        {risk.description}
                      </p>

                      <div className="ml-6 mt-2 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded p-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-0.5">
                          Рекомендация организатору:
                        </span>
                        <span>{risk.recommendation}</span>
                      </div>
                    </div>

                    <div className="sm:self-center shrink-0 pl-6 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab(risk.actionTab)}
                        className={`btn-secondary h-8 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer ${
                          risk.severity === 'critical'
                            ? 'hover:border-red-300 hover:text-red-700 dark:hover:text-red-400'
                            : 'hover:border-amber-300 hover:text-amber-700 dark:hover:text-amber-400'
                        }`}
                      >
                        <span>{risk.actionText}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Audit Checklist Summary (All 6 Checks) */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            <h4 className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
              Статус всех 6 системных проверок:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allSystemChecks.map(chk => (
                <div
                  key={chk.num}
                  className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        chk.passed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {chk.passed ? '✓' : '!'}
                    </span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{chk.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    {chk.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 4: EVENT TIMING / SCHEDULE */}
      {activeModule === 'schedule' && (
        <div className="card-surface overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                Тайминг программы («{activeEvent.title}»)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Хронологическая поминутная программа дня с интеграцией активных модулей
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Слотов дня: {blueprint.eventSchedule.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5 w-36">Время</th>
                  <th className="py-2.5 px-3.5">Блок программы</th>
                  <th className="py-2.5 px-3.5 w-52">Сцена / Локация</th>
                  <th className="py-2.5 px-3.5">Описание регламента</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {blueprint.eventSchedule.map((slot, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3.5 whitespace-nowrap font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-xs">
                        {slot.time}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{slot.title}</span>
                        {slot.moduleName && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                            {slot.moduleName}
                          </span>
                        )}
                      </div>
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
