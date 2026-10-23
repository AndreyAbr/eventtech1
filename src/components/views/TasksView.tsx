import React, { useState } from 'react';
import {
  Kanban,
  List,
  Plus,
  MessageSquare,
  User,
  Calendar,
  X,
  Trash2,
  Filter,
  Send,
  Check
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/event';
import { formatDate, isTaskOverdue } from '../../utils/analytics';

export const TasksView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeTeam,
    addTask,
    updateTask,
    deleteTask,
    addTaskComment,
    currentUserRole
  } = useEventContext();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState<boolean>(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // New task form state
  const [newTaskData, setNewTaskData] = useState<{
    title: string;
    description: string;
    assigneeId: string;
    deadline: string;
    priority: TaskPriority;
    status: TaskStatus;
  }>({
    title: '',
    description: '',
    assigneeId: activeTeam[0]?.id || 'tm-1',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo'
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title.trim() || !activeEvent) return;

    addTask({
      eventId: activeEvent.id,
      title: newTaskData.title.trim(),
      description: newTaskData.description.trim(),
      assigneeId: newTaskData.assigneeId,
      deadline: newTaskData.deadline,
      priority: newTaskData.priority,
      status: newTaskData.status
    });

    setIsCreateModalOpen(false);
    setNewTaskData({
      title: '',
      description: '',
      assigneeId: activeTeam[0]?.id || 'tm-1',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      priority: 'medium',
      status: 'todo'
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTask) return;

    const author = currentUserRole === 'admin' ? 'Администратор' : 'Участник команды';
    addTaskComment(selectedTask.id, commentInput, author);

    const newComm = {
      id: 'comm-temp-' + Date.now(),
      authorName: author,
      text: commentInput.trim(),
      createdAt: new Date().toISOString()
    };
    setSelectedTask({
      ...selectedTask,
      comments: [...selectedTask.comments, newComm]
    });
    setCommentInput('');
  };

  // Filter tasks
  const filteredTasks = activeTasks.filter(task => {
    if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterOverdueOnly && !isTaskOverdue(task.deadline, task.status)) return false;
    return true;
  });

  const getAssigneeName = (assigneeId: string) => {
    const member = activeTeam.find(m => m.id === assigneeId);
    return member ? member.fullName : 'Не назначен';
  };

  const columns: { id: TaskStatus; title: string; dotColor: string }[] = [
    { id: 'todo', title: 'К выполнению', dotColor: 'bg-zinc-400' },
    { id: 'in_progress', title: 'В работе', dotColor: 'bg-amber-500' },
    { id: 'review', title: 'На проверке', dotColor: 'bg-blue-500' },
    { id: 'done', title: 'Готово', dotColor: 'bg-emerald-500' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="card-surface p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: View Mode Toggle & Overdue Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Доска
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Список
            </button>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-600 hover:text-zinc-900 select-none">
            <input
              type="checkbox"
              checked={filterOverdueOnly}
              onChange={e => setFilterOverdueOnly(e.target.checked)}
              className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-3.5 h-3.5"
            />
            <span className={filterOverdueOnly ? 'text-red-600 font-medium' : ''}>
              Только просроченные
            </span>
          </label>
        </div>

        {/* Right: Filters & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            aria-label="Фильтр по ответственному"
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
            className="input-base h-8 text-xs cursor-pointer"
          >
            <option value="all">Все ответственные</option>
            {activeTeam.map(member => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>

          <select
            aria-label="Фильтр по приоритету"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="input-base h-8 text-xs cursor-pointer"
          >
            <option value="all">Любой приоритет</option>
            <option value="critical">Критический</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            Новая задача
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-zinc-100/70 border border-zinc-200/80 rounded-lg p-2.5 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotColor}`}></span>
                    <h3 className="text-xs font-semibold text-zinc-700">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-md">
                      Пусто
                    </div>
                  ) : (
                    colTasks.map((task, idx) => {
                      const isOverdue = isTaskOverdue(task.deadline, task.status);
                      const taskIdDisplay = `TSK-${String(idx + 1).padStart(2, '0')}`;
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white border border-zinc-200 rounded-md p-3 hover:border-zinc-300 transition-colors shadow-sm cursor-pointer group"
                        >
                          {/* Top Row: Task ID & Priority */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-zinc-400">
                              {taskIdDisplay}
                            </span>
                            <span className={`text-[10px] font-medium uppercase ${
                              task.priority === 'critical'
                                ? 'text-red-600 font-semibold'
                                : task.priority === 'high'
                                ? 'text-amber-600'
                                : 'text-zinc-500'
                            }`}>
                              {task.priority === 'critical' ? 'Критично' : task.priority === 'high' ? 'Высокий' : 'Обычный'}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4 className="text-sm font-medium text-zinc-900 mt-1 leading-snug line-clamp-2 group-hover:text-zinc-800">
                            {task.title}
                          </h4>

                          {/* Bottom Row: Assignee, Comments, Deadline */}
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                            <span className="truncate max-w-[90px]" title={getAssigneeName(task.assigneeId)}>
                              {getAssigneeName(task.assigneeId).split(' ')[0]}
                            </span>

                            <div className="flex items-center gap-2 font-mono">
                              {task.comments.length > 0 && (
                                <span className="flex items-center gap-1 text-zinc-400">
                                  <MessageSquare className="w-3 h-3" />
                                  {task.comments.length}
                                </span>
                              )}

                              {isOverdue ? (
                                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                                  {formatDate(task.deadline)}
                                </span>
                              ) : (
                                <span className="text-zinc-400">
                                  {formatDate(task.deadline)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table / List View */}
      {viewMode === 'list' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Статус</th>
                <th className="py-2.5 px-3.5">Задача</th>
                <th className="py-2.5 px-3.5">Приоритет</th>
                <th className="py-2.5 px-3.5">Ответственный</th>
                <th className="py-2.5 px-3.5">Дедлайн</th>
                <th className="py-2.5 px-3.5 text-center">Комм.</th>
                <th className="py-2.5 px-3.5 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 text-zinc-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    Задачи не найдены
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = isTaskOverdue(task.deadline, task.status);
                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-zinc-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3.5" onClick={e => e.stopPropagation()}>
                        <select
                          aria-label="Сменить статус задачи"
                          value={task.status}
                          onChange={e => updateTask({ ...task, status: e.target.value as TaskStatus })}
                          className="h-7 px-2 rounded border border-zinc-200 bg-white text-xs font-medium focus:outline-none focus:border-zinc-900"
                        >
                          <option value="todo">К выполнению</option>
                          <option value="in_progress">В работе</option>
                          <option value="review">На проверке</option>
                          <option value="done">Готово</option>
                        </select>
                      </td>

                      <td className="py-2 px-3.5 font-medium text-zinc-900 max-w-md">
                        <div className="truncate">{task.title}</div>
                      </td>

                      <td className="py-2 px-3.5">
                        <span className={`text-[11px] font-medium ${
                          task.priority === 'critical'
                            ? 'text-red-600 font-semibold'
                            : task.priority === 'high'
                            ? 'text-amber-600 font-medium'
                            : 'text-zinc-500'
                        }`}>
                          {task.priority === 'critical' ? 'Критичный' : task.priority === 'high' ? 'Высокий' : 'Обычный'}
                        </span>
                      </td>

                      <td className="py-2 px-3.5 text-zinc-600">
                        {getAssigneeName(task.assigneeId)}
                      </td>

                      <td className="py-2 px-3.5 font-mono">
                        {isOverdue ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium">
                            {formatDate(task.deadline)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">{formatDate(task.deadline)}</span>
                        )}
                      </td>

                      <td className="py-2 px-3.5 text-center font-mono text-zinc-400">
                        {task.comments.length}
                      </td>

                      <td className="py-2 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                          title="Удалить задачу"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Task Detail & Comments */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40">
          <div className="bg-white border border-zinc-200 rounded-lg w-full max-w-lg shadow-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">
                Карточка задачи
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 leading-snug">
                  {selectedTask.title}
                </h3>
                {selectedTask.description && (
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed bg-zinc-50 p-2.5 rounded border border-zinc-200">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-zinc-50/60 p-3 rounded border border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">Статус</span>
                  <select
                    value={selectedTask.status}
                    onChange={e => {
                      const updated = { ...selectedTask, status: e.target.value as TaskStatus };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full h-7 px-1.5 rounded border border-zinc-200 bg-white text-xs"
                  >
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="done">Готово</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">Ответственный</span>
                  <select
                    value={selectedTask.assigneeId}
                    onChange={e => {
                      const updated = { ...selectedTask, assigneeId: e.target.value };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full h-7 px-1.5 rounded border border-zinc-200 bg-white text-xs truncate"
                  >
                    {activeTeam.map(tm => (
                      <option key={tm.id} value={tm.id}>
                        {tm.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block mb-1">Дедлайн</span>
                  <input
                    type="date"
                    value={selectedTask.deadline}
                    onChange={e => {
                      const updated = { ...selectedTask, deadline: e.target.value };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full h-7 px-1.5 rounded border border-zinc-200 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                  Комментарии ({selectedTask.comments.length})
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedTask.comments.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-2 text-center">
                      Нет комментариев
                    </p>
                  ) : (
                    selectedTask.comments.map(c => (
                      <div key={c.id} className="p-2.5 rounded bg-zinc-50 border border-zinc-200 text-xs">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <strong className="text-zinc-800 font-medium">{c.authorName}</strong>
                          <span className="text-zinc-400 font-mono text-[10px]">
                            {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-zinc-700">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    required
                    placeholder="Напишите комментарий..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="input-base flex-1"
                  />
                  <button type="submit" className="btn-primary">
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-zinc-200 flex justify-between items-center bg-zinc-50/50">
              <button
                type="button"
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Удалить
              </button>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="btn-secondary"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40">
          <div className="bg-white border border-zinc-200 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Новая задача</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Название задачи <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Согласовать звуковую аппаратуру"
                  value={newTaskData.title}
                  onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Описание
                </label>
                <textarea
                  rows={2}
                  value={newTaskData.description}
                  onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Ответственный
                  </label>
                  <select
                    value={newTaskData.assigneeId}
                    onChange={e => setNewTaskData({ ...newTaskData, assigneeId: e.target.value })}
                    className="input-base w-full cursor-pointer truncate"
                  >
                    {activeTeam.map(tm => (
                      <option key={tm.id} value={tm.id}>
                        {tm.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={newTaskData.priority}
                    onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value as TaskPriority })}
                    className="input-base w-full cursor-pointer"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="critical">Критический</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Дедлайн
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskData.deadline}
                    onChange={e => setNewTaskData({ ...newTaskData, deadline: e.target.value })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Статус
                  </label>
                  <select
                    value={newTaskData.status}
                    onChange={e => setNewTaskData({ ...newTaskData, status: e.target.value as TaskStatus })}
                    className="input-base w-full cursor-pointer"
                  >
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="done">Готово</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
