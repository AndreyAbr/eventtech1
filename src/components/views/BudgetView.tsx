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
import { formatCurrency } from '../../utils/analytics';
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
    return <div className="p-8 text-center text-xs text-zinc-400">Мероприятие не выбрано.</div>;
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Бюджет и смета
          </h1>
          <p className="text-xs text-zinc-500">
            Контроль плановых статей, фактических оплат и контрагентов
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="btn-secondary"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
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
        <div className="bg-red-50/80 border border-red-200 rounded-md px-3.5 py-2 text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            Зафиксирован перерасход: фактические расходы (<strong className="font-mono">{formatCurrency(metrics.totalActualBudget)}</strong>) превышают лимит на <strong className="font-mono">{formatCurrency(metrics.budgetOverrunAmount)}</strong>.
          </span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 shadow-sm">
        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">Лимит бюджета</div>
          <div className="text-xl font-semibold text-zinc-900 font-mono tabular-nums mt-1">
            {formatCurrency(activeEvent.totalBudgetLimit)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Утвержденный предел</div>
        </div>

        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">Плановая смета</div>
          <div className="text-xl font-semibold text-zinc-900 font-mono tabular-nums mt-1">
            {formatCurrency(metrics.totalPlannedBudget)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Сумма всех статей</div>
        </div>

        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">Фактический расход</div>
          <div className={`text-xl font-semibold font-mono tabular-nums mt-1 ${
            metrics.isOverTotalLimit ? 'text-red-600' : 'text-zinc-900'
          }`}>
            {formatCurrency(metrics.totalActualBudget)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {Math.round((metrics.totalActualBudget / Math.max(1, activeEvent.totalBudgetLimit)) * 100)}% от лимита
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs font-medium text-zinc-500">
            {remainingFromLimit >= 0 ? 'Остаток средств' : 'Перерасход'}
          </div>
          <div className={`text-xl font-semibold font-mono tabular-nums mt-1 ${
            remainingFromLimit >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {formatCurrency(Math.abs(remainingFromLimit))}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {remainingFromLimit >= 0 ? 'В рамках бюджета' : 'Требует сокращения'}
          </div>
        </div>
      </div>

      {/* Category Filter Toolbar */}
      <div className="card-surface p-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            aria-label="Фильтр по категории расходов"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="input-base h-8 text-xs cursor-pointer w-56"
          >
            <option value="all">Все категории ({activeBudget.length})</option>
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-mono text-zinc-500">
          Показано: {filteredBudget.length} статей
        </span>
      </div>

      {/* Dense Accounting Table */}
      <div className="card-surface overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3.5">Категория</th>
              <th className="py-2.5 px-3.5">Статья расходов</th>
              <th className="py-2.5 px-3.5 text-right">План, ₽</th>
              <th className="py-2.5 px-3.5 text-right">Факт, ₽</th>
              <th className="py-2.5 px-3.5 text-right">Отклонение</th>
              <th className="py-2.5 px-3.5">Подрядчик</th>
              <th className="py-2.5 px-3.5">Заметки</th>
              <th className="py-2.5 px-3.5 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 text-zinc-800">
            {filteredBudget.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400">
                  Статьи расходов не найдены
                </td>
              </tr>
            ) : (
              filteredBudget.map(item => {
                const diff = item.actualAmount - item.plannedAmount;
                const isOver = diff > 0;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-zinc-50/60 transition-colors ${isOver ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="py-2.5 px-3.5">
                      <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 font-medium text-zinc-900 max-w-xs">
                      {item.title}
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums text-zinc-600">
                      {formatCurrency(item.plannedAmount)}
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums">
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={item.actualAmount}
                        onChange={e => handleActualChange(item, e.target.value)}
                        className={`w-28 text-right font-mono h-7 px-2 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 ${
                          isOver ? 'border-red-300 text-red-600 bg-red-50/40' : 'border-zinc-200 bg-white text-zinc-900'
                        }`}
                      />
                    </td>

                    <td className="py-2.5 px-3.5 text-right font-mono tabular-nums">
                      {diff === 0 ? (
                        <span className="text-zinc-400">0 ₽</span>
                      ) : isOver ? (
                        <span className="text-red-600 font-medium">
                          +{formatCurrency(diff)}
                        </span>
                      ) : (
                        <span className="text-emerald-600">
                          -{formatCurrency(Math.abs(diff))}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-zinc-500 truncate max-w-[140px]">
                      {getContractorName(item.contractorId)}
                    </td>

                    <td className="py-2.5 px-3.5 text-zinc-400 max-w-[140px] truncate" title={item.notes}>
                      {item.notes || '—'}
                    </td>

                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        onClick={() => deleteBudgetItem(item.id)}
                        className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
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
          <tfoot className="bg-zinc-50/80 border-t border-zinc-200 font-medium text-xs">
            <tr>
              <td colSpan={2} className="py-2.5 px-3.5 text-zinc-600 font-semibold uppercase text-[11px]">
                Итого ({filteredBudget.length} статей):
              </td>
              <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-zinc-900">
                {formatCurrency(filteredBudget.reduce((s, i) => s + i.plannedAmount, 0))}
              </td>
              <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-zinc-900">
                {formatCurrency(filteredBudget.reduce((s, i) => s + i.actualAmount, 0))}
              </td>
              <td className="py-2.5 px-3.5 text-right font-mono font-semibold">
                {(() => {
                  const totalDiff =
                    filteredBudget.reduce((s, i) => s + i.actualAmount, 0) -
                    filteredBudget.reduce((s, i) => s + i.plannedAmount, 0);
                  return totalDiff > 0 ? (
                    <span className="text-red-600 font-medium">+{formatCurrency(totalDiff)}</span>
                  ) : (
                    <span className="text-emerald-600">-{formatCurrency(Math.abs(totalDiff))}</span>
                  );
                })()}
              </td>
              <td colSpan={3}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal: Add Budget Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40">
          <div className="bg-white border border-zinc-200 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Новая статья расходов</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Категория расходов <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItemData.category}
                  onChange={e => setNewItemData({ ...newItemData, category: e.target.value as ExpenseCategory })}
                  className="input-base w-full cursor-pointer"
                >
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Привязанный подрядчик (опционально)
                </label>
                <select
                  value={newItemData.contractorId}
                  onChange={e => setNewItemData({ ...newItemData, contractorId: e.target.value })}
                  className="input-base w-full cursor-pointer"
                >
                  <option value="">Без привязки к контрагенту</option>
                  {activeContractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.serviceType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Заметки
                </label>
                <textarea
                  rows={2}
                  value={newItemData.notes}
                  onChange={e => setNewItemData({ ...newItemData, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
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
