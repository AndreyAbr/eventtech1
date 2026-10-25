import {
  EventEntity,
  TaskItem,
  BudgetItem,
  ExpenseCategory,
  TaskPriority
} from '../types/event';
import { isTaskOverdue, pluralizeRu } from './analytics';

export interface GeneratedTask {
  id?: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  daysBeforeStart: number;
  deadlineDate: string;
  source?: 'base' | 'module' | 'custom';
  moduleId?: string;
  moduleName?: string;
}

export interface GeneratedBudgetDistribution {
  id?: string;
  title: string;
  category: ExpenseCategory;
  percentage: number;
  amount: number;
  rationale: string;
  source?: 'base' | 'module' | 'custom';
  moduleId?: string;
  moduleName?: string;
}

export interface RiskItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  actionText?: string;
  actionTab?: 'tasks' | 'budget' | 'team' | 'guests';
}

export interface ScheduleItem {
  time: string;
  title: string;
  stage: string;
  description: string;
  moduleId?: string;
  moduleName?: string;
}

export interface CustomRequirement {
  id: string;
  title: string;
  category: ExpenseCategory;
}

export interface EventModuleDefinition {
  id: string;
  name: string;
  shortDesc: string;
  badge: string;
  task: {
    title: string;
    description: string;
    category: string;
    priority: TaskPriority;
    daysBeforeStart: number;
  };
  budget: {
    title: string;
    category: ExpenseCategory;
    percentage: number;
    rationale: string;
  };
  schedule: {
    time: string;
    title: string;
    stage: string;
    description: string;
  };
}

