import React, { useState, useEffect } from 'react';
import {
  Kanban,
  List,
  Plus,
  MessageSquare,
  X,
  Trash2,
  Filter,
  Send,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  CheckSquare,
  GripVertical
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { TaskItem, TaskPriority, TaskStatus, KanbanStage, KanbanStageColor } from '../../types/event';
import { formatDate, isTaskOverdue } from '../../utils/analytics';

const STAGE_COLOR_MAP: Record<KanbanStageColor, { bg: string; border: string; bar: string; dot: string; lightBg: string }> = {
  zinc: {
    bg: 'bg-zinc-500',
    border: 'border-zinc-400',
    bar: 'bg-zinc-500',
    dot: 'bg-zinc-400',
    lightBg: 'bg-zinc-100'
  },
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-400',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    lightBg: 'bg-blue-50'
  },
  amber: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    lightBg: 'bg-amber-50'
  },
  emerald: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-400',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    lightBg: 'bg-emerald-50'
  },
  purple: {
    bg: 'bg-purple-500',
    border: 'border-purple-400',
    bar: 'bg-purple-500',
    dot: 'bg-purple-500',
    lightBg: 'bg-purple-50'
  },
  rose: {
    bg: 'bg-rose-500',
    border: 'border-rose-400',
    bar: 'bg-rose-500',
    dot: 'bg-rose-500',
    lightBg: 'bg-rose-50'
  }
};

