import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Building,
  Edit2,
  Trash2,
  X,
  Save,
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
    deleteBudgetItem,
    currentUserRole
  } = useEventContext();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

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
    return <div className="p-8 text-center text-slate-400">Мероприятие не выбрано.</div>;
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    updateBudgetItem({
      ...editingItem,
      plannedAmount: Math.max(0, Number(editingItem.plannedAmount) || 0),
      actualAmount: Math.max(0, Number(editingItem.actualAmount) || 0)
    });

    setEditingItem(null);
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
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Warning Banner if Overrun */}
      {metrics.isOverTotalLimit && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 backdrop-blur-md flex items-center gap-3 shadow-lg shadow-rose-950/20">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-200">
              Внимание: зафиксировано превышение сметы расходов!
            </h4>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Суммарные фактические затраты составили{' '}
              <strong className="text-white font-mono">{formatCurrency(metrics.totalActualBudget)}</strong>, что превышает плановый лимит на{' '}
              <strong className="text-white font-mono">{formatCurrency(metrics.budgetOverrunAmount)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Budget Limit */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>ЛИМИТ БЮДЖЕТА</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {formatCurrency(activeEvent.totalBudgetLimit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Установленный предел затрат
          </div>
        </div>

        {/* Card 2: Planned Sum */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>ПЛАНОВАЯ СМЕТА</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {formatCurrency(metrics.totalPlannedBudget)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Сумма всех утвержденных статей
          </div>
        </div>

        {/* Card 3: Actual Expenses */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>ФАКТИЧЕСКИЕ ТРАТЫ</span>
            <TrendingDown className={`w-4 h-4 ${metrics.isOverTotalLimit ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${metrics.isOverTotalLimit ? 'text-rose-400' : 'text-white'}`}>
            {formatCurrency(metrics.totalActualBudget)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {Math.round((metrics.totalActualBudget / Math.max(1, activeEvent.totalBudgetLimit)) * 100)}% от лимита
          </div>
        </div>

        {/* Card 4: Balance / Overrun */}
        <div className={`glass-panel p-5 rounded-2xl ${remainingFromLimit < 0 ? 'border-rose-500/40 bg-rose-950/10' : ''}`}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>{remainingFromLimit >= 0 ? 'ОСТАТОК БЮДЖЕТА' : 'ПЕРЕРАСХОД'}</span>
            {remainingFromLimit >= 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-2xl font-extrabold font-mono ${remainingFromLimit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(Math.abs(remainingFromLimit))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {remainingFromLimit >= 0 ? 'Свободные средства' : 'Требуется оптимизация'}
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Add & Export */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            aria-label="Фильтр по категории расходов"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
          >
            <option value="all">Все категории ({activeBudget.length})</option>
            {ALL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => exportBudgetToCSV(activeBudget, activeEvent.title)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Экспорт сметы в CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Добавить статью</span>
          </button>
        </div>
      </div>

      {/* Interactive Expense Items Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Категория</th>
                <th className="py-3.5 px-4">Статья расходов</th>
                <th className="py-3.5 px-4">План (₽)</th>
                <th className="py-3.5 px-4">Факт (₽)</th>
                <th className="py-3.5 px-4">Отклонение</th>
                <th className="py-3.5 px-4">Подрядчик</th>
                <th className="py-3.5 px-4">Заметки</th>
                <th className="py-3.5 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredBudget.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
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
                      className={`hover:bg-slate-800/40 transition ${isOver ? 'bg-rose-950/15' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white max-w-xs">
                        <div>{item.title}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {formatCurrency(item.plannedAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={isOver ? 'text-rose-400' : 'text-slate-100'}>
                          {formatCurrency(item.actualAmount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        {diff === 0 ? (
                          <span className="text-slate-500">0 ₽</span>
                        ) : isOver ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            +{formatCurrency(diff)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5" />
                            -{formatCurrency(Math.abs(diff))}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {getContractorName(item.contractorId)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate" title={item.notes}>
                        {item.notes || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                            title="Редактировать статью"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBudgetItem(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
            {/* Table Footer: Totals */}
            <tfoot className="bg-slate-950/90 font-bold text-xs border-t border-slate-700">
              <tr>
                <td className="py-3.5 px-4 text-white uppercase text-[10px]" colSpan={2}>
                  Итого ({filteredBudget.length} статей):
                </td>
                <td className="py-3.5 px-4 font-mono text-cyan-300">
                  {formatCurrency(filteredBudget.reduce((s, i) => s + i.plannedAmount, 0))}
                </td>
                <td className="py-3.5 px-4 font-mono text-white">
                  {formatCurrency(filteredBudget.reduce((s, i) => s + i.actualAmount, 0))}
                </td>
                <td className="py-3.5 px-4 font-mono" colSpan={4}>
                  {(() => {
                    const totalDiff =
                      filteredBudget.reduce((s, i) => s + i.actualAmount, 0) -
                      filteredBudget.reduce((s, i) => s + i.plannedAmount, 0);
                    return totalDiff > 0 ? (
                      <span className="text-rose-400 font-bold">
                        Общий перерасход: +{formatCurrency(totalDiff)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-medium">
                        В рамках сметы ({formatCurrency(Math.abs(totalDiff))} резерв)
                      </span>
                    );
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal: Add Budget Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Новая статья расходов
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Категория расходов <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newItemData.category}
                  onChange={e => setNewItemData({ ...newItemData, category: e.target.value as ExpenseCategory })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Наименование статьи <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Питание волонтеров и экспертов жюри"
                  value={newItemData.title}
                  onChange={e => setNewItemData({ ...newItemData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Плановая сумма (₽) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={newItemData.plannedAmount}
                    onChange={e => setNewItemData({ ...newItemData, plannedAmount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Фактический расход (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={newItemData.actualAmount}
                    onChange={e => setNewItemData({ ...newItemData, actualAmount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Привязанный подрядчик (опционально)
                </label>
                <select
                  value={newItemData.contractorId}
                  onChange={e => setNewItemData({ ...newItemData, contractorId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Заметки и комментарии к платежу
                </label>
                <textarea
                  rows={2}
                  placeholder="Номер счета, реквизиты договора или условия оплаты..."
                  value={newItemData.notes}
                  onChange={e => setNewItemData({ ...newItemData, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition"
                >
                  Добавить в смету
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Budget Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                Редактирование статьи расходов
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Категория
                </label>
                <select
                  value={editingItem.category}
                  onChange={e => setEditingItem({ ...editingItem, category: e.target.value as ExpenseCategory })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  {ALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Наименование статьи
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Плановая сумма (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={editingItem.plannedAmount}
                    onChange={e => setEditingItem({ ...editingItem, plannedAmount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Фактический расход (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={editingItem.actualAmount}
                    onChange={e => setEditingItem({ ...editingItem, actualAmount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Привязанный подрядчик
                </label>
                <select
                  value={editingItem.contractorId || ''}
                  onChange={e => setEditingItem({ ...editingItem, contractorId: e.target.value || undefined })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Заметки
                </label>
                <textarea
                  rows={2}
                  value={editingItem.notes}
                  onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
