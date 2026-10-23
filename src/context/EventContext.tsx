import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  EventEntity,
  TaskItem,
  BudgetItem,
  GuestItem,
  TeamMember,
  ContractorItem,
  SurveyResponse,
  ActiveTab,
  UserRole,
  NotificationToast,
  ExpenseCategory,
  KanbanStage,
  KanbanStageColor,
  MarketplaceItem,
  BroadcastMessage
} from '../types/event';
import {
  INITIAL_EVENTS,
  INITIAL_TASKS,
  INITIAL_BUDGET,
  INITIAL_GUESTS,
  INITIAL_TEAM,
  INITIAL_CONTRACTORS,
  INITIAL_SURVEYS,
  INITIAL_KANBAN_STAGES,
  INITIAL_MARKETPLACE_ITEMS,
  INITIAL_BROADCASTS
} from '../data/seedData';
import { calculateEventMetrics, EventMetrics } from '../utils/analytics';

const STORAGE_KEY = 'eventtech_store_v4';

interface StoredData {
  events: EventEntity[];
  tasks: TaskItem[];
  budgetItems: BudgetItem[];
  guests: GuestItem[];
  teamMembers: TeamMember[];
  contractors: ContractorItem[];
  surveys: SurveyResponse[];
  kanbanStages: KanbanStage[];
  marketplaceItems: MarketplaceItem[];
  broadcasts: BroadcastMessage[];
  activeEventId: string;
}

interface EventContextType {
  // State
  events: EventEntity[];
  tasks: TaskItem[];
  budgetItems: BudgetItem[];
  guests: GuestItem[];
  teamMembers: TeamMember[];
  contractors: ContractorItem[];
  surveys: SurveyResponse[];
  kanbanStages: KanbanStage[];
  marketplaceItems: MarketplaceItem[];
  broadcasts: BroadcastMessage[];
  activeEventId: string;
  activeTab: ActiveTab;
  currentUserRole: UserRole;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  notifications: NotificationToast[];

  // Modals & Navigation state
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isEventSwitcherOpen: boolean;
  setIsEventSwitcherOpen: (open: boolean) => void;
  selectedTeamMemberFilter: string | null;
  setSelectedTeamMemberFilter: (assigneeId: string | null) => void;

  // Active Event Context
  activeEvent: EventEntity | undefined;
  activeTasks: TaskItem[];
  activeBudget: BudgetItem[];
  activeGuests: GuestItem[];
  activeTeam: TeamMember[];
  activeContractors: ContractorItem[];
  activeSurveys: SurveyResponse[];
  activeKanbanStages: KanbanStage[];
  activeBroadcasts: BroadcastMessage[];
  metrics: EventMetrics;

