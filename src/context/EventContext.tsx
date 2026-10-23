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
  ExpenseCategory
} from '../types/event';
import {
  INITIAL_EVENTS,
  INITIAL_TASKS,
  INITIAL_BUDGET,
  INITIAL_GUESTS,
  INITIAL_TEAM,
  INITIAL_CONTRACTORS,
  INITIAL_SURVEYS
} from '../data/seedData';
import { calculateEventMetrics, EventMetrics } from '../utils/analytics';

const STORAGE_KEY = 'eventtech_store_v2';

interface StoredData {
  events: EventEntity[];
  tasks: TaskItem[];
  budgetItems: BudgetItem[];
  guests: GuestItem[];
  teamMembers: TeamMember[];
  contractors: ContractorItem[];
  surveys: SurveyResponse[];
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
  activeEventId: string;
  activeTab: ActiveTab;
  currentUserRole: UserRole;
  notifications: NotificationToast[];

  // Active Event Context
  activeEvent: EventEntity | undefined;
  activeTasks: TaskItem[];
  activeBudget: BudgetItem[];
  activeGuests: GuestItem[];
  activeTeam: TeamMember[];
  activeContractors: ContractorItem[];
  activeSurveys: SurveyResponse[];
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
  deleteTask: (id: string) => void;
  addTaskComment: (taskId: string, text: string, authorName?: string) => void;

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
  const [activeEventId, setActiveEventId] = useState<string>(initial.activeEventId);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('admin');
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

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
        activeEventId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }, [events, tasks, budgetItems, guests, teamMembers, contractors, surveys, activeEventId]);

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
    setActiveEventId('evt-1');
    setActiveTab('dashboard');
    setCurrentUserRole('admin');
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

  const metrics = useMemo(() => {
    return calculateEventMetrics(activeEvent, activeTasks, activeBudget, activeGuests, activeSurveys);
  }, [activeEvent, activeTasks, activeBudget, activeGuests, activeSurveys]);

  // CRUD Events
  const addEvent = (eventData: Omit<EventEntity, 'id'>): string => {
    const newId = 'evt-' + Date.now().toString(36);
    const newEvent: EventEntity = {
      ...eventData,
      id: newId
    };
    setEvents(prev => [newEvent, ...prev]);
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

  // CRUD Budget
  const addBudgetItem = (itemData: Omit<BudgetItem, 'id'>) => {
    const newId = 'bud-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newItem: BudgetItem = {
      ...itemData,
      id: newId,
      plannedAmount: Math.max(0, Number(itemData.plannedAmount) || 0),
      actualAmount: Math.max(0, Number(itemData.actualAmount) || 0)
    };
    setBudgetItems(prev => [...prev, newItem]);
    
    // Check if added item causes overrun
    if (newItem.actualAmount > newItem.plannedAmount) {
      notify(`Внимание: по статье «${newItem.title}» перерасход на ${(newItem.actualAmount - newItem.plannedAmount).toLocaleString('ru-RU')} ₽!`, 'warning');
    } else {
      notify(`Статья сметы «${newItem.title}» добавлена`, 'success');
    }
  };

  const updateBudgetItem = (item: BudgetItem) => {
    const safeItem: BudgetItem = {
      ...item,
      plannedAmount: Math.max(0, Number(item.plannedAmount) || 0),
      actualAmount: Math.max(0, Number(item.actualAmount) || 0)
    };
    setBudgetItems(prev => prev.map(b => (b.id === safeItem.id ? safeItem : b)));
    
    if (safeItem.actualAmount > safeItem.plannedAmount) {
      notify(`Предупреждение: по статье «${safeItem.title}» зафиксирован перерасход!`, 'warning');
    } else {
      notify('Статья расходов обновлена', 'info');
    }
  };

  const deleteBudgetItem = (id: string) => {
    setBudgetItems(prev => prev.filter(b => b.id !== id));
    notify('Статья бюджета удалена', 'info');
  };

  // CRUD Guests
  const addGuest = (guestData: Omit<GuestItem, 'id' | 'qrCodeToken' | 'registeredAt'>): GuestItem => {
    const guestId = 'gst-' + Date.now().toString(36).slice(-4) + Math.random().toString(36).substring(2, 6);
    const newGuest: GuestItem = {
      ...guestData,
      id: guestId,
      registeredAt: new Date().toISOString(),
      qrCodeToken: `EVT-${guestData.eventId || activeEventId}-${guestId}`
    };

    setGuests(prev => [newGuest, ...prev]);
    notify(`Гость ${newGuest.fullName} успешно зарегистрирован! Сгенерирован билет с QR-кодом.`, 'success');
    return newGuest;
  };

  const updateGuest = (guest: GuestItem) => {
    setGuests(prev => prev.map(g => (g.id === guest.id ? guest : g)));
    notify(`Данные участника ${guest.fullName} обновлены`, 'info');
  };

  const deleteGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
    notify('Участник удален из списка', 'info');
  };

  const checkInGuest = (guestIdOrToken: string): boolean => {
    const query = guestIdOrToken.trim();
    const guest = guests.find(g => g.id === query || g.qrCodeToken.toLowerCase() === query.toLowerCase());

    if (!guest) {
      notify(`Билет с кодом «${guestIdOrToken}» не найден в базе активных регистраций`, 'error');
      return false;
    }

    if (guest.status === 'checked_in') {
      notify(`Участник ${guest.fullName} уже прошел чек-ин ранее!`, 'warning');
      return true;
    }

    if (guest.status === 'cancelled') {
      notify(`Регистрация участника ${guest.fullName} была аннулирована!`, 'error');
      return false;
    }

    setGuests(prev =>
      prev.map(g => (g.id === guest.id ? { ...g, status: 'checked_in' } : g))
    );
    notify(`Успешный чек-ин! ${guest.fullName} (${guest.ticketType}) отмечен на площадке.`, 'success');
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
    notify(`Сотрудник ${newMember.fullName} добавлен в команду организаторов`, 'success');
  };

  const updateTeamMember = (member: TeamMember) => {
    setTeamMembers(prev => prev.map(m => (m.id === member.id ? member : m)));
    notify('Данные члена команды обновлены', 'info');
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    notify('Сотрудник удален из состава команды', 'info');
  };

  const addContractor = (contractorData: Omit<ContractorItem, 'id'>) => {
    const newId = 'cont-' + Date.now().toString(36);
    const newContractor: ContractorItem = {
      ...contractorData,
      id: newId,
      cost: Math.max(0, Number(contractorData.cost) || 0)
    };
    setContractors(prev => [...prev, newContractor]);
    notify(`Подрядчик «${newContractor.companyName}» добавлен в реестр`, 'success');
  };

  const updateContractor = (contractor: ContractorItem) => {
    const safe = { ...contractor, cost: Math.max(0, Number(contractor.cost) || 0) };
    setContractors(prev => prev.map(c => (c.id === safe.id ? safe : c)));
    notify('Карточка подрядчика обновлена', 'info');
  };

  const deleteContractor = (id: string) => {
    setContractors(prev => prev.filter(c => c.id !== id));
    notify('Подрядчик удален из реестра', 'info');
  };

  // CRUD Survey
  const addSurvey = (surveyData: Omit<SurveyResponse, 'id' | 'submittedAt'>) => {
    const newSurvey: SurveyResponse = {
      ...surveyData,
      id: 'srv-' + Date.now().toString(36),
      submittedAt: new Date().toISOString()
    };
    setSurveys(prev => [newSurvey, ...prev]);
    notify('Спасибо! Ваш отзыв о мероприятии успешно сохранен.', 'success');
  };

  // AI batch application
  const applyAiTasks = (tasksList: { title: string; description: string; priority: TaskItem['priority']; deadline: string }[]) => {
    if (!activeEvent) return;
    const teamLeaderId = activeTeam[0]?.id || 'tm-1';
    const newTasks: TaskItem[] = tasksList.map((t, idx) => ({
      id: 'task-ai-' + Date.now().toString(36) + '-' + idx,
      eventId: activeEvent.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      deadline: t.deadline,
      assigneeId: teamLeaderId,
      status: 'todo',
      comments: []
    }));

    setTasks(prev => [...newTasks, ...prev]);
    notify(`ИИ-Ассистент добавил ${newTasks.length} рекомендованных задач в план подготовки!`, 'success');
  };

  const applyAiBudget = (budgetAllocations: { category: ExpenseCategory; amount: number; rationale?: string }[]) => {
    if (!activeEvent) return;
    const newItems: BudgetItem[] = budgetAllocations.map((b, idx) => ({
      id: 'bud-ai-' + Date.now().toString(36) + '-' + idx,
      eventId: activeEvent.id,
      category: b.category,
      title: `Оптимальная статья: ${b.category}`,
      plannedAmount: b.amount,
      actualAmount: 0,
      notes: b.rationale || 'Сформировано интеллектуальным калькулятором сметы'
    }));

    setBudgetItems(prev => [...prev, ...newItems]);
    notify(`Оптимальное распределение бюджета (${budgetAllocations.length} категорий) добавлено в смету!`, 'success');
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
        activeEventId,
        activeTab,
        currentUserRole,
        notifications,
        activeEvent,
        activeTasks,
        activeBudget,
        activeGuests,
        activeTeam,
        activeContractors,
        activeSurveys,
        metrics,
        setActiveEventId,
        setActiveTab,
        setCurrentUserRole,
        notify,
        dismissNotification,
        addEvent,
        updateEvent,
        deleteEvent,
        addTask,
        updateTask,
        deleteTask,
        addTaskComment,
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
