import { EventEntity, TaskItem, BudgetItem, GuestItem, SurveyResponse, KanbanStage } from '../types/event';

export interface EventMetrics {
  readinessPercent: number;
  totalTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  criticalOverdueTasksCount: number;
  totalPlannedBudget: number;
  totalActualBudget: number;
  remainingBudget: number;
  budgetOverrunAmount: number;
  isOverTotalLimit: boolean;
  registeredCount: number;
  checkedInCount: number;
  attendanceRate: number;
  costPerAttendee: number;
  averageRating: number;
  surveysCount: number;
}

export function isTaskOverdue(deadline: string, status: string, isCompleted?: boolean): boolean {
  if (status === 'done' || status.endsWith('-done') || isCompleted) return false;
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(deadline);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate.getTime() < today.getTime();
}

export function calculateEventMetrics(
  event?: EventEntity,
  tasks: TaskItem[] = [],
  budget: BudgetItem[] = [],
  guests: GuestItem[] = [],
  surveys: SurveyResponse[] = [],
  stages: KanbanStage[] = []
): EventMetrics {
  if (!event) {
    return {
      readinessPercent: 0,
      totalTasksCount: 0,
      completedTasksCount: 0,
      overdueTasksCount: 0,
      criticalOverdueTasksCount: 0,
      totalPlannedBudget: 0,
      totalActualBudget: 0,
      remainingBudget: 0,
      budgetOverrunAmount: 0,
      isOverTotalLimit: false,
      registeredCount: 0,
      checkedInCount: 0,
      attendanceRate: 0,
      costPerAttendee: 0,
      averageRating: 0,
      surveysCount: 0,
    };
  }

  // Tasks metrics
  const completedStageIds = new Set(stages.filter(s => s.isCompletedStage).map(s => s.id));
  const isTaskCompleted = (t: TaskItem) =>
    t.status === 'done' || t.status.endsWith('-done') || completedStageIds.has(t.status);

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(isTaskCompleted).length;
  const readinessPercent = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  const overdueTasks = tasks.filter(t => !isTaskCompleted(t) && isTaskOverdue(t.deadline, t.status));
  const overdueTasksCount = overdueTasks.length;
  const criticalOverdueTasksCount = overdueTasks.filter(t => t.priority === 'critical').length;

  // Budget metrics
  const totalPlannedBudget = budget.reduce((sum, item) => sum + (Number(item.plannedAmount) || 0), 0);
  const totalActualBudget = budget.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0);
  
  const effectiveLimit = Math.max(event.totalBudgetLimit, totalPlannedBudget);
  const remainingBudget = Math.max(0, effectiveLimit - totalActualBudget);
  const budgetOverrunAmount = totalActualBudget > effectiveLimit
    ? totalActualBudget - effectiveLimit
    : (totalActualBudget > totalPlannedBudget && totalPlannedBudget > 0 ? totalActualBudget - totalPlannedBudget : 0);
  
  const isOverTotalLimit = totalActualBudget > event.totalBudgetLimit || (totalPlannedBudget > 0 && totalActualBudget > totalPlannedBudget);

  // Guests metrics
  const registeredCount = guests.filter(g => g.status !== 'cancelled').length;
  const checkedInCount = guests.filter(g => g.status === 'checked_in').length;
  const attendanceRate = registeredCount > 0
    ? Math.round((checkedInCount / registeredCount) * 100)
    : 0;
  
  const costPerAttendee = registeredCount > 0
    ? Math.round(totalActualBudget / registeredCount)
    : 0;

  // Survey metrics
  const eventSurveys = surveys.filter(s => s.eventId === event.id);
  const surveysCount = eventSurveys.length;
  const averageRating = surveysCount > 0
    ? Number((eventSurveys.reduce((sum, s) => sum + s.rating, 0) / surveysCount).toFixed(1))
    : 0;

  return {
    readinessPercent,
    totalTasksCount,
    completedTasksCount,
    overdueTasksCount,
    criticalOverdueTasksCount,
    totalPlannedBudget,
    totalActualBudget,
    remainingBudget,
    budgetOverrunAmount,
    isOverTotalLimit,
    registeredCount,
    checkedInCount,
    attendanceRate,
    costPerAttendee,
    averageRating,
    surveysCount
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][parseInt(parts[1], 10) - 1];
      const day = parseInt(parts[2], 10);
      return `${day} ${month} ${year}`;
    }
    return new Date(dateStr).toLocaleDateString('ru-RU');
  } catch {
    return dateStr;
  }
}