export const TasksView: React.FC = () => {
  const {
    activeEvent,
    activeTasks,
    activeTeam,
    activeKanbanStages,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    addTaskComment,
    addKanbanStage,
    updateKanbanStage,
    deleteKanbanStage,
    moveKanbanStage,
    currentUserRole,
    selectedTeamMemberFilter,
    setSelectedTeamMemberFilter
  } = useEventContext();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState<boolean>(false);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [lastDroppedTaskId, setLastDroppedTaskId] = useState<string | null>(null);

  // Quick task per stage state (stageId -> string)
  const [quickTaskStageId, setQuickTaskStageId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>('');

  // Editing stage state
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageTitle, setEditingStageTitle] = useState<string>('');
  const [editingStageColor, setEditingStageColor] = useState<KanbanStageColor>('blue');
  const [editingIsCompleted, setEditingIsCompleted] = useState<boolean>(false);

  // New stage form state
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState('');
  const [newStageColor, setNewStageColor] = useState<KanbanStageColor>('blue');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Synchronize team member filter from context if provided
  useEffect(() => {
    if (selectedTeamMemberFilter) {
      setFilterAssignee(selectedTeamMemberFilter);
    }
  }, [selectedTeamMemberFilter]);

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
    status: activeKanbanStages[0]?.id || 'todo'
  });

  // Ensure default stage in newTaskData is up to date
  useEffect(() => {
    if (activeKanbanStages.length > 0 && !activeKanbanStages.some(s => s.id === newTaskData.status)) {
      setNewTaskData(prev => ({ ...prev, status: activeKanbanStages[0].id }));
    }
  }, [activeKanbanStages]);

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
      status: activeKanbanStages[0]?.id || 'todo'
    });
  };

  const handleQuickTaskSubmit = (stageId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !activeEvent) return;

    addTask({
      eventId: activeEvent.id,
      title: quickTaskTitle.trim(),
      description: '',
      assigneeId: activeTeam[0]?.id || 'tm-1',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      priority: 'medium',
      status: stageId
    });

    setQuickTaskTitle('');
    setQuickTaskStageId(null);
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

  const handleStartEditStage = (stage: KanbanStage) => {
    setEditingStageId(stage.id);
    setEditingStageTitle(stage.title);
    setEditingStageColor(stage.color || 'blue');
    setEditingIsCompleted(!!stage.isCompletedStage);
  };

  const handleSaveStageEdit = (stageId: string) => {
    if (!editingStageTitle.trim()) return;
    updateKanbanStage(stageId, {
      title: editingStageTitle.trim(),
      color: editingStageColor,
      isCompletedStage: editingIsCompleted
    });
    setEditingStageId(null);
  };

  const handleCreateNewStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageTitle.trim() || !activeEvent) return;
    addKanbanStage(activeEvent.id, newStageTitle.trim(), newStageColor);
    setNewStageTitle('');
    setIsAddingStage(false);
  };

  // Helper to determine if a task matches a stage
  const isTaskInStage = (task: TaskItem, stage: KanbanStage): boolean => {
    if (task.status === stage.id) return true;
    // Fallback checks for legacy status format ('todo', 'in_progress', 'review', 'done')
    if (stage.id.endsWith('-' + task.status)) return true;
    if (task.status === 'done' && stage.isCompletedStage) return true;
    if (task.status === 'todo' && stage.order === 0) return true;
    return false;
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (currentUserRole === 'guest') return;
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    // Check if leaving to outside the column
    const related = e.relatedTarget as HTMLElement;
    if (!related || !e.currentTarget.contains(related)) {
      if (dragOverStageId === stageId) {
        setDragOverStageId(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: KanbanStage) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverStageId(null);
    setDraggedTaskId(null);

    if (!taskId) return;

    updateTaskStatus(taskId, targetStage.id);
    setLastDroppedTaskId(taskId);

    // Remove settle animation class after 450ms
    setTimeout(() => {
      setLastDroppedTaskId(null);
    }, 450);
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

  const colorOptions: KanbanStageColor[] = ['zinc', 'blue', 'amber', 'emerald', 'purple', 'rose'];

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="card-surface p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: View Mode Toggle, Overdue Filter & Active Assignee Indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Доска
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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

          {selectedTeamMemberFilter && (
            <div className="flex items-center gap-1.5 bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-xs border border-zinc-200">
              <span>Сотрудник: {getAssigneeName(selectedTeamMemberFilter)}</span>
              <button
                onClick={() => {
                  setSelectedTeamMemberFilter(null);
                  setFilterAssignee('all');
                }}
                className="text-zinc-400 hover:text-zinc-700"
                title="Сбросить фильтр"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Filters & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            aria-label="Фильтр по ответственному"
            value={filterAssignee}
            onChange={e => {
              setFilterAssignee(e.target.value);
              if (e.target.value === 'all') {
                setSelectedTeamMemberFilter(null);
              }
            }}
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
        <div className="flex gap-3 overflow-x-auto pb-4 items-start select-none">
          {activeKanbanStages.map((stage, stageIndex) => {
            const stageTasks = filteredTasks.filter(t => isTaskInStage(t, stage));
            const colorStyle = STAGE_COLOR_MAP[stage.color || 'blue'];
            const isDragOver = dragOverStageId === stage.id;
            const isEditing = editingStageId === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={e => handleDragOver(e, stage.id)}
                onDragLeave={e => handleDragLeave(e, stage.id)}
                onDrop={e => handleDrop(e, stage)}
                className={`w-72 shrink-0 rounded-lg flex flex-col min-h-[540px] transition-all duration-200 border relative ${
                  isDragOver
                    ? 'bg-zinc-100 dark:bg-zinc-800/80 ring-2 ring-zinc-900/20 dark:ring-zinc-400/30 border-zinc-400 dark:border-zinc-600'
                    : 'bg-zinc-100/70 dark:bg-[#16161A] border-zinc-200/90 dark:border-zinc-800/80'
                }`}
              >
                {/* 3px Top Colored Line */}
                <div className={`h-[3px] rounded-t-lg w-full ${colorStyle.bar}`} />

                {/* Column Header */}
                <div className="p-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        autoFocus
                        value={editingStageTitle}
                        onChange={e => setEditingStageTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveStageEdit(stage.id);
                          if (e.key === 'Escape') setEditingStageId(null);
                        }}
                        className="input-base w-full text-xs font-semibold"
                        placeholder="Название этапа"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-500">Цвет:</span>
                        {colorOptions.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditingStageColor(c)}
                            className={`w-4 h-4 rounded-full ${STAGE_COLOR_MAP[c].bg} ${
                              editingStageColor === c ? 'ring-2 ring-zinc-900 ring-offset-1' : ''
                            }`}
                          />
                        ))}
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-zinc-600">
                        <input
                          type="checkbox"
                          checked={editingIsCompleted}
                          onChange={e => setEditingIsCompleted(e.target.checked)}
                          className="rounded border-zinc-300 text-zinc-900 w-3.5 h-3.5"
                        />
                        <span>Финальный этап (% готовности)</span>
                      </label>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingStageId(null)}
                          className="px-2 py-0.5 text-xs text-zinc-600 hover:text-zinc-900"
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveStageEdit(stage.id)}
                          className="px-2.5 py-0.5 text-xs bg-zinc-900 text-white rounded font-medium hover:bg-zinc-800"
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${colorStyle.dot}`} />
                        <h3
                          onClick={() => handleStartEditStage(stage)}
                          className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate cursor-pointer hover:underline"
                          title="Нажмите для переименования этапа"
                        >
                          {stage.title}
                        </h3>
                        {stage.isCompletedStage && (
                          <span title="Задачи в этом этапе считаются завершенными">
                            <CheckSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/80 dark:border-zinc-700 px-1.5 py-0.5 rounded text-xs font-mono font-semibold">
                          {stageTasks.length}
                        </span>

                        {currentUserRole !== 'guest' && (
                          <div className="flex items-center text-zinc-400">
                            <button
                              disabled={stageIndex === 0}
                              onClick={() => moveKanbanStage(stage.id, 'left')}
                              className="p-1 hover:text-zinc-700 disabled:opacity-20 disabled:hover:text-zinc-400"
                              title="Сдвинуть этап влево"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              disabled={stageIndex === activeKanbanStages.length - 1}
                              onClick={() => moveKanbanStage(stage.id, 'right')}
                              className="p-1 hover:text-zinc-700 disabled:opacity-20 disabled:hover:text-zinc-400"
                              title="Сдвинуть этап вправо"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleStartEditStage(stage)}
                              className="p-1 hover:text-zinc-700"
                              title="Редактировать этап"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {activeKanbanStages.length > 1 && (
                              <button
                                onClick={() => deleteKanbanStage(stage.id)}
                                className="p-1 hover:text-red-600"
                                title="Удалить этап"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tasks List */}
                <div className="p-2.5 space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {stageTasks.length === 0 && !isDragOver && (
                    <div className="h-20 flex items-center justify-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-md">
                      Перетащите задачу сюда
                    </div>
                  )}

                  {/* Drag drop slot indicator when hovering */}
                  {isDragOver && (
                    <div className="h-16 rounded-md border-2 border-dashed border-zinc-400 bg-zinc-200/50 my-1.5 flex items-center justify-center text-[11px] font-mono text-zinc-600 animate-pulse">
                      Поместить в «{stage.title}»
                    </div>
                  )}

                  {stageTasks.map((task, idx) => {
                    const isOverdue = isTaskOverdue(task.deadline, task.status);
                    const taskIdDisplay = `TSK-${String(idx + 1).padStart(2, '0')}`;
                    const isBeingDragged = draggedTaskId === task.id;
                    const isJustDropped = lastDroppedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable={currentUserRole !== 'guest'}
                        onDragStart={e => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedTask(task)}
                        className={`bg-white dark:bg-[#1E1E24] border rounded-md p-3 transition-all duration-150 shadow-sm group select-none ${
                          currentUserRole !== 'guest' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                        } ${
                          isBeingDragged
                            ? 'opacity-40 border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-100/50 dark:bg-zinc-800/40 scale-[0.98]'
                            : 'border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600'
                        } ${
                          isJustDropped ? 'animate-drop-settle' : ''
                        }`}
                      >
                        {/* Top Row: Task ID & Priority */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {currentUserRole !== 'guest' && (
                              <GripVertical className="w-3 h-3 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 -ml-1 shrink-0" />
                            )}
                            <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                              {taskIdDisplay}
                            </span>
                          </div>

                          <span className={`text-[10px] font-medium uppercase ${
                            task.priority === 'critical'
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : task.priority === 'high'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}>
                            {task.priority === 'critical' ? 'Критично' : task.priority === 'high' ? 'Высокий' : 'Обычный'}
                          </span>
                        </div>

                        {/* Task Title */}
                        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1 leading-snug line-clamp-2 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">
                          {task.title}
                        </h4>

                        {/* Bottom Row: Assignee, Comments, Deadline */}
                        <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="truncate max-w-[90px]" title={getAssigneeName(task.assigneeId)}>
                            {getAssigneeName(task.assigneeId).split(' ')[0]}
                          </span>

                          <div className="flex items-center gap-2 font-mono">
                            {task.comments.length > 0 && (
                              <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                                <MessageSquare className="w-3 h-3" />
                                {task.comments.length}
                              </span>
                            )}

                            {isOverdue ? (
                              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-medium">
                                {formatDate(task.deadline)}
                              </span>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-500">
                                {formatDate(task.deadline)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Quick Task Input / Button */}
                {currentUserRole !== 'guest' && (
                  <div className="p-2 border-t border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 rounded-b-lg">
                    {quickTaskStageId === stage.id ? (
                      <form onSubmit={e => handleQuickTaskSubmit(stage.id, e)} className="space-y-1.5">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Название задачи... (Enter)"
                          value={quickTaskTitle}
                          onChange={e => setQuickTaskTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') {
                              setQuickTaskStageId(null);
                              setQuickTaskTitle('');
                            }
                          }}
                          className="input-base w-full text-xs h-7"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setQuickTaskStageId(null);
                              setQuickTaskTitle('');
                            }}
                            className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 px-1.5 py-0.5"
                          >
                            Отмена
                          </button>
                          <button
                            type="submit"
                            className="text-[11px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded px-2 py-0.5 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-medium"
                          >
                            Добавить
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setQuickTaskStageId(stage.id);
                          setQuickTaskTitle('');
                        }}
                        className="w-full py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center gap-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Быстрая задача</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Right: Add New Kanban Stage Column */}
          {currentUserRole !== 'guest' && (
            <div className="w-64 shrink-0 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-[#16161A]/50 p-3 min-h-[140px] flex flex-col justify-start">
              {isAddingStage ? (
                <form onSubmit={handleCreateNewStage} className="space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block">Новый этап канбана</span>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Например: Тестирование"
                    value={newStageTitle}
                    onChange={e => setNewStageTitle(e.target.value)}
                    className="input-base w-full text-xs"
                  />
                  <div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1">Цвет этапа:</span>
                    <div className="flex items-center gap-1.5">
                      {colorOptions.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewStageColor(c)}
                          className={`w-4 h-4 rounded-full ${STAGE_COLOR_MAP[c].bg} ${
                            newStageColor === c ? 'ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-1' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingStage(false);
                        setNewStageTitle('');
                      }}
                      className="btn-secondary h-6 px-2 text-xs"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="btn-primary h-6 px-2.5 text-xs"
                    >
                      Создать этап
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingStage(true)}
                  className="w-full h-24 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 flex flex-col items-center justify-center gap-1.5 text-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">+ Добавить этап</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table / List View */}
      {viewMode === 'list' && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Статус (Этап)</th>
                <th className="py-2.5 px-3.5">Задача</th>
                <th className="py-2.5 px-3.5">Приоритет</th>
                <th className="py-2.5 px-3.5">Ответственный</th>
                <th className="py-2.5 px-3.5">Дедлайн</th>
                <th className="py-2.5 px-3.5 text-center">Комм.</th>
                <th className="py-2.5 px-3.5 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/70 text-zinc-800 dark:text-zinc-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 dark:text-zinc-500">
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
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3.5" onClick={e => e.stopPropagation()}>
                        <select
                          aria-label="Сменить статус задачи"
                          value={task.status}
                          onChange={e => updateTaskStatus(task.id, e.target.value)}
                          className="h-7 px-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 cursor-pointer"
                        >
                          {activeKanbanStages.map(st => (
                            <option key={st.id} value={st.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                              {st.title}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3.5 font-medium text-zinc-900 dark:text-zinc-100 max-w-md">
                        <div className="truncate">{task.title}</div>
                      </td>

                      <td className="py-2 px-3.5">
                        <span className={`text-[11px] font-medium ${
                          task.priority === 'critical'
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : task.priority === 'high'
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {task.priority === 'critical' ? 'Критичный' : task.priority === 'high' ? 'Высокий' : 'Обычный'}
                        </span>
                      </td>

                      <td className="py-2 px-3.5 text-zinc-600 dark:text-zinc-400">
                        {getAssigneeName(task.assigneeId)}
                      </td>

                      <td className="py-2 px-3.5 font-mono">
                        {isOverdue ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-medium">
                            {formatDate(task.deadline)}
                          </span>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">{formatDate(task.deadline)}</span>
                        )}
                      </td>

                      <td className="py-2 px-3.5 text-center font-mono text-zinc-400 dark:text-zinc-500">
                        {task.comments.length}
                      </td>

                      <td className="py-2 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-lg shadow-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Карточка задачи
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {selectedTask.title}
                </h3>
                {selectedTask.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800">
                    {selectedTask.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 rounded border border-zinc-200 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 dark:text-zinc-500 block mb-1">Статус (Этап)</span>
                  <select
                    value={selectedTask.status}
                    onChange={e => {
                      const updated = { ...selectedTask, status: e.target.value };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full h-7 px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs"
                  >
                    {activeKanbanStages.map(st => (
                      <option key={st.id} value={st.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                        {st.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 dark:text-zinc-500 block mb-1">Ответственный</span>
                  <select
                    value={selectedTask.assigneeId}
                    onChange={e => {
                      const updated = { ...selectedTask, assigneeId: e.target.value };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full h-7 px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs truncate"
                  >
                    {activeTeam.map(tm => (
                      <option key={tm.id} value={tm.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                        {tm.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 dark:text-zinc-500 block mb-1">Дедлайн</span>
                  <input
                    type="date"
                    value={selectedTask.deadline}
                    onChange={e => {
                      const updated = { ...selectedTask, deadline: e.target.value };
                      setSelectedTask(updated);
                      updateTask(updated);
                    }}
                    className="w-full h-7 px-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  Комментарии ({selectedTask.comments.length})
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedTask.comments.length === 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2 text-center">
                      Нет комментариев
                    </p>
                  ) : (
                    selectedTask.comments.map(c => (
                      <div key={c.id} className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{c.authorName}</strong>
                          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">
                            {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300">{c.text}</p>
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

            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={() => {
                  deleteTask(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Новая задача</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Описание
                </label>
                <textarea
                  rows={2}
                  value={newTaskData.description}
                  onChange={e => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Ответственный
                  </label>
                  <select
                    value={newTaskData.assigneeId}
                    onChange={e => setNewTaskData({ ...newTaskData, assigneeId: e.target.value })}
                    className="input-base w-full cursor-pointer truncate"
                  >
                    {activeTeam.map(tm => (
                      <option key={tm.id} value={tm.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                        {tm.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Статус (Этап)
                  </label>
                  <select
                    value={newTaskData.status}
                    onChange={e => setNewTaskData({ ...newTaskData, status: e.target.value })}
                    className="input-base w-full cursor-pointer"
                  >
                    {activeKanbanStages.map(st => (
                      <option key={st.id} value={st.id} className="dark:bg-zinc-900 dark:text-zinc-100">
                        {st.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
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