  // Setters
  setActiveEventId: (id: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setCurrentUserRole: (role: UserRole) => void;

  // Notification helpers
  notify: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  dismissNotification: (id: string) => void;

  // CRUD Event
  addEvent: (eventData: Omit<EventEntity, 'id'>) => string;
  updateEvent: (event: EventEntity) => void;
  deleteEvent: (id: string) => void;

  // CRUD Tasks
  addTask: (taskData: Omit<TaskItem, 'id' | 'comments'>) => void;
  updateTask: (task: TaskItem) => void;
  updateTaskStatus: (taskId: string, newStatus: string) => void;
  deleteTask: (id: string) => void;
  addTaskComment: (taskId: string, text: string, authorName?: string) => void;

  // Kanban Stages
  addKanbanStage: (eventId: string, title: string, color: KanbanStageColor) => void;
  updateKanbanStage: (stageId: string, updates: Partial<KanbanStage>) => void;
  deleteKanbanStage: (stageId: string) => void;
  moveKanbanStage: (stageId: string, direction: 'left' | 'right') => void;

  // Marketplace & Broadcasts
  hireMarketplaceItem: (item: MarketplaceItem) => void;
  sendBroadcast: (broadcastData: Omit<BroadcastMessage, 'id' | 'sentAt'>) => void;

  // CRUD Budget
  addBudgetItem: (itemData: Omit<BudgetItem, 'id'>) => void;
  updateBudgetItem: (item: BudgetItem) => void;
  deleteBudgetItem: (id: string) => void;

  // CRUD Guests
  addGuest: (guestData: Omit<GuestItem, 'id' | 'qrCodeToken' | 'registeredAt'>) => GuestItem;
  updateGuest: (guest: GuestItem) => void;
  deleteGuest: (id: string) => void;
  checkInGuest: (guestIdOrToken: string) => boolean;

  // CRUD Team & Contractors
  addTeamMember: (memberData: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;

  addContractor: (contractorData: Omit<ContractorItem, 'id'>) => void;
  updateContractor: (contractor: ContractorItem) => void;
  deleteContractor: (id: string) => void;

  // CRUD Surveys
  addSurvey: (surveyData: Omit<SurveyResponse, 'id' | 'submittedAt'>) => void;

  // AI Helpers
  applyAiTasks: (tasksList: { title: string; description: string; priority: TaskItem['priority']; deadline: string }[]) => void;
  applyAiBudget: (budgetAllocations: { category: ExpenseCategory; amount: number; rationale?: string }[]) => void;

  // Reset demo
  resetDemoData: () => void;
  resetToSeedData: () => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial data from localStorage with fallback
  const getInitialState = (): StoredData => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.events && Array.isArray(parsed.events) && parsed.events.length > 0) {
          return {
            events: parsed.events,
            tasks: parsed.tasks || [],
            budgetItems: parsed.budgetItems || [],
            guests: parsed.guests || [],
            teamMembers: parsed.teamMembers || [],
            contractors: parsed.contractors || [],
            surveys: parsed.surveys || [],
            kanbanStages: parsed.kanbanStages || INITIAL_KANBAN_STAGES,
            marketplaceItems: parsed.marketplaceItems || INITIAL_MARKETPLACE_ITEMS,
            broadcasts: parsed.broadcasts || INITIAL_BROADCASTS,
            activeEventId: parsed.activeEventId || parsed.events[0]?.id || 'evt-1'
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage data, initializing seed data', e);
    }

    return {
      events: INITIAL_EVENTS,
      tasks: INITIAL_TASKS,
      budgetItems: INITIAL_BUDGET,
      guests: INITIAL_GUESTS,
      teamMembers: INITIAL_TEAM,
      contractors: INITIAL_CONTRACTORS,
      surveys: INITIAL_SURVEYS,
      kanbanStages: INITIAL_KANBAN_STAGES,
      marketplaceItems: INITIAL_MARKETPLACE_ITEMS,
      broadcasts: INITIAL_BROADCASTS,
      activeEventId: 'evt-1'
    };
  };

  const initial = getInitialState();

  const [events, setEvents] = useState<EventEntity[]>(initial.events);
  const [tasks, setTasks] = useState<TaskItem[]>(initial.tasks);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(initial.budgetItems);
  const [guests, setGuests] = useState<GuestItem[]>(initial.guests);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initial.teamMembers);
  const [contractors, setContractors] = useState<ContractorItem[]>(initial.contractors);
  const [surveys, setSurveys] = useState<SurveyResponse[]>(initial.surveys);
  const [kanbanStages, setKanbanStages] = useState<KanbanStage[]>(initial.kanbanStages);
  const [marketplaceItems] = useState<MarketplaceItem[]>(initial.marketplaceItems);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>(initial.broadcasts);
  const [activeEventId, setActiveEventId] = useState<string>(initial.activeEventId);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  // Dark Mode Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('eventtech_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('eventtech_theme', theme);
    } catch {}
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Navigation and cross-tab helpers
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEventSwitcherOpen, setIsEventSwitcherOpen] = useState(false);
  const [selectedTeamMemberFilter, setSelectedTeamMemberFilter] = useState<string | null>(null);

  // Automatically switch tab when guest role is activated
  useEffect(() => {
    if (currentUserRole === 'guest' && (activeTab === 'budget' || activeTab === 'settings' || activeTab === 'team')) {
      setActiveTab('guests');
    }
  }, [currentUserRole, activeTab]);

  // Persist state to localStorage
  useEffect(() => {
    try {
      const dataToSave: StoredData = {
        events,
        tasks,
        budgetItems,
        guests,
        teamMembers,
        contractors,
        surveys,
        kanbanStages,
        marketplaceItems,
        broadcasts,
        activeEventId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [events, tasks, budgetItems, guests, teamMembers, contractors, surveys, kanbanStages, marketplaceItems, broadcasts, activeEventId]);

  // Toast notification helper
  const notify = (message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = 'ntf-' + Math.random().toString(36).substring(2, 9);
    const newToast: NotificationToast = {
      id,
      type,
      message,
      timestamp: Date.now()
    };
    setNotifications(prev => [newToast, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(t => t.id !== id));
  };

  // Reset to seed data
  const resetDemoData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setEvents(INITIAL_EVENTS);
    setTasks(INITIAL_TASKS);
    setBudgetItems(INITIAL_BUDGET);
    setGuests(INITIAL_GUESTS);
    setTeamMembers(INITIAL_TEAM);
    setContractors(INITIAL_CONTRACTORS);
    setSurveys(INITIAL_SURVEYS);
    setKanbanStages(INITIAL_KANBAN_STAGES);
    setBroadcasts(INITIAL_BROADCASTS);
    setActiveEventId('evt-1');
    setActiveTab('dashboard');
    setCurrentUserRole('admin');
    setSelectedTeamMemberFilter(null);
    notify('Демонстрационные данные успешно сброшены к исходному состоянию!', 'success');
  };

  const resetToSeedData = resetDemoData;

  // Active event items
  const activeEvent = useMemo(() => {
    return events.find(e => e.id === activeEventId) || events[0];
  }, [events, activeEventId]);

  const activeTasks = useMemo(() => {
    return tasks.filter(t => t.eventId === activeEvent?.id);
  }, [tasks, activeEvent]);

  const activeBudget = useMemo(() => {
    return budgetItems.filter(b => b.eventId === activeEvent?.id);
  }, [budgetItems, activeEvent]);

  const activeGuests = useMemo(() => {
    return guests.filter(g => g.eventId === activeEvent?.id);
  }, [guests, activeEvent]);

  const activeTeam = useMemo(() => {
    return teamMembers.filter(t => t.eventId === activeEvent?.id);
  }, [teamMembers, activeEvent]);

  const activeContractors = useMemo(() => {
    return contractors.filter(c => c.eventId === activeEvent?.id);
  }, [contractors, activeEvent]);

  const activeSurveys = useMemo(() => {
    return surveys.filter(s => s.eventId === activeEvent?.id);
  }, [surveys, activeEvent]);

  const activeKanbanStages = useMemo(() => {
    const list = kanbanStages.filter(s => s.eventId === activeEvent?.id);
    if (list.length === 0 && activeEvent) {
      // Auto-fallback default stages if not found
      return [
        { id: `stage-${activeEvent.id}-todo`, eventId: activeEvent.id, title: 'К выполнению', color: 'zinc' as const, order: 0 },
        { id: `stage-${activeEvent.id}-in_progress`, eventId: activeEvent.id, title: 'В работе', color: 'amber' as const, order: 1 },
        { id: `stage-${activeEvent.id}-review`, eventId: activeEvent.id, title: 'На проверке', color: 'blue' as const, order: 2 },
        { id: `stage-${activeEvent.id}-done`, eventId: activeEvent.id, title: 'Готово', color: 'emerald' as const, order: 3, isCompletedStage: true }
      ];
    }
    return list.sort((a, b) => a.order - b.order);
  }, [kanbanStages, activeEvent]);

  const activeBroadcasts = useMemo(() => {
    return broadcasts
      .filter(b => b.eventId === activeEvent?.id)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [broadcasts, activeEvent]);

  const metrics = useMemo(() => {
    return calculateEventMetrics(activeEvent, activeTasks, activeBudget, activeGuests, activeSurveys, activeKanbanStages);
  }, [activeEvent, activeTasks, activeBudget, activeGuests, activeSurveys, activeKanbanStages]);

  // CRUD Events
  const addEvent = (eventData: Omit<EventEntity, 'id'>): string => {
    const newId = 'evt-' + Date.now().toString(36);
    const newEvent: EventEntity = {
      ...eventData,
      id: newId
    };
    setEvents(prev => [newEvent, ...prev]);

    // Create default kanban stages for this event
    const defaultStages: KanbanStage[] = [
      { id: `stage-${newId}-todo`, eventId: newId, title: 'К выполнению', color: 'zinc', order: 0 },
      { id: `stage-${newId}-in_progress`, eventId: newId, title: 'В работе', color: 'amber', order: 1 },
      { id: `stage-${newId}-review`, eventId: newId, title: 'На проверке', color: 'blue', order: 2 },
      { id: `stage-${newId}-done`, eventId: newId, title: 'Готово', color: 'emerald', order: 3, isCompletedStage: true }
    ];
    setKanbanStages(prev => [...prev, ...defaultStages]);

    setActiveEventId(newId);
    notify(`Мероприятие «${newEvent.title}» успешно создано!`, 'success');
    return newId;
  };

  const updateEvent = (updated: EventEntity) => {
    setEvents(prev => prev.map(e => (e.id === updated.id ? updated : e)));
    notify(`Параметры мероприятия «${updated.title}» обновлены`, 'success');
  };

  const deleteEvent = (id: string) => {
    const toDelete = events.find(e => e.id === id);
    if (events.length <= 1) {
      notify('Нельзя удалить единственное мероприятие в системе', 'warning');
      return;
    }
    const remaining = events.filter(e => e.id !== id);
    setEvents(remaining);
    if (activeEventId === id) {
      setActiveEventId(remaining[0].id);
    }
    // Clean associated data
    setTasks(prev => prev.filter(t => t.eventId !== id));
    setBudgetItems(prev => prev.filter(b => b.eventId !== id));
    setGuests(prev => prev.filter(g => g.eventId !== id));
    setTeamMembers(prev => prev.filter(tm => tm.eventId !== id));
    setContractors(prev => prev.filter(c => c.eventId !== id));
    setSurveys(prev => prev.filter(s => s.eventId !== id));
    setKanbanStages(prev => prev.filter(s => s.eventId !== id));
    setBroadcasts(prev => prev.filter(b => b.eventId !== id));

    notify(`Мероприятие «${toDelete?.title || id}» удалено`, 'info');
  };

  // CRUD Tasks
  const addTask = (taskData: Omit<TaskItem, 'id' | 'comments'>) => {
    const newId = 'task-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newTask: TaskItem = {
      ...taskData,
      id: newId,
      comments: []
    };
    setTasks(prev => [newTask, ...prev]);
    notify(`Задача «${newTask.title}» добавлена в план`, 'success');
  };

  const updateTask = (task: TaskItem) => {
    setTasks(prev => prev.map(t => (t.id === task.id ? task : t)));
    notify(`Задача обновлена`, 'info');
  };

  const updateTaskStatus = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    notify('Задача удалена', 'info');
  };

  const addTaskComment = (taskId: string, text: string, authorName?: string) => {
    if (!text.trim()) return;
    const commentId = 'comm-' + Date.now().toString(36);
    const author = authorName || (currentUserRole === 'admin' ? 'Администратор' : 'Участник команды');
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            comments: [
              ...t.comments,
              {
                id: commentId,
                authorName: author,
                text: text.trim(),
                createdAt: new Date().toISOString()
              }
            ]
          };
        }
        return t;
      })
    );
    notify('Комментарий к задаче добавлен', 'success');
  };

  // Kanban Stage Handlers
  const addKanbanStage = (eventId: string, title: string, color: KanbanStageColor = 'blue') => {
    const eventStages = kanbanStages.filter(s => s.eventId === eventId);
    const newStage: KanbanStage = {
      id: `stage-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventId,
      title: title.trim() || 'Новый этап',
      color,
      order: eventStages.length,
      isCompletedStage: false
    };
    setKanbanStages(prev => [...prev, newStage]);
    notify(`Этап «${newStage.title}» добавлен`, 'success');
  };

  const updateKanbanStage = (stageId: string, updates: Partial<KanbanStage>) => {
    setKanbanStages(prev => prev.map(s => (s.id === stageId ? { ...s, ...updates } : s)));
  };

  const deleteKanbanStage = (stageId: string) => {
    const stageToDelete = kanbanStages.find(s => s.id === stageId);
    if (!stageToDelete) return;

    const remainingEventStages = kanbanStages
      .filter(s => s.eventId === stageToDelete.eventId && s.id !== stageId)
      .sort((a, b) => a.order - b.order);

    if (remainingEventStages.length === 0) {
      notify('Нельзя удалить единственный оставшийся этап на доске', 'warning');
      return;
    }

    const fallbackStageId = remainingEventStages[0].id;
    // Move tasks from deleted stage to fallbackStageId
    setTasks(prev =>
      prev.map(t => {
        if (t.eventId === stageToDelete.eventId && (t.status === stageId || t.status === stageToDelete.title)) {
          return { ...t, status: fallbackStageId };
        }
        return t;
      })
    );

    setKanbanStages(prev => prev.filter(s => s.id !== stageId));
    notify(`Этап «${stageToDelete.title}» удален, задачи перенесены в «${remainingEventStages[0].title}»`, 'info');
  };

  const moveKanbanStage = (stageId: string, direction: 'left' | 'right') => {
    const currentStage = kanbanStages.find(s => s.id === stageId);
    if (!currentStage) return;

    const eventStages = kanbanStages
      .filter(s => s.eventId === currentStage.eventId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = eventStages.findIndex(s => s.id === stageId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= eventStages.length) return;

    const swapped = [...eventStages];
    const temp = swapped[currentIndex];
    swapped[currentIndex] = swapped[targetIndex];
    swapped[targetIndex] = temp;

    const reorderedIds = swapped.map((s, idx) => ({ id: s.id, order: idx }));
    setKanbanStages(prev =>
      prev.map(s => {
        const match = reorderedIds.find(m => m.id === s.id);
        return match ? { ...s, order: match.order } : s;
      })
    );
  };

  // Marketplace & Broadcasts
  const hireMarketplaceItem = (item: MarketplaceItem) => {
    if (!activeEvent) return;

    // 1. Add contractor
    const newContractor: ContractorItem = {
      id: `cont-${Date.now()}`,
      eventId: activeEvent.id,
      companyName: item.title,
      serviceType: item.serviceType || (item.category === 'venue' ? 'Аренда площадки' : 'Подрядчик'),
      contactPerson: item.contactPerson,
      phone: item.phone,
      email: item.email,
      cost: item.price,
      status: 'contracted'
    };
    setContractors(prev => [...prev, newContractor]);

    // 2. Add budget item
    const newBudget: BudgetItem = {
      id: `bud-${Date.now()}`,
      eventId: activeEvent.id,
      category: item.category === 'venue' ? 'Аренда площадки' : 'Работа подрядчиков',
      title: `${item.title} (${item.serviceType})`,
      plannedAmount: item.price,
      actualAmount: 0,
      contractorId: newContractor.id,
      notes: `Привлечен из Каталога подрядчиков (Рейтинг: ${item.rating} ★, ${item.city})`
    };
    setBudgetItems(prev => [...prev, newBudget]);
    notify(`«${item.title}» привлечен в проект! Создана статья в смете и запись в подрядчиках.`, 'success');
  };

  const sendBroadcast = (data: Omit<BroadcastMessage, 'id' | 'sentAt'>) => {
    const newBroadcast: BroadcastMessage = {
      ...data,
      id: `bc-${Date.now()}`,
      sentAt: new Date().toISOString()
    };
    setBroadcasts(prev => [newBroadcast, ...prev]);
    notify(`Рассылка «${data.title}» успешно отправлена (${data.recipientCount} получателей)`, 'success');
  };

  // CRUD Budget
  const addBudgetItem = (itemData: Omit<BudgetItem, 'id'>) => {
    const newId = 'bud-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newItem: BudgetItem = {
      ...itemData,
      id: newId,
      plannedAmount: Math.max(0, Number(itemData.plannedAmount) || 0),
      actualAmount: Math.max(0, Number(itemData.actualAmount) || 0)
    };
    setBudgetItems(prev => [newItem, ...prev]);
    notify(`Статья сметы «${newItem.title}» добавлена`, 'success');
  };

  const updateBudgetItem = (item: BudgetItem) => {
    setBudgetItems(prev => prev.map(b => (b.id === item.id ? item : b)));
    notify(`Статья сметы обновлена`, 'info');
  };

  const deleteBudgetItem = (id: string) => {
    setBudgetItems(prev => prev.filter(b => b.id !== id));
    notify('Статья сметы удалена', 'info');
  };

  // CRUD Guests
  const addGuest = (guestData: Omit<GuestItem, 'id' | 'qrCodeToken' | 'registeredAt'>): GuestItem => {
    const newId = 'gst-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newGuest: GuestItem = {
      ...guestData,
      id: newId,
      registeredAt: new Date().toISOString(),
      qrCodeToken: `EVT-${guestData.eventId}-${newId}`
    };
    setGuests(prev => [newGuest, ...prev]);
    notify(`Участник ${newGuest.fullName} успешно зарегистрирован! Билет сгенерирован.`, 'success');
    return newGuest;
  };

  const updateGuest = (guest: GuestItem) => {
    setGuests(prev => prev.map(g => (g.id === guest.id ? guest : g)));
    notify(`Данные гостя обновлены`, 'info');
  };

  const deleteGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
    notify('Запись участника удалена', 'info');
  };

  const checkInGuest = (guestIdOrToken: string): boolean => {
    const target = guests.find(g => g.id === guestIdOrToken || g.qrCodeToken === guestIdOrToken);
    if (!target) {
      notify('QR-код или билет участника не найден в базе!', 'error');
      return false;
    }
    if (target.status === 'checked_in') {
      notify(`Участник «${target.fullName}» уже прошел чек-ин ранее!`, 'warning');
      return true;
    }
    setGuests(prev =>
      prev.map(g => (g.id === target.id ? { ...g, status: 'checked_in' } : g))
    );
    notify(`Чек-ин успешно подтвержден: ${target.fullName} (${target.ticketType})`, 'success');
    return true;
  };

  // CRUD Team & Contractors
  const addTeamMember = (memberData: Omit<TeamMember, 'id'>) => {
    const newId = 'tm-' + Date.now().toString(36);
    const newMember: TeamMember = {
      ...memberData,
      id: newId
    };
    setTeamMembers(prev => [...prev, newMember]);
    notify(`Сотрудник ${newMember.fullName} добавлен в оргкомитет`, 'success');
  };

  const updateTeamMember = (member: TeamMember) => {
    setTeamMembers(prev => prev.map(tm => (tm.id === member.id ? member : tm)));
    notify('Данные сотрудника обновлены', 'info');
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(tm => tm.id !== id));
    notify('Сотрудник удален из оргкомитета', 'info');
  };

  const addContractor = (contractorData: Omit<ContractorItem, 'id'>) => {
    const newId = 'cont-' + Date.now().toString(36);
    const newContractor: ContractorItem = {
      ...contractorData,
      id: newId
    };
    setContractors(prev => [...prev, newContractor]);
    notify(`Подрядчик «${newContractor.companyName}» добавлен`, 'success');
  };

  const updateContractor = (contractor: ContractorItem) => {
    setContractors(prev => prev.map(c => (c.id === contractor.id ? contractor : c)));
    notify('Карточка подрядчика обновлена', 'info');
  };

  const deleteContractor = (id: string) => {
    setContractors(prev => prev.filter(c => c.id !== id));
    notify('Подрядчик удален', 'info');
  };

  // CRUD Surveys
  const addSurvey = (surveyData: Omit<SurveyResponse, 'id' | 'submittedAt'>) => {
    const newId = 'srv-' + Date.now().toString(36);
    const newSurvey: SurveyResponse = {
      ...surveyData,
      id: newId,
      submittedAt: new Date().toISOString()
    };
    setSurveys(prev => [newSurvey, ...prev]);
    notify('Спасибо! Ваш отзыв о мероприятии сохранен.', 'success');
  };

  // AI Helpers
  const applyAiTasks = (tasksList: { title: string; description: string; priority: TaskItem['priority']; deadline: string }[]) => {
    if (!activeEvent) return;
    const defaultStageId = activeKanbanStages[0]?.id || `stage-${activeEvent.id}-todo`;
    const newTasks: TaskItem[] = tasksList.map((t, idx) => ({
      id: 'task-ai-' + Date.now().toString(36) + idx,
      eventId: activeEvent.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: defaultStageId,
      deadline: t.deadline,
      assigneeId: activeTeam[0]?.id || 'tm-1',
      comments: []
    }));
    setTasks(prev => [...newTasks, ...prev]);
    notify(`Импортировано ${newTasks.length} задач в план работ!`, 'success');
  };

  const applyAiBudget = (budgetAllocations: { category: ExpenseCategory; amount: number; rationale?: string }[]) => {
    if (!activeEvent) return;
    const newItems: BudgetItem[] = budgetAllocations.map((b, idx) => ({
      id: 'bud-ai-' + Date.now().toString(36) + idx,
      eventId: activeEvent.id,
      category: b.category,
      title: `Норматив: ${b.category}`,
      plannedAmount: Math.round(b.amount),
      actualAmount: 0,
      notes: b.rationale || 'Сформировано по отраслевым стандартам'
    }));

    setBudgetItems(prev => [
      ...prev.filter(item => item.eventId !== activeEvent.id),
      ...newItems
    ]);
    notify(`Смета обновлена (${newItems.length} категорий на сумму ${activeEvent.totalBudgetLimit.toLocaleString('ru-RU')} ₽)`, 'success');
  };

  return (
    <EventContext.Provider
      value={{
        events,
        tasks,
        budgetItems,
        guests,
        teamMembers,
        contractors,
        surveys,
        kanbanStages,
        marketplaceItems,
        broadcasts,
        activeEventId,
        activeTab,
        currentUserRole,
        notifications,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isEventSwitcherOpen,
        setIsEventSwitcherOpen,
        selectedTeamMemberFilter,
        setSelectedTeamMemberFilter,
        activeEvent,
        activeTasks,
        activeBudget,
        activeGuests,
        activeTeam,
        activeContractors,
        activeSurveys,
        activeKanbanStages,
        activeBroadcasts,
        metrics,
        setActiveEventId,
        setActiveTab,
        setCurrentUserRole,
        theme,
        toggleTheme,
        notify,
        dismissNotification,
        addEvent,
        updateEvent,
        deleteEvent,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        addTaskComment,
        addKanbanStage,
        updateKanbanStage,
        deleteKanbanStage,
        moveKanbanStage,
        hireMarketplaceItem,
        sendBroadcast,
        addBudgetItem,
        updateBudgetItem,
        deleteBudgetItem,
        addGuest,
        updateGuest,
        deleteGuest,
        checkInGuest,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        addContractor,
        updateContractor,
        deleteContractor,
        addSurvey,
        applyAiTasks,
        applyAiBudget,
        resetDemoData,
        resetToSeedData
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEventContext = () => {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return ctx;
};
