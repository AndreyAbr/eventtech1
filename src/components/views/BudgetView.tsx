import React, { useState } from 'react';
import {
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  Trash2,
  X,
  Filter
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

export const BudgetView: React.FC = () => {
  const {
    activeEvent,
    activeBudget,
    activeContractors,
    metrics,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem
  } = useEventContext();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form
  const [newItemData, setNewItemData] = useState<{
    category: ExpenseCategory;
    title: string;
    plannedAmount: number;
    actualAmount: number;
    contractorId?: string;
    notes: string;
  }>({
    category: 'Кейтеринг',
    title: '',
    plannedAmount: 100000,
    actualAmount: 0,
    contractorId: '',
    notes: ''
  });

  if (!activeEvent) {
    return <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500">Мероприятие не выбрано.</div>;
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.title.trim()) return;

    addBudgetItem({
      eventId: activeEvent.id,
      category: newItemData.category,
      title: newItemData.title.trim(),
      plannedAmount: Math.max(0, Number(newItemData.plannedAmount) || 0),
      actualAmount: Math.max(0, Number(newItemData.actualAmount) || 0),
      contractorId: newItemData.contractorId || undefined,
      notes: newItemData.notes.trim()
    });

    setIsAddModalOpen(false);
    setNewItemData({
      category: 'Кейтеринг',
      title: '',
      plannedAmount: 100000,
      actualAmount: 0,
      contractorId: '',
      notes: ''
    });
  };

  const handleActualChange = (item: BudgetItem, val: string) => {
    const num = Math.max(0, Number(val) || 0);
    updateBudgetItem({
      ...item,
      actualAmount: num
    });
  };

  // Filter items
  const filteredBudget = activeBudget.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    return true;
  });

  const getContractorName = (contractorId?: string) => {
    if (!contractorId) return '—';
    const c = activeContractors.find(cont => cont.id === contractorId);
    return c ? c.companyName : '—';
  };

  const remainingFromLimit = activeEvent.totalBudgetLimit - metrics.totalActualBudget;

  const renderVariance = (actual: number, planned: number) => {
    const diff = actual - planned;
    if (diff === 0) {
      return <span className="text-zinc-400 dark:text-zinc-500 font-mono">0 ₽</span>;
    }
    if (diff > 0) {
      return <span className="text-red-600 dark:text-red-400 font-medium font-mono">+{diff.toLocaleString('ru-RU')} ₽</span>;
    }
    return <span className="text-emerald-600 dark:text-emerald-400 font-mono">−{Math.abs(diff).toLocaleString('ru-RU')} ₽</span>;
  };

  const totalPlanned = filteredBudget.reduce((s, i) => s + i.plannedAmount, 0);
  const totalActual = filteredBudget.reduce((s, i) => s + i.actualAmount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Бюджет и смета
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Контроль плановых статей, фактических оплат и контрагентов
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="btn-secondary"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            Экспорт в CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить статью
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {metrics.isOverTotalLimit && (
        <div className="bg-red-50/80 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md px-3.5 py-2 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>
            Зафиксирован перерасход: фактические расходы (<strong className="font-mono">{formatCurrency(metrics.totalActualBudget)}</strong>) превышают лимит на <strong className="font-mono">{formatCurrency(metrics.budgetOverrunAmount)}</strong>.
          </span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 shadow-sm">
        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Лимит бюджета</div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-1">
            {formatCurrency(activeEvent.totalBudgetLimit)}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Утвержденный предел</div>
        </div>

        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Плановая смета</div>
          <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums mt-1">
            {formatCurrency(metrics.totalPlannedBudget)}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Сумма всех статей</div>
        </div>

        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Фактический расход</div>
          <div className={`text-xl font-semibold font-mono tabular-nums mt-1 ${
            metrics.isOverTotalLimit ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-100'
          }`}>
            {formatCurrency(metrics.totalActualBudget)}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            {Math.round((metrics.totalActualBudget / Math.max(1, activeEvent.totalBudgetLimit)) * 100)}% от лимита
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {remainingFromLimit >= 0 ? 'Остаток средств' : 'Перерасход'}
          </div>
          <div className={`text-xl font-semibold font-mono tabular-nums mt-1 ${
            remainingFromLimit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(Math.abs(remainingFromLimit))}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            {remainingFromLimit >= 0 ? 'В рамках бюджета' : 'Требует сокращения'}
          </div>
        </div>
      </div>

      {/* Category Filter Toolbar */}
      <div className="card-surface p-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
          <select
            aria-label="Фильтр по категории расходов"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-base h-8 text-xs cursor-pointer w-56"
          >
            <option value="all" className="dark:bg-zinc-900 dark:text-zinc-100">Все категории ({activeBudget.length})</option>
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat} className="dark:bg-zinc-900 dark:text-zinc-100">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Показано: {filteredBudget.length} {pluralizeRu(filteredBudget.length, ['статья', 'статьи', 'статей'])}
        </span>
      </div>

      {/* Dense Accounting Table */}
      <div className="card-surface overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3.5">Категория</th>
              <th className="py-2.5 px-3.5 max-w-[260px]">Статья расходов</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">План, ₽</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Факт, ₽</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Отклонение</th>
              <th className="py-2.5 px-3.5 min-w-[150px] max-w-[200px]">Подрядчик</th>
              <th className="py-2.5 px-3.5 min-w-[150px] max-w-[200px]">Заметки</th>
              <th className="py-2.5 px-3.5 text-right w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/70 text-zinc-800 dark:text-zinc-200">
            {filteredBudget.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
                  Статьи расходов не найдены
                </td>
              </tr>
            ) : (
              filteredBudget.map(item => {
                const diff = item.actualAmount - item.plannedAmount;
                const isOver = diff > 0;
                const contractorName = getContractorName(item.contractorId);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors ${isOver ? 'bg-red-50/30 dark:bg-red-950/20' : ''}`}
                  >
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/80">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 font-medium text-zinc-900 dark:text-zinc-100 max-w-[260px] truncate" title={item.title}>
                      {item.title}
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                      {formatCurrency(item.plannedAmount)}
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          value={item.actualAmount}
                          onChange={e => handleActualChange(item, e.target.value)}
                          className={`w-28 text-right font-mono tabular-nums pr-6 h-7 pl-2 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 ${
                            isOver ? 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/40' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                          }`}
                        />
                        <span className="absolute right-2 text-xs text-zinc-400 dark:text-zinc-500 pointer-events-none font-mono">₽</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums whitespace-nowrap">
                      {renderVariance(item.actualAmount, item.plannedAmount)}
                    </td>

                    <td className="py-2.5 px-3.5 text-zinc-500 dark:text-zinc-400 truncate min-w-[150px] max-w-[200px]" title={contractorName}>
                      {contractorName}
                    </td>

                    <td className="py-2.5 px-3.5 text-zinc-400 dark:text-zinc-500 min-w-[150px] max-w-[200px] truncate" title={item.notes || '—'}>
                      {item.notes || '—'}
                    </td>

                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => deleteBudgetItem(item.id)}
                        className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors cursor-pointer"
                        title="Удалить статью"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-zinc-50/90 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800 font-semibold text-xs">
            <tr>
              <td colSpan={2} className="px-3.5 py-2.5 text-zinc-900 dark:text-zinc-100 uppercase text-[11px] whitespace-nowrap">
                Итого ({filteredBudget.length} {pluralizeRu(filteredBudget.length, ['статья', 'статьи', 'статей'])}):
              </td>
              <td className="px-3.5 py-2.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalPlanned)}
              </td>
              <td className="px-3.5 py-2.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalActual)}
              </td>
              <td className="px-3.5 py-2.5 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                {renderVariance(totalActual, totalPlanned)}
              </td>
              <td colSpan={3} className="px-3.5 py-2.5"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal: Add Budget Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Новая статья расходов</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Категория расходов <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItemData.category}
                  onChange={e => setNewItemData({ ...newItemData, category: e.target.value as ExpenseCategory })}
                  className="input-base w-full cursor-pointer"
                >
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="dark:bg-zinc-900 dark:text-zinc-100">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Наименование статьи <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Питание волонтеров"
                  value={newItemData.title}
                  onChange={e => setNewItemData({ ...newItemData, title: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Плановая сумма (₽) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={newItemData.plannedAmount}
                    onChange={e => setNewItemData({ ...newItemData, plannedAmount: Math.max(0, Number(e.target.value)) })}
                    className="input-base w-full font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Фактический расход (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={newItemData.actualAmount}
                    onChange={e => setNewItemData({ ...newItemData, actualAmount: Math.max(0, Number(e.target.value)) })}
                    className="input-base w-full font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Привязанный подрядчик (опционально)
                </label>
                <select
                  value={newItemData.contractorId}
                  onChange={e => setNewItemData({ ...newItemData, contractorId: e.target.value })}
                  className="input-base w-full cursor-pointer"
                >
                  <option value="" className="dark:bg-zinc-900 dark:text-zinc-100">Без привязки к контрагенту</option>
                  {activeContractors.map(c => (
                    <option key={c.id} value={c.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                      {c.companyName} ({c.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Заметки
                </label>
                <textarea
                  rows={2}
                  value={newItemData.notes}
                  onChange={e => setNewItemData({ ...newItemData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
