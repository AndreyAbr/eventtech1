import {
  EventEntity,
  TaskItem,
  BudgetItem,
  ExpenseCategory,
  TaskPriority
} from '../types/event';
import { isTaskOverdue } from './analytics';

export interface GeneratedTask {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  daysBeforeStart: number;
  deadlineDate: string;
}

export interface GeneratedBudgetDistribution {
  category: ExpenseCategory;
  percentage: number;
  amount: number;
  rationale: string;
}

export interface RiskItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  stage: string;
  description: string;
}

export interface EventBlueprint {
  eventId: string;
  summary: string;
  recommendedTasks: GeneratedTask[];
  recommendedBudget: GeneratedBudgetDistribution[];
  detectedRisks: RiskItem[];
  eventSchedule: ScheduleItem[];
}

function calculateOffsetDate(baseDateStr: string, offsetDays: number): string {
  const base = new Date(baseDateStr);
  if (isNaN(base.getTime())) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }
  const target = new Date(base);
  target.setDate(target.getDate() + offsetDays);
  return target.toISOString().split('T')[0];
}

export function generateEventBlueprint(
  event: EventEntity,
  currentTasks: TaskItem[] = [],
  currentBudget: BudgetItem[] = [],
  registeredCount: number = 0
): EventBlueprint {
  const eventDate = event.startDate || new Date().toISOString().split('T')[0];
  const budgetLimit = Math.max(100000, Number(event.totalBudgetLimit) || 1000000);
  const plannedGuests = Math.max(10, Number(event.plannedHeadcount) || 100);

  // 1. Task generation based on event type
  const recommendedTasks: GeneratedTask[] = [];

  if (event.type === 'Хакатон') {
    recommendedTasks.push(
      {
        title: 'Утверждение треков хакатона и технических заданий для кейсодержателей',
        description: 'Сформировать 3-4 практических кейса с датасетами и критериями оценки MVP.',
        category: 'Программа',
        priority: 'critical',
        daysBeforeStart: -20,
        deadlineDate: calculateOffsetDate(eventDate, -20)
      },
      {
        title: 'Тестирование высокоскоростной локальной сети и резервного LTE-канала',
        description: 'Проверить пропускную способность для одновременной работы сотен ноутбуков и докеров.',
        category: 'Техническая часть',
        priority: 'high',
        daysBeforeStart: -7,
        deadlineDate: calculateOffsetDate(eventDate, -7)
      },
      {
        title: 'Организация круглосуточного питания, ночных кофе-поинтов и энергетиков',
        description: 'Договориться о графике подачи горячих блюд и пицц во время ночного кодинга.',
        category: 'Кейтеринг',
        priority: 'high',
        daysBeforeStart: -5,
        deadlineDate: calculateOffsetDate(eventDate, -5)
      },
      {
        title: 'Брифинг менторов и настройка платформы онлайн-оценки проектов',
        description: 'Провести обучающий созвон с менторами треков, протестировать личные кабинеты жюри.',
        category: 'Жюри и менторы',
        priority: 'medium',
        daysBeforeStart: -2,
        deadlineDate: calculateOffsetDate(eventDate, -2)
      },
      {
        title: 'Печать дипломов победителей, чеков призового фонда и брендированных подарков',
        description: 'Заготовить именные наградные сертификаты и кубки для топ-3 команд каждого направления.',
        category: 'Мерч и награды',
        priority: 'medium',
        daysBeforeStart: -1,
        deadlineDate: calculateOffsetDate(eventDate, -1)
      }
    );
  } else if (event.type === 'Конференция' || event.type === 'Форум') {
    recommendedTasks.push(
      {
        title: 'Финальный прогон презентаций ключевых спикеров (Keynote)',
        description: 'Проверить тайминги докладов, шрифт слайдов и работу кликеров на главной сцене.',
        category: 'Программа',
        priority: 'critical',
        daysBeforeStart: -3,
        deadlineDate: calculateOffsetDate(eventDate, -3)
      },
      {
        title: 'Настройка синхронного перевода и радиомикрофонов в секционных залах',
        description: 'Оборудовать кабины переводчиков и провести аудиотрансляцию в гарнитуры.',
        category: 'Техника',
        priority: 'high',
        daysBeforeStart: -4,
        deadlineDate: calculateOffsetDate(eventDate, -4)
      },
      {
        title: 'Рассылка электронных билетов и напоминаний о локации и парковке',
        description: 'Отправить пуш-уведомления и email всем зарегистрированным делегатам с их QR-кодами.',
        category: 'Коммуникации',
        priority: 'high',
        daysBeforeStart: -2,
        deadlineDate: calculateOffsetDate(eventDate, -2)
      },
      {
        title: 'Координация зоны выставки спонсоров и партнеров (Expo Zone)',
        description: 'Согласовать схему застройки стендов, подводку электричества и допуск монтажников.',
        category: 'Партнеры',
        priority: 'medium',
        daysBeforeStart: -6,
        deadlineDate: calculateOffsetDate(eventDate, -6)
      }
    );
  } else {
    // Воркшоп, Корпоратив, Выставка
    recommendedTasks.push(
      {
        title: 'Утверждение сценария интерактивной части и тимбилдинг-механик',
        description: 'Согласовать тайминг с ведущим, диджеем и модераторами рабочих групп.',
        category: 'Контент',
        priority: 'high',
        daysBeforeStart: -10,
        deadlineDate: calculateOffsetDate(eventDate, -10)
      },
      {
        title: 'Заказ праздничного банкета/фуршета с учетом персональных предпочтений',
        description: 'Утвердить винную карту, горячие закуски и детское/вегетарианское меню.',
        category: 'Кейтеринг',
        priority: 'high',
        daysBeforeStart: -7,
        deadlineDate: calculateOffsetDate(eventDate, -7)
      },
      {
        title: 'Организация трансфера участников и бронирование номеров в отеле',
        description: 'Согласовать подачу комфортабельных автобусов от офиса и списки расселения.',
        category: 'Логистика',
        priority: 'medium',
        daysBeforeStart: -4,
        deadlineDate: calculateOffsetDate(eventDate, -4)
      },
      {
        title: 'Подготовка памятных корпоративных подарков и фотозоны',
        description: 'Монтаж брендированного пресс-волла и подготовка подарков сотрудникам.',
        category: 'Мерч',
        priority: 'low',
        daysBeforeStart: -2,
        deadlineDate: calculateOffsetDate(eventDate, -2)
      }
    );
  }

  // 2. Budget distribution percentages tailored to event type
  let distributionTemplate: { category: ExpenseCategory; pct: number; rationale: string }[] = [];

  if (event.type === 'Хакатон') {
    distributionTemplate = [
      { category: 'Кейтеринг', pct: 28, rationale: 'Круглосуточное сытное питание и кофе-поинты для высокой продуктивности разработчиков' },
      { category: 'Оборудование', pct: 24, rationale: 'Мощный сетевой интернет-канал, Wi-Fi 6, свет, звук и экраны для демо-дня' },
      { category: 'Аренда площадки', pct: 22, rationale: 'Круглосуточный коворкинг и зал для презентаций на 48 часов' },
      { category: 'Полиграфия и мерч', pct: 12, rationale: 'Брендированные худи, бейджи, стикеры и призовые кубки' },
      { category: 'Маркетинг и реклама', pct: 8, rationale: 'Таргетинг по ИТ-сообществам и привлечение сильных команд' },
      { category: 'Работа подрядчиков', pct: 6, rationale: 'Фото- и видеосъемка демо-дня, работа технического саппорта' }
    ];
  } else if (event.type === 'Конференция' || event.type === 'Форум') {
    distributionTemplate = [
      { category: 'Аренда площадки', pct: 32, rationale: 'Престижный конгресс-холл с несколькими параллельными залами' },
      { category: 'Оборудование', pct: 22, rationale: 'Светодиодные экраны высокого разрешения, сценический звук, онлайн-стрим' },
      { category: 'Кейтеринг', pct: 20, rationale: 'Приветственный кофе, два кофе-брейка и деловой обед' },
      { category: 'Маркетинг и реклама', pct: 12, rationale: 'Продажи билетов, PR в СМИ и контекстная реклама' },
      { category: 'Полиграфия и мерч', pct: 8, rationale: 'Программы конференции, бейджи, папки участников' },
      { category: 'Работа подрядчиков', pct: 6, rationale: 'Модераторы секций, синхронисты, координаторы' }
    ];
  } else {
    distributionTemplate = [
      { category: 'Кейтеринг', pct: 35, rationale: 'Праздничный банкет, десерты, обслуживание официантами' },
      { category: 'Аренда площадки', pct: 25, rationale: 'Банкетный зал отеля или загородная площадка' },
      { category: 'Работа подрядчиков', pct: 18, rationale: 'Профессиональный ведущий, кавер-группа, фото- и видеограф' },
      { category: 'Оборудование', pct: 10, rationale: 'Сценическое освещение для танцпола и звуковой комплект' },
      { category: 'Транспорт и проживание', pct: 7, rationale: 'Трансфер гостей и расселение спикеров' },
      { category: 'Полиграфия и мерч', pct: 5, rationale: 'Призы для конкурсов и памятные подарки' }
    ];
  }

  const recommendedBudget: GeneratedBudgetDistribution[] = distributionTemplate.map(item => ({
    category: item.category,
    percentage: item.pct,
    amount: Math.round((budgetLimit * item.pct) / 100),
    rationale: item.rationale
  }));

  // 3. Intelligent Risk Audit
  const detectedRisks: RiskItem[] = [];

  // Risk: Overdue tasks
  const overdueTasks = currentTasks.filter(t => isTaskOverdue(t.deadline, t.status));
  if (overdueTasks.length > 0) {
    const criticals = overdueTasks.filter(t => t.priority === 'critical');
    detectedRisks.push({
      id: 'risk-overdue',
      severity: criticals.length > 0 ? 'critical' : 'high',
      title: `Обнаружено ${overdueTasks.length} просроченных задач (${criticals.length} критических)`,
      description: `Задачи «${overdueTasks.slice(0, 2).map(t => t.title).join('», «')}» имеют прошедший дедлайн и не переведены в статус «Готово».`,
      recommendation: 'Срочно перераспределите ресурсы команды или актуализируйте дедлайны в плане подготовки во избежание срыва мероприятия.'
    });
  }

  // Risk: Budget overrun
  const totalActual = currentBudget.reduce((sum, b) => sum + (Number(b.actualAmount) || 0), 0);
  const totalPlanned = currentBudget.reduce((sum, b) => sum + (Number(b.plannedAmount) || 0), 0);

  if (totalActual > budgetLimit) {
    detectedRisks.push({
      id: 'risk-budget-limit',
      severity: 'critical',
      title: 'Превышен общий лимит бюджета мероприятия',
      description: `Фактические расходы (${totalActual.toLocaleString('ru-RU')} ₽) превышают установленный лимит (${budgetLimit.toLocaleString('ru-RU')} ₽) на ${(totalActual - budgetLimit).toLocaleString('ru-RU')} ₽.`,
      recommendation: 'Проведите ревизию второстепенных статей (мерч, полиграфия, реклама) или запросите согласование дополнительного транша у заказчика.'
    });
  } else if (totalActual > totalPlanned && totalPlanned > 0) {
    detectedRisks.push({
      id: 'risk-budget-overrun',
      severity: 'high',
      title: 'Фактические расходы превышают плановую смету',
      description: `Сумма фактических затрат превысила план на ${(totalActual - totalPlanned).toLocaleString('ru-RU')} ₽.`,
      recommendation: 'Проверьте отдельные статьи с перерасходом (например, кейтеринг) и оптимизируйте оставшиеся закупки.'
    });
  }

  // Risk: Low guest registration
  if (plannedGuests > 0 && registeredCount < plannedGuests * 0.4) {
    detectedRisks.push({
      id: 'risk-low-attendance',
      severity: 'high',
      title: 'Низкий процент регистрации участников',
      description: `Зарегистрировано только ${registeredCount} из запланированных ${plannedGuests} участников (${Math.round((registeredCount / plannedGuests) * 100)}%).`,
      recommendation: 'Активируйте дополнительные каналы маркетинга: контекстная реклама, таргетинг в соцсетях, партнерские рассылки и напоминания.'
    });
  }

  // Risk: Days remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(eventDate);
  targetDate.setHours(0, 0, 0, 0);
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

  if (daysRemaining > 0 && daysRemaining <= 7) {
    detectedRisks.push({
      id: 'risk-time-pressure',
      severity: 'medium',
      title: `До мероприятия осталось всего ${daysRemaining} дн. (Финальный спринт)`,
      description: 'Мероприятие приближается, наступает фаза окончательного монтажа и чек-листов готовности площадки.',
      recommendation: 'Проведите генеральную репетицию, подтвердите списки въезда техники и проведите инструктаж волонтеров на объекте.'
    });
  }

  // If no risks found, add a positive status
  if (detectedRisks.length === 0) {
    detectedRisks.push({
      id: 'risk-all-clear',
      severity: 'low',
      title: 'Критических рисков не зафиксировано',
      description: 'Все ключевые показатели подготовки (дедлайны, бюджетные лимиты и динамика регистраций) находятся в зеленой зоне.',
      recommendation: 'Продолжайте регулярный мониторинг статусов задач и контроль чек-ина участников.'
    });
  }

  // 4. Hourly Agenda Schedule
  const eventSchedule: ScheduleItem[] = [
    {
      time: '09:00 – 10:00',
      title: 'Регистрация участников и утренний кофе-брейк',
      stage: 'Входная группа & Зона фойе',
      description: 'Встреча гостей, экспресс-сканирование QR-билетов, выдача бейджей и стартовых пакетов участника.'
    },
    {
      time: '10:00 – 10:45',
      title: 'Торжественное открытие и пленарная сессия',
      stage: 'Главный зал (Main Stage)',
      description: 'Приветственное слово организаторов, презентация регламента, представление членов жюри и менторов.'
    },
    {
      time: '11:00 – 13:30',
      title: 'Старт основной программы / Первый рабочий блок',
      stage: 'Секционные залы & Коворкинг',
      description: 'Формирование команд, питчинг идей, распределение задач и первая менторская сессия с экспертами индустрии.'
    },
    {
      time: '13:30 – 14:30',
      title: 'Обеденный перерыв и нетворкинг',
      stage: 'Кейтеринг-зона',
      description: 'Горячий бизнес-ланч, свободное общение, выставка партнеров и демо-зоны.'
    },
    {
      time: '14:30 – 17:30',
      title: 'Второй блок программы / Мастер-классы и воркшопы',
      stage: 'Зал А / Зал Б',
      description: 'Интенсивная практическая работа, чек-поинты готовности прототипов и консультации технических специалистов.'
    },
    {
      time: '17:30 – 19:00',
      title: 'Финальные питчи и защита проектов перед жюри',
      stage: 'Главный зал (Main Stage)',
      description: 'Регламент: 3 минуты на демонстрацию работающего решения + 2 минуты на ответы на вопросы жюри.'
    },
    {
      time: '19:15 – 20:30',
      title: 'Награждение победителей и вечерний фуршет',
      stage: 'Лаундж-зона',
      description: 'Объявление призеров, вручение кубков и грантов, нетворкинг и закрытие официальной части.'
    }
  ];

  return {
    eventId: event.id,
    summary: `План подготовки и контрольные показатели для «${event.title}» (${event.type}, ${plannedGuests} участников, лимит бюджета: ${budgetLimit.toLocaleString('ru-RU')} ₽).`,
    recommendedTasks,
    recommendedBudget,
    detectedRisks,
    eventSchedule
  };
}
