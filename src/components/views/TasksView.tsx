import React, { useState } from 'react';
import {
  Kanban,
  List,
  PlusCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  X,
  CheckCircle2,
  Trash2,
  Filter,
  Send
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
    
    // Update local selectedTask
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

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'К выполнению', color: 'border-slate-700 bg-slate-900/60' },
    { id: 'in_progress', title: 'В работе', color: 'border-indigo-500/30 bg-indigo-950/20' },
    { id: 'review', title: 'На проверке', color: 'border-purple-500/30 bg-purple-950/20' },
    { id: 'done', title: 'Готово', color: 'border-emerald-500/30 bg-emerald-950/20' }
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        {/* Left: View Mode Toggle & Overdue Switch */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Канбан-доска
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Таблица / Список
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition select-none">
            <input
              type="checkbox"
              checked={filterOverdueOnly}
              onChange={e => setFilterOverdueOnly(e.target.checked)}
              className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-800 w-3.5 h-3.5"
            />
            <span className={filterOverdueOnly ? 'text-rose-400 font-bold' : ''}>
              Только просроченные
            </span>
          </label>
        </div>

        {/* Right: Filters & Add Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Фильтр по ответственному"
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
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
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Любой приоритет</option>
              <option value="critical">Критический</option>
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition ml-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Добавить задачу
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl border ${col.color} p-4 flex flex-col min-h-[500px] backdrop-blur-sm`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      {col.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-slate-800 rounded-xl">
                      Нет задач
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const isOverdue = isTaskOverdue(task.deadline, task.status);
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className={`p-3.5 rounded-xl border bg-slate-900/90 shadow-sm cursor-pointer transition hover:scale-[1.01] hover:border-indigo-500/50 group ${
                            isOverdue
                              ? 'border-rose-500/40 bg-rose-950/20'
                              : 'border-slate-800 hover:bg-slate-850'
                          }`}
                        >
                          {/* Priority & Overdue Indicator */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                task.priority === 'critical'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : task.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : task.priority === 'medium'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {task.priority === 'critical' ? 'Критично' : task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                            </span>

                            {isOverdue && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Просрочено
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition line-clamp-2 mb-2 leading-relaxed">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                              {task.description}
                            </p>
                          )}

                          <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 truncate max-w-[110px]" title={getAssigneeName(task.assigneeId)}>
                              <User className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{getAssigneeName(task.assigneeId).split(' ')[0]}</span>
                            </span>

                            <span className={`flex items-center gap-1 font-mono text-[10px] ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                              <Calendar className="w-3 h-3 shrink-0" />
                              {formatDate(task.deadline)}
                            </span>
                          </div>

                          {/* Quick move buttons */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/50 flex items-center justify-between gap-1" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <MessageSquare className="w-3 h-3" />
                              {task.comments.length}
                            </div>

                            <select
                              aria-label="Сменить статус задачи"
                              value={task.status}
                              onChange={e => updateTask({ ...task, status: e.target.value as TaskStatus })}
                              className="bg-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
                            >
                              <option value="todo">К выполнению</option>
                              <option value="in_progress">В работу</option>
                              <option value="review">На проверку</option>
                              <option value="done">Готово</option>
                            </select>
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
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4">Задача</th>
                  <th className="py-3 px-4">Приоритет</th>
                  <th className="py-3 px-4">Ответственный</th>
                  <th className="py-3 px-4">Дедлайн</th>
                  <th className="py-3 px-4 text-center">Коммент.</th>
                  <th className="py-3 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Задачи не найдены по выбранным фильтрам
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const isOverdue = isTaskOverdue(task.deadline, task.status);
                    return (
                      <tr
                        key={task.id}
                        className={`hover:bg-slate-800/40 transition cursor-pointer ${
                          isOverdue ? 'bg-rose-950/10' : ''
                        }`}
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          <select
                            aria-label="Сменить статус задачи"
                            value={task.status}
                            onChange={e => updateTask({ ...task, status: e.target.value as TaskStatus })}
                            className={`rounded-lg px-2 py-1 text-xs font-semibold border ${
                              task.status === 'done'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : task.status === 'in_progress'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : task.status === 'review'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="todo">К выполнению</option>
                            <option value="in_progress">В работе</option>
                            <option value="review">На проверке</option>
                            <option value="done">Готово</option>
                          </select>
                        </td>

                        <td className="py-3 px-4 font-semibold text-white max-w-sm">
                          <div className="flex items-center gap-2">
                            <span>{task.title}</span>
                            {isOverdue && (
                              <span className="text-rose-400 font-bold shrink-0 text-[10px] bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                Просрочено!
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              task.priority === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : task.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : task.priority === 'medium'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {task.priority === 'critical' ? 'Критично' : task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          {getAssigneeName(task.assigneeId)}
                        </td>

                        <td className={`py-3 px-4 font-mono ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                          {formatDate(task.deadline)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {task.comments.length}
                        </td>

                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Удалить задачу"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Task Detail & Comments Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedTask.priority === 'critical'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : selectedTask.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {selectedTask.priority}
                </span>
                <span className="text-xs text-slate-400">Карточка задачи</span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Task Title & Description */}
              <div>
                <h3 className="text-base font-bold text-white mb-2 leading-relaxed">
                  {selectedTask.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                  {selectedTask.description || 'Описание не указано'}
                </p>
              </div>

              {/* Status and Assignee Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Статус
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={e => {
                      const updated = { ...selectedTask, status: e.target.value as TaskStatus };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="done">Готово</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Ответственный
                  </label>
                  <select
                    value={selectedTask.assigneeId}
                    onChange={e => {
                      const updated = { ...selectedTask, assigneeId: e.target.value };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    {activeTeam.map(tm => (
                      <option key={tm.id} value={tm.id}>
                        {tm.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Дедлайн
                  </label>
                  <input
                    type="date"
                    value={selectedTask.deadline}
                    onChange={e => {
                      const updated = { ...selectedTask, deadline: e.target.value };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Комментарии к задаче ({selectedTask.comments.length})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTask.comments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      Нет комментариев. Оставьте первый комментарий ниже.
                    </p>
                  ) : (
                    selectedTask.comments.map(c => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <strong className="text-indigo-300 font-semibold">{c.authorName}</strong>
                          <span className="text-slate-500">{new Date(c.createdAt).toLocaleString('ru-RU')}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="Напишите комментарий или статус обновления..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Отправить
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/40">
              <button
                type="button"
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Удалить задачу
              </button>

              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Task */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Новая задача подготовки
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Название задачи <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Согласовать звуковую аппаратуру со сценой"
                  value={newTaskData.title}
                  onChange={e => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Описание и требования
                </label>
                <textarea
                  rows={2}
                  placeholder="Дополнительные детали к выполнению задачи..."
                  value={newTaskData.description}
                  onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ответственный
                  </label>
                  <select
                    value={newTaskData.assigneeId}
                    onChange={e => setNewTaskData({ ...newTaskData, assigneeId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    {activeTeam.map(tm => (
                      <option key={tm.id} value={tm.id}>
                        {tm.fullName} ({tm.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={newTaskData.priority}
                    onChange={e => setNewTaskData({ ...newTaskData, priority: e.target.value as TaskPriority })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="critical">Критический</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Дедлайн исполнения
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskData.deadline}
                    onChange={e => setNewTaskData({ ...newTaskData, deadline: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Начальный статус
                  </label>
                  <select
                    value={newTaskData.status}
                    onChange={e => setNewTaskData({ ...newTaskData, status: e.target.value as TaskStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="done">Готово</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition"
                >
                  Создать задачу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