export const EVENT_MODULES: EventModuleDefinition[] = [
  {
    id: 'online_stream',
    name: 'Онлайн-трансляция и запись',
    shortDesc: 'ПТС, стрим-сервер, камеры и резервный интернет-канал',
    badge: 'Стрим',
    task: {
      title: 'Настройка ПТС, камер, звукового пульта и тестирование резервного интернет-канала для стрима',
      description: 'Подготовка оборудования видеопроизводства, тест видеосигнала и резервного LTE/оптоволоконного канала связи.',
      category: 'Оборудование',
      priority: 'high',
      daysBeforeStart: -5
    },
    budget: {
      title: 'Видеопродакшн и онлайн-трансляция',
      category: 'Оборудование',
      percentage: 12,
      rationale: 'Оборудование ПТС, аренда видеокамер 4K, работа режиссера трансляции и инженера стриминга.'
    },
    schedule: {
      time: '10:00 – 19:00',
      title: 'Прямой эфир и запись сессий',
      stage: 'Студия стрима & Главный зал',
      description: 'Вещание ключевых спикеров в прямом эфире, захват презентаций и синхронная запись в облако.'
    }
  },
  {
    id: 'open_air',
    name: 'Уличная площадка / Open-Air',
    shortDesc: 'Погодные шатры, автономные дизель-генераторы и согласования',
    badge: 'Open-Air',
    task: {
      title: 'Аренда и монтаж погодных шатров, дизель-генераторов и согласование территории с городом',
      description: 'Согласование уличного размещения с администрацией города, монтаж всепогодных тентовых конструкций и подключение дизель-генераторов.',
      category: 'Площадка',
      priority: 'critical',
      daysBeforeStart: -10
    },
    budget: {
      title: 'Застройка шатров и энергоснабжение',
      category: 'Аренда площадки',
      percentage: 18,
      rationale: 'Аренда тентовых шатров, монтаж настилов, аренда генераторов и топливо для автономного электроснабжения.'
    },
    schedule: {
      time: '07:30 – 09:00',
      title: 'Инженерная приемка уличных конструкций',
      stage: 'Открытая площадка',
      description: 'Тестирование резервных дизель-генераторов, проверка натяжения тентов, заземления и путей эвакуации.'
    }
  },
  {
    id: 'security_vip',
    name: 'ЧОП, рамки и VIP-протокол',
    shortDesc: 'Лицензированная охрана, металлодетекторы, парковка и скорая',
    badge: 'Безопасность',
    task: {
      title: 'Договор с ЧОП, установка рамок металлоискателей, списки авто на парковку и дежурство скорой',
      description: 'Заключение договора с лицензированным ЧОП, организация рамочного контроля, подача списков парковки и дежурство скорой помощи.',
      category: 'Безопасность',
      priority: 'critical',
      daysBeforeStart: -7
    },
    budget: {
      title: 'Охрана, контроль доступа и дежурство медиков',
      category: 'Прочее',
      percentage: 8,
      rationale: 'Посты лицензированного ЧОП, аренда арочных металлодетекторов, дежурство бригады скорой помощи.'
    },
    schedule: {
      time: '08:30 – 09:00',
      title: 'Брифинг ЧОП и службы безопасности',
      stage: 'Входная группа & КПП',
      description: 'Сверка списков VIP-гостей и автотранспорта, проверка раций и регламента действий при внештатных ситуациях.'
    }
  },
  {
    id: 'expo_stands',
    name: 'Выставочная зона и стенды партнёров',
    shortDesc: 'Застройка экспо-зоны, ночной монтаж и навигация',
    badge: 'Экспо',
    task: {
      title: 'Сбор макетов застройки экспо-стендов от партнёров и график ночного монтажа',
      description: 'Согласование техпроектов застройки стендов, подводка электричества и утверждение графика ночной застройки экспозиции.',
      category: 'Подрядчики',
      priority: 'high',
      daysBeforeStart: -8
    },
    budget: {
      title: 'Застройка экспо-зоны и навигационные конструкции',
      category: 'Оборудование',
      percentage: 15,
      rationale: 'Конструкции стандартной и индивидуальной застройки стендов, подвесы, выставочная навигация.'
    },
    schedule: {
      time: '12:00 – 13:30',
      title: 'Партнерский обход экспо-зоны',
      stage: 'Экспо-холл',
      description: 'Презентация стендов партнеров, работа промо-персонала и сбор лидов участников.'
    }
  },
  {
    id: 'speakers_travel',
    name: 'Трансфер и проживание спикеров/экспертов',
    shortDesc: 'Бронь авиа/жд билетов, отели 4-5*, трансфер и VIP-лаундж',
    badge: 'Спикеры',
    task: {
      title: 'Бронирование авиа/жд билетов, гостиницы и организация трансфера для иногородних спикеров',
      description: 'Выкуп билетов, бронирование отелей 4-5*, логистика трансферов из аэропорта и координация тайминга прибытия спикеров.',
      category: 'Логистика',
      priority: 'medium',
      daysBeforeStart: -12
    },
    budget: {
      title: 'Логистика, билеты и проживание спикеров',
      category: 'Транспорт и проживание',
      percentage: 10,
      rationale: 'Авиабилеты, комфортное проживание спикеров в отеле рядом с площадкой и представительские трансферы.'
    },
    schedule: {
      time: '09:00 – 09:45',
      title: 'Встреча и брифинг спикеров в VIP-лаундже',
      stage: 'Спикерская комната',
      description: 'Проверка презентаций на управляющем ноутбуке сцены, выдача гарнитур, кликеров и согласование тайминга выступлений.'
    }
  },
  {
    id: 'awards_prizes',
    name: 'Награждение, кубки и дипломы',
    shortDesc: 'Призовые стелы, памятные кубки, тиснение дипломов и призы',
    badge: 'Награды',
    task: {
      title: 'Заказ наградных стел, печать дипломов победителей и подготовка призового фонда',
      description: 'Производство памятных статуэток и кубков из акрила/металла, тиснение дипломов и формирование подарочных наборов.',
      category: 'Маркетинг',
      priority: 'medium',
      daysBeforeStart: -6
    },
    budget: {
      title: 'Призовой фонд и наградная продукция',
      category: 'Полиграфия и мерч',
      percentage: 10,
      rationale: 'Изготовление наградных кубков, печать сертификатов, подарочные карты и мерч для лауреатов.'
    },
    schedule: {
      time: '19:00 – 20:00',
      title: 'Церемония награждения победителей',
      stage: 'Главная сцена (Main Stage)',
      description: 'Торжественное вручение наград, дипломов и ценных призов финалистам под аккомпанемент и фотосессию.'
    }
  }
];

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
  registeredCount: number = 0,
  selectedModuleIds: string[] = [],
  customRequirements: CustomRequirement[] = []
): EventBlueprint {
  const eventDate = event.startDate || new Date().toISOString().split('T')[0];
  const budgetLimit = Math.max(100000, Number(event.totalBudgetLimit) || 1000000);
  const plannedGuests = Math.max(10, Number(event.plannedHeadcount) || 100);

  // 1. Task generation: Base tasks based on event type
  const recommendedTasks: GeneratedTask[] = [];

  if (event.type === 'Хакатон') {
    recommendedTasks.push(
      {
        id: 'base-task-1',
        title: 'Утверждение треков хакатона и технических заданий для кейсодержателей',
        description: 'Сформировать 3-4 практических кейса с датасетами и критериями оценки MVP.',
        category: 'Программа',
        priority: 'critical',
        daysBeforeStart: -20,
        deadlineDate: calculateOffsetDate(eventDate, -20),
        source: 'base'
      },
      {
        id: 'base-task-2',
        title: 'Тестирование высокоскоростной локальной сети и резервного LTE-канала',
        description: 'Проверить пропускную способность для одновременной работы сотен ноутбуков и докеров.',
        category: 'Техническая часть',
        priority: 'high',
        daysBeforeStart: -7,
        deadlineDate: calculateOffsetDate(eventDate, -7),
        source: 'base'
      },
      {
        id: 'base-task-3',
        title: 'Организация круглосуточного питания, ночных кофе-поинтов и энергетиков',
        description: 'Договориться о графике подачи горячих блюд и пицц во время ночного кодинга.',
        category: 'Кейтеринг',
        priority: 'high',
        daysBeforeStart: -5,
        deadlineDate: calculateOffsetDate(eventDate, -5),
        source: 'base'
      },
      {
        id: 'base-task-4',
        title: 'Брифинг менторов и настройка платформы онлайн-оценки проектов',
        description: 'Провести обучающий созвон с менторами треков, протестировать личные кабинеты жюри.',
        category: 'Жюри и менторы',
        priority: 'medium',
        daysBeforeStart: -2,
        deadlineDate: calculateOffsetDate(eventDate, -2),
        source: 'base'
      },
      {
        id: 'base-task-5',
        title: 'Печать дипломов победителей, чеков призового фонда и брендированных подарков',
        description: 'Заготовить именные наградные сертификаты и кубки для топ-3 команд каждого направления.',
        category: 'Мерч и награды',
        priority: 'medium',
        daysBeforeStart: -1,
        deadlineDate: calculateOffsetDate(eventDate, -1),
        source: 'base'
      }
    );
  } else if (event.type === 'Конференция' || event.type === 'Форум') {
    recommendedTasks.push(
      {
        id: 'base-task-1',
        title: 'Финальный прогон презентаций ключевых спикеров (Keynote)',
        description: 'Проверить тайминги докладов, шрифт слайдов и работу кликеров на главной сцене.',
        category: 'Программа',
        priority: 'critical',
        daysBeforeStart: -3,
        deadlineDate: calculateOffsetDate(eventDate, -3),
        source: 'base'
      },
      {
        id: 'base-task-2',
        title: 'Настройка синхронного перевода и радиомикрофонов в секционных залах',
        description: 'Оборудовать кабины переводчиков и провести аудиотрансляцию в гарнитуры.',
        category: 'Техника',
        priority: 'high',
        daysBeforeStart: -4,
        deadlineDate: calculateOffsetDate(eventDate, -4),
        source: 'base'
      },
      {
        id: 'base-task-3',
        title: 'Рассылка электронных билетов и напоминаний о локации и парковке',
        description: 'Отправить пуш-уведомления и email всем зарегистрированным делегатам с их QR-кодами.',
        category: 'Коммуникации',
        priority: 'high',
        daysBeforeStart: -2,
        deadlineDate: calculateOffsetDate(eventDate, -2),
        source: 'base'
      },
      {
        id: 'base-task-4',
        title: 'Координация зоны выставки спонсоров и партнеров (Expo Zone)',
        description: 'Согласовать схему застройки стендов, подводку электричества и допуск монтажников.',
        category: 'Партнеры',
        priority: 'medium',
        daysBeforeStart: -6,
        deadlineDate: calculateOffsetDate(eventDate, -6),
        source: 'base'
      }
    );
  } else {
    // Воркшоп, Корпоратив, Выставка
    recommendedTasks.push(
      {
        id: 'base-task-1',
        title: 'Утверждение сценария интерактивной части и тимбилдинг-механик',
        description: 'Согласовать тайминг с ведущим, диджеем и модераторами рабочих групп.',
        category: 'Контент',
        priority: 'high',
        daysBeforeStart: -10,
        deadlineDate: calculateOffsetDate(eventDate, -10),
        source: 'base'
      },
      {
        id: 'base-task-2',
        title: 'Заказ праздничного банкета/фуршета с учетом персональных предпочтений',
        description: 'Утвердить винную карту, горячие закуски и детское/вегетарианское меню.',
        category: 'Кейтеринг',
        priority: 'high',
        daysBeforeStart: -7,
        deadlineDate: calculateOffsetDate(eventDate, -7),
        source: 'base'
      },
      {
        id: 'base-task-3',
        title: 'Организация трансфера участников и бронирование номеров в отеле',
        description: 'Согласовать подачу комфортабельных автобусов от офиса и списки расселения.',
        category: 'Логистика',
        priority: 'medium',
        daysBeforeStart: -4,
        deadlineDate: calculateOffsetDate(eventDate, -4),
        source: 'base'
      },
      {
        id: 'base-task-4',
        title: 'Подготовка памятных корпоративных подарков и фотозоны',
        description: 'Монтаж брендированного пресс-волла и подготовка подарков сотрудникам.',
        category: 'Мерч',
        priority: 'low',
        daysBeforeStart: -2,
        deadlineDate: calculateOffsetDate(eventDate, -2),
        source: 'base'
      }
    );
  }

  // 1b. Inject dynamic tasks from selected modules
  selectedModuleIds.forEach(modId => {
    const mod = EVENT_MODULES.find(m => m.id === modId);
    if (mod) {
      recommendedTasks.push({
        id: `mod-task-${mod.id}`,
        title: mod.task.title,
        description: mod.task.description,
        category: mod.task.category,
        priority: mod.task.priority,
        daysBeforeStart: mod.task.daysBeforeStart,
        deadlineDate: calculateOffsetDate(eventDate, mod.task.daysBeforeStart),
        source: 'module',
        moduleId: mod.id,
        moduleName: mod.name
      });
    }
  });

  // 1c. Inject custom requirements tasks
  customRequirements.forEach((req, idx) => {
    recommendedTasks.push({
      id: `custom-task-${req.id || idx}`,
      title: req.title,
      description: 'Индивидуальное требование организатора: подготовка и контроль реализации.',
      category: req.category,
      priority: 'medium',
      daysBeforeStart: -4,
      deadlineDate: calculateOffsetDate(eventDate, -4),
      source: 'custom'
    });
  });

  // 2. Budget distribution percentages tailored to event type + modules + custom
  interface BaseBudgetTemplate {
    title?: string;
    category: ExpenseCategory;
    pct: number;
    rationale: string;
  }

  let baseTemplate: BaseBudgetTemplate[] = [];

  if (event.type === 'Хакатон') {
    baseTemplate = [
      { category: 'Кейтеринг', pct: 28, rationale: 'Круглосуточное сытное питание и кофе-поинты для высокой продуктивности разработчиков' },
      { category: 'Оборудование', pct: 24, rationale: 'Мощный сетевой интернет-канал, Wi-Fi 6, свет, звук и экраны для демо-дня' },
      { category: 'Аренда площадки', pct: 22, rationale: 'Круглосуточный коворкинг и зал для презентаций на 48 часов' },
      { category: 'Полиграфия и мерч', pct: 12, rationale: 'Брендированные худи, бейджи, стикеры и призовые кубки' },
      { category: 'Маркетинг и реклама', pct: 8, rationale: 'Таргетинг по ИТ-сообществам и привлечение сильных команд' },
      { category: 'Работа подрядчиков', pct: 6, rationale: 'Фото- и видеосъемка демо-дня, работа технического саппорта' }
    ];
  } else if (event.type === 'Конференция' || event.type === 'Форум') {
    baseTemplate = [
      { category: 'Аренда площадки', pct: 32, rationale: 'Престижный конгресс-холл с несколькими параллельными залами' },
      { category: 'Оборудование', pct: 22, rationale: 'Светодиодные экраны высокого разрешения, сценический звук, онлайн-стрим' },
      { category: 'Кейтеринг', pct: 20, rationale: 'Приветственный кофе, два кофе-брейка и деловой обед' },
      { category: 'Маркетинг и реклама', pct: 12, rationale: 'Продажи билетов, PR в СМИ и контекстная реклама' },
      { category: 'Полиграфия и мерч', pct: 8, rationale: 'Программы конференции, бейджи, папки участников' },
      { category: 'Работа подрядчиков', pct: 6, rationale: 'Модераторы секций, синхронисты, координаторы' }
    ];
  } else {
    baseTemplate = [
      { category: 'Кейтеринг', pct: 35, rationale: 'Праздничный банкет, десерты, обслуживание официантами' },
      { category: 'Аренда площадки', pct: 25, rationale: 'Банкетный зал отеля или загородная площадка' },
      { category: 'Работа подрядчиков', pct: 18, rationale: 'Профессиональный ведущий, кавер-группа, фото- и видеограф' },
      { category: 'Оборудование', pct: 10, rationale: 'Сценическое освещение для танцпола и звуковой комплект' },
      { category: 'Транспорт и проживание', pct: 7, rationale: 'Трансфер гостей и расселение спикеров' },
      { category: 'Полиграфия и мерч', pct: 5, rationale: 'Призы для конкурсов и памятные подарки' }
    ];
  }

  // Active module budget items
  const activeModuleBudgets = selectedModuleIds
    .map(id => EVENT_MODULES.find(m => m.id === id))
    .filter((m): m is EventModuleDefinition => Boolean(m))
    .map(m => ({
      title: m.budget.title,
      category: m.budget.category,
      pct: m.budget.percentage,
      rationale: m.budget.rationale,
      source: 'module' as const,
      moduleId: m.id,
      moduleName: m.name
    }));

  // Custom budget items
  const customBudgets = customRequirements.map((req, idx) => ({
    title: req.title,
    category: req.category,
    pct: 5,
    rationale: 'Индивидуальное требование организатора к проекту',
    source: 'custom' as const,
    moduleId: `custom-${idx}`,
    moduleName: 'Пользовательское'
  }));

  // Re-scale base template percentages to fit modules and customs cleanly within 100%
  const totalExtraPct = activeModuleBudgets.reduce((s, m) => s + m.pct, 0) + customBudgets.reduce((s, c) => s + c.pct, 0);
  const scale = Math.max(0.15, (100 - Math.min(75, totalExtraPct)) / 100);

  const scaledBase = baseTemplate.map(item => ({
    title: `Базовая статья: ${item.category}`,
    category: item.category,
    pct: Math.max(2, Math.round(item.pct * scale)),
    rationale: item.rationale,
    source: 'base' as const,
    moduleId: undefined,
    moduleName: undefined
  }));

  const allBudgetEntries = [...scaledBase, ...activeModuleBudgets, ...customBudgets];
  const rawSumPct = allBudgetEntries.reduce((s, i) => s + i.pct, 0);

  // Normalize percentages so they precisely sum to 100
  const normalizedPercentages = allBudgetEntries.map(item =>
    Math.max(1, Math.round((item.pct / rawSumPct) * 100))
  );
  const normSum = normalizedPercentages.reduce((a, b) => a + b, 0);
  if (normSum !== 100 && normalizedPercentages.length > 0) {
    normalizedPercentages[0] += (100 - normSum);
  }

  const recommendedBudget: GeneratedBudgetDistribution[] = allBudgetEntries.map((item, idx) => {
    const finalPct = normalizedPercentages[idx];
    return {
      id: `bud-dist-${idx}`,
      title: item.title,
      category: item.category,
      percentage: finalPct,
      amount: Math.round((budgetLimit * finalPct) / 100),
      rationale: item.rationale,
      source: item.source,
      moduleId: item.moduleId,
      moduleName: item.moduleName
    };
  });

  // Adjust any rounding diff on amounts to ensure sum === budgetLimit
  const currentTotalAmount = recommendedBudget.reduce((s, b) => s + b.amount, 0);
  const amountDiff = budgetLimit - currentTotalAmount;
  if (amountDiff !== 0 && recommendedBudget.length > 0) {
    recommendedBudget[0].amount += amountDiff;
  }

  // 3. Risk Audit using pluralizeRu
  const detectedRisks: RiskItem[] = [];

  const overdueTasks = currentTasks.filter(t => isTaskOverdue(t.deadline, t.status));
  if (overdueTasks.length > 0) {
    const criticals = overdueTasks.filter(t => t.priority === 'critical');
    detectedRisks.push({
      id: 'risk-overdue',
      severity: criticals.length > 0 ? 'critical' : 'high',
      title: `Обнаружено ${overdueTasks.length} ${pluralizeRu(overdueTasks.length, ['просроченная задача', 'просроченные задачи', 'просроченных задач'])}${
        criticals.length > 0
          ? ` (${criticals.length} ${pluralizeRu(criticals.length, ['критическая', 'критические', 'критических'])})`
          : ''
      }`,
      description: `Задачи «${overdueTasks.slice(0, 2).map(t => t.title).join('», «')}» имеют прошедший дедлайн и не переведены в статус «Готово».`,
      recommendation: 'Срочно перераспределите ресурсы команды или актуализируйте дедлайны в плане подготовки во избежание срыва мероприятия.',
      actionText: 'Перейти к задачам →',
      actionTab: 'tasks'
    });
  }

  const totalActual = currentBudget.reduce((sum, b) => sum + (Number(b.actualAmount) || 0), 0);
  const totalPlanned = currentBudget.reduce((sum, b) => sum + (Number(b.plannedAmount) || 0), 0);

  if (totalActual > budgetLimit) {
    detectedRisks.push({
      id: 'risk-budget-limit',
      severity: 'critical',
      title: 'Превышен общий лимит бюджета мероприятия',
      description: `Фактические расходы (${totalActual.toLocaleString('ru-RU')} ₽) превышают установленный лимит (${budgetLimit.toLocaleString('ru-RU')} ₽) на ${(totalActual - budgetLimit).toLocaleString('ru-RU')} ₽.`,
      recommendation: 'Проведите ревизию второстепенных статей (мерч, полиграфия, реклама) или запросите согласование дополнительного транша у заказчика.',
      actionText: 'Открыть смету →',
      actionTab: 'budget'
    });
  } else if (totalActual > totalPlanned && totalPlanned > 0) {
    detectedRisks.push({
      id: 'risk-budget-overrun',
      severity: 'high',
      title: 'Фактические расходы превышают плановую смету',
      description: `Сумма фактических затрат превысила план на ${(totalActual - totalPlanned).toLocaleString('ru-RU')} ₽.`,
      recommendation: 'Проверьте отдельные статьи с перерасходом (например, кейтеринг) и оптимизируйте оставшиеся закупки.',
      actionText: 'Проверить статьи →',
      actionTab: 'budget'
    });
  }

  if (plannedGuests > 0 && registeredCount < plannedGuests * 0.4) {
    detectedRisks.push({
      id: 'risk-low-attendance',
      severity: 'high',
      title: 'Низкий процент регистрации участников',
      description: `Зарегистрировано только ${registeredCount} из запланированных ${plannedGuests} участников (${Math.round((registeredCount / plannedGuests) * 100)}%).`,
      recommendation: 'Активируйте дополнительные каналы маркетинга: контекстная реклама, таргетинг в соцсетях, партнерские рассылки и напоминания.',
      actionText: 'Запустить рассылку гостям →',
      actionTab: 'guests'
    });
  }

  // 4. Chronological Agenda Schedule
  const baseSchedule: ScheduleItem[] = [
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

  // Merge with selected module schedule slots
  const moduleScheduleSlots: ScheduleItem[] = selectedModuleIds
    .map(id => EVENT_MODULES.find(m => m.id === id))
    .filter((m): m is EventModuleDefinition => Boolean(m))
    .map(m => ({
      time: m.schedule.time,
      title: m.schedule.title,
      stage: m.schedule.stage,
      description: m.schedule.description,
      moduleId: m.id,
      moduleName: m.name
    }));

  const allScheduleSlots = [...baseSchedule, ...moduleScheduleSlots].sort((a, b) => {
    const timeA = a.time.split('–')[0].trim();
    const timeB = b.time.split('–')[0].trim();
    return timeA.localeCompare(timeB);
  });

  return {
    eventId: event.id,
    summary: `План подготовки и контрольные показатели для «${event.title}» (${event.type}, ${plannedGuests} участников, лимит бюджета: ${budgetLimit.toLocaleString('ru-RU')} ₽, подключено модулей: ${selectedModuleIds.length}).`,
    recommendedTasks,
    recommendedBudget,
    detectedRisks,
    eventSchedule: allScheduleSlots
  };
}
