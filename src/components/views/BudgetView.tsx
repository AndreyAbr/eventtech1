import React, { useState, useMemo } from 'react';
import {
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Edit2,
  Check
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { BudgetItem, ExpenseCategory } from '../../types/event';
import { formatCurrency, pluralizeRu } from '../../utils/analytics';
import { exportBudgetToCSV } from '../../utils/csvExport';

const ALL_CATEGORIES: ExpenseCategory[] = [
  'Аренда площадки',
  'Кейтеринг',
  'Оборудование',
  'Транспорт и проживание',
  'Полиграфия и мерч',
  'Маркетинг и реклама',
  'Работа подрядчиков',
  'Прочее'
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Аренда площадки': '#3B82F6',
  'Кейтеринг': '#F43F5E',
  'Оборудование': '#8B5CF6',
  'Маркетинг и реклама': '#F59E0B',
  'Полиграфия и мерч': '#10B981',
  'Работа подрядчиков': '#64748B',
  'Транспорт и проживание': '#06B6D4',
  'Прочее': '#71717A'
};

export const BudgetView: React.FC = () => {
  const {
    activeEvent,
    activeBudget,
    activeContractors,
    metrics,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    sysConfig,
    sysCatalogs,
    notify
  } = useEventContext();

  const isStrictBudgetControl = sysConfig['strict_budget_control']?.value === 'true';
  const taxRatePercent = Number(sysConfig['tax_rate_percent']?.value || 0);
  const [includeTax, setIncludeTax] = useState(false);

  // Dynamic expense categories and color map from sys_catalogs
  const expenseCategories = useMemo(() => {
    const catalogCats = sysCatalogs
      .filter(c => c.catalogType === 'budget_categories')
      .map(c => c.name);
    return catalogCats.length > 0 ? (catalogCats as ExpenseCategory[]) : ALL_CATEGORIES;
  }, [sysCatalogs]);

  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = { ...CATEGORY_COLORS };
    sysCatalogs.forEach(c => {
      if (c.catalogType === 'budget_categories') {
        map[c.name] = c.color;
      }
    });
    return map;
  }, [sysCatalogs]);

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Inline editing state for Actual Amount: itemId -> draftValue
  const [editingActualId, setEditingActualId] = useState<string | null>(null);
  const [editingActualValue, setEditingActualValue] = useState<string>('');

  // Modal: Add new item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<{
    category: ExpenseCategory;
    title: string;
    plannedAmount: number;
    actualAmount: number;
    contractorId?: string;
    notes: string;
  }>({
    category: (expenseCategories[0] || 'Кейтеринг') as ExpenseCategory,
    title: '',
    plannedAmount: 100000,
    actualAmount: 0,
    contractorId: '',
    notes: ''
  });

  // Modal: Edit existing item
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  if (!activeEvent) {
    return <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">Мероприятие не выбрано.</div>;
  }

  // Calculate totals per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { planned: number; actual: number; count: number }> = {};
    expenseCategories.forEach(cat => {
      stats[cat] = { planned: 0, actual: 0, count: 0 };
    });

    activeBudget.forEach(item => {
      if (!stats[item.category]) {
        stats[item.category] = { planned: 0, actual: 0, count: 0 };
      }
      stats[item.category].planned += Number(item.plannedAmount) || 0;
      stats[item.category].actual += Number(item.actualAmount) || 0;
      stats[item.category].count += 1;
    });

    const totalActualBudget = activeBudget.reduce((s, i) => s + (Number(i.actualAmount) || 0), 0);
    const totalPlannedBudget = activeBudget.reduce((s, i) => s + (Number(i.plannedAmount) || 0), 0);

    return { stats, totalActualBudget, totalPlannedBudget };
  }, [activeBudget, expenseCategories]);

  // Filtered items
  const filteredBudget = useMemo(() => {
    return activeBudget.filter(item => {
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const contractor = activeContractors.find(c => c.id === item.contractorId);
        const matchesContractor = contractor ? contractor.companyName.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesCategory && !matchesContractor) return false;
      }
      return true;
    });
  }, [activeBudget, filterCategory, searchQuery, activeContractors]);

  const remainingFromLimit = activeEvent.totalBudgetLimit - metrics.totalActualBudget;
  const isOverrun = metrics.isOverTotalLimit;
  const overrunDiff = metrics.totalActualBudget - activeEvent.totalBudgetLimit;
  const overrunPercent = Math.round((metrics.totalActualBudget / Math.max(1, activeEvent.totalBudgetLimit)) * 100);

  // Handle inline actual amount commit with strict budget control
  const commitActualEdit = (item: BudgetItem) => {
    const num = Math.max(0, Number(editingActualValue) || 0);

    if (isStrictBudgetControl) {
      const otherActualSum = activeBudget
        .filter(b => b.id !== item.id)
        .reduce((s, i) => s + (Number(i.actualAmount) || 0), 0);
      const newTotal = otherActualSum + num;
      if (newTotal > activeEvent.totalBudgetLimit) {
        notify(
          `Бюджетный контроль (1С): Лимит бюджета мероприятия (${formatCurrency(activeEvent.totalBudgetLimit)}) превышен! Проведение расхода заблокировано политикой ИБ.`,
          'error'
        );
        setEditingActualId(null);
        return;
      }
    }

    updateBudgetItem({
      ...item,
      actualAmount: num
    });
    setEditingActualId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.title.trim()) return;

    const actualNum = Math.max(0, Number(newItemData.actualAmount) || 0);
    if (isStrictBudgetControl && actualNum > 0) {
      const currentActualSum = activeBudget.reduce((s, i) => s + (Number(i.actualAmount) || 0), 0);
      if (currentActualSum + actualNum > activeEvent.totalBudgetLimit) {
        notify(
          `Бюджетный контроль (1С): Лимит бюджета мероприятия (${formatCurrency(activeEvent.totalBudgetLimit)}) превышен! Проведение расхода заблокировано политикой ИБ.`,
          'error'
        );
        return;
      }
    }

    addBudgetItem({
      eventId: activeEvent.id,
      category: newItemData.category,
      title: newItemData.title.trim(),
      plannedAmount: Math.max(0, Number(newItemData.plannedAmount) || 0),
      actualAmount: actualNum,
      contractorId: newItemData.contractorId || undefined,
      notes: newItemData.notes.trim()
    });

    setIsAddModalOpen(false);
    setNewItemData({
      category: (expenseCategories[0] || 'Кейтеринг') as ExpenseCategory,
      title: '',
      plannedAmount: 100000,
      actualAmount: 0,
      contractorId: '',
      notes: ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    if (isStrictBudgetControl && Number(editingItem.actualAmount || 0) > 0) {
      const otherActualSum = activeBudget
        .filter(b => b.id !== editingItem.id)
        .reduce((s, i) => s + (Number(i.actualAmount) || 0), 0);
      if (otherActualSum + Number(editingItem.actualAmount || 0) > activeEvent.totalBudgetLimit) {
        notify(
          `Бюджетный контроль (1С): Лимит бюджета мероприятия (${formatCurrency(activeEvent.totalBudgetLimit)}) превышен! Проведение расхода заблокировано политикой ИБ.`,
          'error'
        );
        return;
      }
    }

    updateBudgetItem(editingItem);
    setEditingItem(null);
  };

  const getContractorName = (contractorId?: string) => {
    if (!contractorId) return '—';
    const c = activeContractors.find(cont => cont.id === contractorId);
    return c ? c.companyName : '—';
  };

  // Stacked Allocation Bar Segments
  const allocationSegments = useMemo(() => {
    const total = categoryStats.totalActualBudget > 0
      ? categoryStats.totalActualBudget
      : Math.max(1, categoryStats.totalPlannedBudget);

    return expenseCategories.map(cat => {
      const data = categoryStats.stats[cat] || { planned: 0, actual: 0, count: 0 };
      const val = categoryStats.totalActualBudget > 0 ? data.actual : data.planned;
      const pct = total > 0 ? (val / total) * 100 : 0;
      return {
        category: cat,
        color: categoryColorMap[cat] || '#71717A',
        actual: data.actual,
        planned: data.planned,
        diff: data.actual - data.planned,
        pct: Number(pct.toFixed(1)),
        count: data.count
      };
    }).filter(s => s.pct > 0);
  }, [categoryStats, expenseCategories, categoryColorMap]);

  // Grouped Bar Chart Data (only categories that have planned > 0 or actual > 0)
  const barChartCategories = useMemo(() => {
    const list = expenseCategories.map(cat => {
      const data = categoryStats.stats[cat] || { planned: 0, actual: 0, count: 0 };
      return {
        category: cat,
        planned: data.planned,
        actual: data.actual,
        diff: data.actual - data.planned,
        color: categoryColorMap[cat] || '#71717A'
      };
    }).filter(c => c.planned > 0 || c.actual > 0);

    const maxVal = Math.max(1, ...list.map(c => Math.max(c.planned, c.actual)));
    return { list, maxVal };
  }, [categoryStats, expenseCategories, categoryColorMap]);

  // Hovered info calculation
  const hoveredCategoryData = hoveredCategory ? categoryStats.stats[hoveredCategory] : null;

  return (
    <div className="space-y-4 animate-fade-in pb-12 w-full">
      {/* 1. Compact Header and Toolbar (Single Unified Line) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Бюджет и смета
          </h1>

          {isStrictBudgetControl && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold" title="Включен строгий контроль лимита бюджета в политике ИБ">
              1С:КОНТРОЛЬ ЛИМИТА
            </span>
          )}

          {isOverrun ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Перерасход +{overrunDiff.toLocaleString('ru-RU')} ₽ ({overrunPercent}% от лимита)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              В рамках лимита ({overrunPercent}%)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Поиск по смете / подрядчику..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-base pl-8 h-8 text-xs w-48 sm:w-56"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-base h-8 text-xs cursor-pointer w-44"
          >
            <option value="all">Все категории ({activeBudget.length})</option>
            {expenseCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat} ({categoryStats.stats[cat]?.count || 0})
              </option>
            ))}
          </select>

          {/* Tax Toggle if configured */}
          {taxRatePercent > 0 && (
            <button
              type="button"
              onClick={() => setIncludeTax(!includeTax)}
              className={`h-8 px-2.5 rounded text-xs border font-mono transition-colors flex items-center gap-1.5 shrink-0 ${
                includeTax
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 font-semibold shadow-sm'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Переключить учет ставки налога"
            >
              <span>Налог {taxRatePercent}%</span>
              {includeTax && <span className="text-[10px] opacity-80">(Вкл)</span>}
            </button>
          )}

          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="btn-secondary h-8 text-xs shrink-0"
            title="Экспортировать смету в CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Экспорт CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary h-8 text-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Статья расхода</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Interactive Analytics Panel (Integrated Directly Above Table) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-t-lg bg-white dark:bg-[#111114] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800">
          {/* ZONE A (Left 55%): Stacked Allocation Bar + Telemetry + Interactive Legend */}
          <div className="lg:col-span-7 p-4 sm:p-5 space-y-3.5 flex flex-col justify-between">
            {/* Top Telemetry Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-zinc-500 dark:text-zinc-400">Лимит:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(activeEvent.totalBudgetLimit)}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-500 dark:text-zinc-400">План:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(metrics.totalPlannedBudget)}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-500 dark:text-zinc-400">Факт:</span>
                <span className={`font-semibold ${isOverrun ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {formatCurrency(metrics.totalActualBudget)}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-zinc-500 dark:text-zinc-400">Баланс:</span>
                <span className={`font-semibold ${remainingFromLimit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {remainingFromLimit >= 0 ? '+' : ''}{formatCurrency(remainingFromLimit)}
                </span>
              </div>
            </div>

            {/* Dynamic Status / Hover detail header */}
            <div className="min-h-[22px] flex items-center justify-between text-xs">
              {hoveredCategory && hoveredCategoryData ? (
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 animate-fade-in font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[hoveredCategory] || '#71717A' }}
                  />
                  <span>
                    <strong>{hoveredCategory}:</strong> Факт {formatCurrency(hoveredCategoryData.actual)} / План {formatCurrency(hoveredCategoryData.planned)}
                  </span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                    ({categoryStats.totalActualBudget > 0 ? Math.round((hoveredCategoryData.actual / categoryStats.totalActualBudget) * 100) : 0}% сметы)
                  </span>
                  {hoveredCategoryData.actual > hoveredCategoryData.planned ? (
                    <span className="text-red-600 dark:text-red-400 font-mono text-[11px] font-semibold">
                      • Перерасход +{formatCurrency(hoveredCategoryData.actual - hoveredCategoryData.planned)}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                      • Экономия {formatCurrency(hoveredCategoryData.planned - hoveredCategoryData.actual)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500 text-xs">
                  {filterCategory !== 'all' ? (
                    <span className="inline-flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                      Активен фильтр: <strong>{filterCategory}</strong> (кликните на категорию для сброса)
                    </span>
                  ) : (
                    'Наведите курсор на сегмент для деталей • Нажмите для фильтрации таблицы'
                  )}
                </span>
              )}

              {filterCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline cursor-pointer"
                >
                  Сбросить фильтр
                </button>
              )}
            </div>

            {/* Interactive Stacked Allocation Bar */}
            <div className="h-4 rounded-sm overflow-hidden flex gap-0.5 p-0.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
              {allocationSegments.map(seg => {
                const isHovered = hoveredCategory === seg.category;
                const isFiltered = filterCategory === seg.category;
                const isDimmed = (hoveredCategory && !isHovered) || (filterCategory !== 'all' && !isFiltered);

                return (
                  <div
                    key={seg.category}
                    onMouseEnter={() => setHoveredCategory(seg.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => setFilterCategory(prev => prev === seg.category ? 'all' : seg.category)}
                    className="h-full rounded-[2px] transition-all duration-200 cursor-pointer relative group"
                    style={{
                      width: `${seg.pct}%`,
                      backgroundColor: seg.color,
                      opacity: isDimmed ? 0.35 : 1,
                      transform: isHovered ? 'scaleY(1.15)' : 'scaleY(1)'
                    }}
                    title={`${seg.category}: ${seg.pct}% (${formatCurrency(seg.actual)})`}
                  />
                );
              })}
            </div>

            {/* Interactive Chips Legend */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allocationSegments.map(seg => {
                const isSelected = filterCategory === seg.category;
                return (
                  <button
                    key={seg.category}
                    type="button"
                    onMouseEnter={() => setHoveredCategory(seg.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => setFilterCategory(prev => prev === seg.category ? 'all' : seg.category)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 font-semibold shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span>{seg.category}</span>
                    <span className={isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-500'}>
                      {seg.pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ZONE B (Right 45%): Interactive SVG Grouped Bar Chart (Plan vs Actual) */}
          <div className="lg:col-span-5 p-4 sm:p-5 space-y-2.5 bg-zinc-50/40 dark:bg-zinc-900/20">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
                План vs Факт по категориям
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-1.5 rounded-xs bg-zinc-300 dark:bg-zinc-700 inline-block" />
                  План
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-1.5 rounded-xs bg-zinc-800 dark:bg-zinc-200 inline-block" />
                  Факт
                </span>
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                  <span className="w-2.5 h-1.5 rounded-xs bg-red-500 inline-block" />
                  Перерасход
                </span>
              </div>
            </div>

            {/* SVG Bars Container */}
            <div className="space-y-2 pt-1">
              {barChartCategories.list.map(item => {
                const isHovered = hoveredCategory === item.category;
                const isSelected = filterCategory === item.category;
                const planPct = Math.round((item.planned / barChartCategories.maxVal) * 100);
                const actualPct = Math.round((item.actual / barChartCategories.maxVal) * 100);
                const isItemOverrun = item.actual > item.planned;

                return (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => setFilterCategory(prev => prev === item.category ? 'all' : item.category)}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-200/70 dark:bg-zinc-800'
                        : isHovered
                        ? 'bg-zinc-100 dark:bg-zinc-800/50'
                        : 'hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 truncate max-w-[200px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.category}</span>
                      </span>
                      <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 shrink-0">
                        {isItemOverrun ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            +{formatCurrency(item.diff)}
                          </span>
                        ) : (
                          <span>{formatCurrency(item.actual)}</span>
                        )}
                      </span>
                    </div>

                    {/* Dual comparative horizontal bars */}
                    <div className="space-y-0.5">
                      {/* Plan Bar */}
                      <div className="h-1.5 w-full bg-zinc-200/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full transition-all duration-300"
                          style={{ width: `${planPct}%` }}
                        />
                      </div>
                      {/* Actual Bar */}
                      <div className="h-1.5 w-full bg-zinc-200/60 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isItemOverrun ? 'bg-red-500' : 'bg-zinc-900 dark:bg-zinc-100'
                          }`}
                          style={{ width: `${actualPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monolithic Unified Financial Sheet (Table Directly Attached Below Panel) */}
      <div className="border-x border-b border-zinc-200 dark:border-zinc-800 rounded-b-lg overflow-hidden bg-white dark:bg-[#111114]">
        {/* Table Toolbar / Sub-strip */}
        <div className="px-4 py-2 bg-zinc-50/70 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span>
              Показано: <strong>{filteredBudget.length}</strong> {pluralizeRu(filteredBudget.length, ['статья', 'статьи', 'статей'])}
            </span>
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono">
                {filterCategory}
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className="hover:text-red-500 cursor-pointer ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono">
            Дважды кликните по сумме «Факт» для быстрого редактирования
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-zinc-50/90 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 w-44">Категория</th>
                <th className="py-2.5 px-3.5">Статья расходов</th>
                <th className="py-2.5 px-3.5 w-44">Контрагент</th>
                <th className="py-2.5 px-3.5 text-right w-36 whitespace-nowrap">План, ₽</th>
                <th className="py-2.5 px-3.5 text-right w-44 whitespace-nowrap">Факт, ₽</th>
                <th className="py-2.5 px-3.5 text-right w-36 whitespace-nowrap">Отклонение</th>
                <th className="py-2.5 px-3.5">Примечание</th>
                <th className="py-2.5 px-3.5 w-20 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredBudget.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-zinc-400">
                    Статьи сметы не найдены.
                  </td>
                </tr>
              ) : (
                filteredBudget.map(item => {
                  const variance = item.actualAmount - item.plannedAmount;
                  const ratio = item.plannedAmount > 0 ? (item.actualAmount / item.plannedAmount) * 100 : 0;
                  const isItemEditing = editingActualId === item.id;
                  const catColor = CATEGORY_COLORS[item.category] || '#71717A';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Category with dot */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setFilterCategory(item.category)}
                          className="inline-flex items-center gap-1.5 hover:underline cursor-pointer text-left"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {item.category}
                          </span>
                        </button>
                      </td>

                      {/* Title */}
                      <td className="py-3 px-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </td>

                      {/* Contractor */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-zinc-600 dark:text-zinc-300 font-mono text-[11px]">
                        {getContractorName(item.contractorId)}
                      </td>

                      {/* Planned Amount */}
                      <td className="py-3 px-3.5 text-right font-mono font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap tabular-nums">
                        {formatCurrency(item.plannedAmount)}
                      </td>

                      {/* Actual Amount (Clean Formatted Number + Progress Line + Inline Editor) */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        {isItemEditing ? (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              autoFocus
                              value={editingActualValue}
                              onChange={e => setEditingActualValue(e.target.value)}
                              onBlur={() => commitActualEdit(item)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') commitActualEdit(item);
                                if (e.key === 'Escape') setEditingActualId(null);
                              }}
                              className="input-base h-7 w-28 text-right font-mono text-xs p-1"
                            />
                            <button
                              type="button"
                              onClick={() => commitActualEdit(item)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingActualId(item.id);
                              setEditingActualValue(item.actualAmount.toString());
                            }}
                            className="inline-block text-right cursor-pointer group"
                            title="Нажмите для редактирования фактической суммы"
                          >
                            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums group-hover:underline">
                              {formatCurrency(item.actualAmount)}
                            </span>
                            {/* Thin progress bar underneath */}
                            <div className="w-28 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1 ml-auto">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  variance > 0
                                    ? 'bg-red-500'
                                    : ratio > 0
                                    ? 'bg-zinc-700 dark:bg-zinc-300'
                                    : 'bg-transparent'
                                }`}
                                style={{ width: `${Math.min(100, ratio)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Variance */}
                      <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap tabular-nums">
                        {variance === 0 ? (
                          <span className="text-zinc-400 dark:text-zinc-500">0 ₽</span>
                        ) : variance > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">
                            +{formatCurrency(variance)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            −{formatCurrency(Math.abs(variance))}
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3.5 text-[11px] text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                        {item.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Редактировать статью"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBudgetItem(item.id)}
                            className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Удалить статью"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-zinc-50/90 dark:bg-zinc-900/80 border-t-2 border-zinc-200 dark:border-zinc-800 font-semibold text-xs text-zinc-900 dark:text-zinc-100">
              <tr>
                <td colSpan={3} className="py-3 px-4 font-mono uppercase tracking-wider">
                  Итого по таблице ({filteredBudget.length} {pluralizeRu(filteredBudget.length, ['статья', 'статьи', 'статей'])}):
                </td>
                <td className="py-3 px-3.5 text-right font-mono tabular-nums">
                  {formatCurrency(filteredBudget.reduce((s, i) => s + i.plannedAmount, 0))}
                </td>
                <td className="py-3 px-3.5 text-right font-mono tabular-nums">
                  {formatCurrency(filteredBudget.reduce((s, i) => s + i.actualAmount, 0))}
                </td>
                <td className="py-3 px-3.5 text-right font-mono tabular-nums">
                  {(() => {
                    const diff = filteredBudget.reduce((s, i) => s + (i.actualAmount - i.plannedAmount), 0);
                    if (diff === 0) return <span className="text-zinc-400">0 ₽</span>;
                    if (diff > 0) return <span className="text-red-600 dark:text-red-400 font-semibold">+{formatCurrency(diff)}</span>;
                    return <span className="text-emerald-600 dark:text-emerald-400">−{formatCurrency(Math.abs(diff))}</span>;
                  })()}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Add New Budget Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Новая статья расходов
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Категория затрат
                </label>
                <select
                  value={newItemData.category}
                  onChange={e => setNewItemData({ ...newItemData, category: e.target.value as ExpenseCategory })}
                  className="input-base w-full h-8 text-xs cursor-pointer"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Наименование статьи *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Аренда основного зала"
                  value={newItemData.title}
                  onChange={e => setNewItemData({ ...newItemData, title: e.target.value })}
                  className="input-base w-full h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    План, ₽ *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemData.plannedAmount}
                    onChange={e => setNewItemData({ ...newItemData, plannedAmount: Number(e.target.value) || 0 })}
                    className="input-base w-full h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Факт, ₽
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemData.actualAmount}
                    onChange={e => setNewItemData({ ...newItemData, actualAmount: Number(e.target.value) || 0 })}
                    className="input-base w-full h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Привязать подрядчика
                </label>
                <select
                  value={newItemData.contractorId}
                  onChange={e => setNewItemData({ ...newItemData, contractorId: e.target.value })}
                  className="input-base w-full h-8 text-xs cursor-pointer"
                >
                  <option value="">Без подрядчика (внутренние расходы)</option>
                  {activeContractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Примечание / Обоснование
                </label>
                <textarea
                  rows={2}
                  placeholder="Детали договора или условия оплаты..."
                  value={newItemData.notes}
                  onChange={e => setNewItemData({ ...newItemData, notes: e.target.value })}
                  className="input-base w-full h-auto py-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary h-8 text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary h-8 text-xs"
                >
                  Создать статью
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Budget Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Редактирование статьи
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Категория затрат
                </label>
                <select
                  value={editingItem.category}
                  onChange={e => setEditingItem({ ...editingItem, category: e.target.value as ExpenseCategory })}
                  className="input-base w-full h-8 text-xs cursor-pointer"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Наименование статьи
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="input-base w-full h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    План, ₽
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingItem.plannedAmount}
                    onChange={e => setEditingItem({ ...editingItem, plannedAmount: Number(e.target.value) || 0 })}
                    className="input-base w-full h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Факт, ₽
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.actualAmount}
                    onChange={e => setEditingItem({ ...editingItem, actualAmount: Number(e.target.value) || 0 })}
                    className="input-base w-full h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Привязать подрядчика
                </label>
                <select
                  value={editingItem.contractorId || ''}
                  onChange={e => setEditingItem({ ...editingItem, contractorId: e.target.value || undefined })}
                  className="input-base w-full h-8 text-xs cursor-pointer"
                >
                  <option value="">Без подрядчика (внутренние расходы)</option>
                  {activeContractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Примечание
                </label>
                <textarea
                  rows={2}
                  value={editingItem.notes}
                  onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="input-base w-full h-auto py-1 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn-secondary h-8 text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary h-8 text-xs"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
