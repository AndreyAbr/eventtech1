export type UserRole = 'organizer' | 'admin' | 'team' | 'guest';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole; // 'organizer' (Администратор), 'team' (Команда), 'guest' (Гость/Участник)
  position: string; // Должность / организация
  phone?: string;
  avatarInitials: string;
  createdAt: string;
  isSystemDefault?: boolean;
}

export type EventType = 'Конференция' | 'Хакатон' | 'Корпоратив' | 'Форум' | 'Воркшоп' | 'Выставка';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = string;

export type KanbanStageColor = 'zinc' | 'blue' | 'amber' | 'emerald' | 'purple' | 'rose';

export interface KanbanStage {
  id: string;
  eventId: string;
  title: string;
  color: KanbanStageColor;
  order: number;
  isCompletedStage?: boolean;
}

export interface MarketplaceItem {
  id: string;
  category: 'venue' | 'contractor';
  serviceType: string;
  title: string;
  description: string;
  rating: number;
  reviewsCount: number;
  capacity?: number;
  price: number;
  city: string;
  format: string;
  tags: string[];
  contactPerson: string;
  phone: string;
  email: string;
}

export interface BroadcastMessage {
  id: string;
  eventId: string;
  title: string;
  message: string;
  audience: 'all' | 'confirmed' | 'vip' | 'checked_in';
  sentAt: string;
  recipientCount: number;
}

export type ExpenseCategory =
  | 'Аренда площадки'
  | 'Кейтеринг'
  | 'Оборудование'
  | 'Транспорт и проживание'
  | 'Полиграфия и мерч'
  | 'Маркетинг и реклама'
  | 'Работа подрядчиков'
  | 'Прочее';

export type GuestStatus = 'registered' | 'confirmed' | 'checked_in' | 'cancelled';

export type ContractorStatus = 'negotiation' | 'contracted' | 'paid' | 'completed';

export interface TaskComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string; // ISO string
}

export interface TaskItem {
  id: string;
  eventId: string;
  title: string;
  description: string;
  assigneeId: string;
  deadline: string; // YYYY-MM-DD
  priority: TaskPriority;
  status: TaskStatus;
  comments: TaskComment[];
}

export interface BudgetItem {
  id: string;
  eventId: string;
  category: ExpenseCategory;
  title: string;
  plannedAmount: number; // в рублях (₽)
  actualAmount: number;  // в рублях (₽)
  contractorId?: string;
  notes: string;
}

export interface GuestItem {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  ticketType: 'Стандарт' | 'VIP' | 'Спикер' | 'Пресса';
  status: GuestStatus;
  registeredAt: string; // ISO string
  qrCodeToken: string;  // Уникальная строка вида EVT-{eventId}-{guestId}
  dietaryNotes?: string;
}

export interface TeamMember {
  id: string;
  eventId: string;
  fullName: string;
  roleTitle: string; // например, "Технический директор", "Координатор волонтеров"
  zoneOfResponsibility: string;
  email: string;
  phone: string;
  systemRole: 'admin' | 'team';
}

export interface ContractorItem {
  id: string;
  eventId: string;
  companyName: string;
  serviceType: string;
  contactPerson: string;
  phone: string;
  email: string;
  cost: number;
  status: ContractorStatus;
}

export interface SurveyResponse {
  id: string;
  eventId: string;
  guestName: string;
  rating: number; // 1 to 5
  feedback: string;
  submittedAt: string;
}

export interface EventEntity {
  id: string;
  title: string;
  type: EventType;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  location: string;  // Физический адрес или ссылка на онлайн-площадку
  isOnline: boolean;
  description: string;
  goals: string;
  plannedHeadcount: number;
  totalBudgetLimit: number;
  leadOrganizer: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'settings'
  | 'tasks'
  | 'budget'
  | 'guests'
  | 'team'
  | 'calendar'
  | 'ai_assistant'
  | 'admin_panel';

export type NavigationTab = ActiveTab;

export interface NotificationToast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export interface SysConfigItem {
  key: string;
  value: string;
  label: string;
  type: 'string' | 'boolean' | 'number' | 'select';
  groupName: string;
  options?: string[];
}

export interface SysCatalogItem {
  id: string;
  catalogType: 'budget_categories' | 'event_types' | 'ticket_categories' | string;
  code: string;
  name: string;
  color: string;
  sortOrder: number;
  isProtected?: boolean;
}

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  metadataObject: string;
  details: string;
}

export interface TableStat {
  tableName: string;
  rowCount: number;
}

export interface SqlExecutionResult {
  columns: string[];
  rows: any[];
  changes?: number;
  executionTimeMs: number;
  error?: string;
}

