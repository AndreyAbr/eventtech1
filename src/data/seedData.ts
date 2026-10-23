import {
  EventEntity,
  TaskItem,
  BudgetItem,
  GuestItem,
  TeamMember,
  ContractorItem,
  SurveyResponse,
  KanbanStage,
  MarketplaceItem,
  BroadcastMessage
} from '../types/event';

// Helper to calculate dates relative to today
const getRelativeDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_EVENTS: EventEntity[] = [
  {
    id: 'evt-1',
    title: 'ТехноИмпульс 2026: Всероссийский ИТ-Форум и Хакатон',
    type: 'Хакатон',
    startDate: getRelativeDateString(14),
    startTime: '10:00',
    endDate: getRelativeDateString(16),
    location: 'Технопарк, Конгресс-холл / Онлайн-трансляция',
    isOnline: false,
    description: 'Масштабный трехдневный хакатон и технологический форум для 300+ разработчиков, продакт-менеджеров и ИИ-инженеров со всей страны. 48 часов кодинга, менторские сессии и защита перед венчурными фондами.',
    goals: 'Создание 20+ работающих прототипов, отбор перспективных ИТ-стартапов, нетворкинг и найм талантливых специалистов.',
    plannedHeadcount: 300,
    totalBudgetLimit: 2500000,
    leadOrganizer: 'Алексей Морозов'
  },
  {
    id: 'evt-2',
    title: 'ProductConf: Конференция продуктовых команд',
    type: 'Конференция',
    startDate: getRelativeDateString(30),
    startTime: '09:30',
    endDate: getRelativeDateString(30),
    location: 'Центр цифрового развития, Зал А',
    isOnline: false,
    description: 'Практическая конференция для Product Lead, CPO и дизайн-директоров о масштабировании B2B и B2C продуктов в условиях неопределенности.',
    goals: 'Обмен практическими кейсами продуктовой аналитики, метрик удержания и монетизации.',
    plannedHeadcount: 150,
    totalBudgetLimit: 1200000,
    leadOrganizer: 'Елена Романова'
  },
  {
    id: 'evt-3',
    title: 'Годовая стратегическая сессия и закрытый воркшоп',
    type: 'Корпоратив',
    startDate: getRelativeDateString(7),
    startTime: '11:00',
    endDate: getRelativeDateString(8),
    location: 'Конференц-отель Полярная Звезда',
    isOnline: false,
    description: 'Корпоративная выездная стратсессия топ-менеджмента для утверждения инвестиционных планов и OKR на следующий год.',
    goals: 'Фиксация ключевых инициатив, распределение квартальных ресурсов и укрепление синергии между департаментами.',
    plannedHeadcount: 60,
    totalBudgetLimit: 600000,
    leadOrganizer: 'Дмитрий Волков'
  }
];

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    eventId: 'evt-1',
    fullName: 'Алексей Морозов',
    roleTitle: 'Главный организатор / Lead Producer',
    zoneOfResponsibility: 'Общая координация, договоры, площадка, безопасность',
    email: 'alexey.morozov@eventtech.pro',
    phone: '+7 (999) 111-22-33',
    systemRole: 'admin'
  },
  {
    id: 'tm-2',
    eventId: 'evt-1',
    fullName: 'Ирина Васильева',
    roleTitle: 'Технический директор',
    zoneOfResponsibility: 'Звук, свет, Wi-Fi 6 инфраструктура, видеострим',
    email: 'irina.tech@eventtech.pro',
    phone: '+7 (999) 222-33-44',
    systemRole: 'team'
  },
  {
    id: 'tm-3',
    eventId: 'evt-1',
    fullName: 'Михаил Соколов',
    roleTitle: 'Координатор волонтеров и участников',
    zoneOfResponsibility: 'Регистрация, чек-ин, навигация, кейтеринг-зоны',
    email: 'mikhail.sokolov@eventtech.pro',
    phone: '+7 (999) 333-44-55',
    systemRole: 'team'
  },
  {
    id: 'tm-4',
    eventId: 'evt-1',
    fullName: 'Анна Кузнецова',
    roleTitle: 'Маркетинг и PR-директор',
    zoneOfResponsibility: 'Инфопартнеры, соцсети, мерч, полиграфия, пресс-релизы',
    email: 'anna.pr@eventtech.pro',
    phone: '+7 (999) 444-55-66',
    systemRole: 'team'
  },
  {
    id: 'tm-5',
    eventId: 'evt-1',
    fullName: 'Сергей Павлов',
    roleTitle: 'Финансовый контролер',
    zoneOfResponsibility: 'Сметы, закрывающие документы с контрагентами, платежи',
    email: 'sergey.finance@eventtech.pro',
    phone: '+7 (999) 555-66-77',
    systemRole: 'admin'
  }
];

export const INITIAL_CONTRACTORS: ContractorItem[] = [
  {
    id: 'cont-1',
    eventId: 'evt-1',
    companyName: 'ООО «ТехноПарк Экспо»',
    serviceType: 'Аренда конгресс-холла и коворкинг-зоны (3 дня)',
    contactPerson: 'Владислав Орлов',
    phone: '+7 (495) 789-01-23',
    email: 'booking@technopark-expo.ru',
    cost: 800000,
    status: 'contracted'
  },
  {
    id: 'cont-2',
    eventId: 'evt-1',
    companyName: '«Гастроном Кейтеринг Сервис»',
    serviceType: 'Кофе-брейки, горячие обеды и ночные перекусы для хакатона',
    contactPerson: 'Ольга Николаева',
    phone: '+7 (495) 654-32-10',
    email: 'catering@gastronom-event.ru',
    cost: 620000,
    status: 'contracted'
  },
  {
    id: 'cont-3',
    eventId: 'evt-1',
    companyName: 'Sound & Stream Pro Lab',
    serviceType: 'Сценическое освещение, линейные массивы звука, 4K трансляция',
    contactPerson: 'Артем Дроздов',
    phone: '+7 (495) 321-98-76',
    email: 'support@soundstream-pro.ru',
    cost: 480000,
    status: 'contracted'
  },
  {
    id: 'cont-4',
    eventId: 'evt-1',
    companyName: 'БрендМерч Фабрика',
    serviceType: 'Фирменные худи для участников, бейджи, блокноты и ланьярды',
    contactPerson: 'Екатерина Смирнова',
    phone: '+7 (495) 888-44-22',
    email: 'orders@brandmerch-factory.ru',
    cost: 230000,
    status: 'paid'
  }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    eventId: 'evt-1',
    title: 'Подписание договора аренды и согласование регламента безопасности с Технопарком',
    description: 'Внести финальные правки в договор с управляющей компанией, передать список монтажников и паспорт безопасности мероприятия.',
    assigneeId: 'tm-1',
    deadline: getRelativeDateString(-3), // OVERDUE!
    priority: 'critical',
    status: 'stage-evt-1-in_progress',
    comments: [
      {
        id: 'comm-1',
        authorName: 'Алексей Морозов',
        text: 'Юристы задерживают согласование пункта 4.2 об ответственности за оборудование. Ускоряем!',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: 'comm-2',
        authorName: 'Сергей Павлов',
        text: 'Юристы согласовали редакцию. Ждем подписи генерального директора площадки сегодня до 17:00.',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ]
  },
  {
    id: 'task-2',
    eventId: 'evt-1',
    title: 'Финальное тестирование выделенного интернет-канала 1 Гбит/с и Wi-Fi роутеров',
    description: 'Обеспечить разделение SSID для участников хакатона, жюри и служебных нужд трансляции. Нагрузочный тест на 400 подключений.',
    assigneeId: 'tm-2',
    deadline: getRelativeDateString(-1), // OVERDUE!
    priority: 'high',
    status: 'stage-evt-1-todo',
    comments: [
      {
        id: 'comm-3',
        authorName: 'Ирина Васильева',
        text: 'Провайдер смонтировал оптику, но нужно перепрошить две точки доступа Cisco в правом крыле.',
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ]
  },
  {
    id: 'task-3',
    eventId: 'evt-1',
    title: 'Заказ фирменного мерча, ланьярдов и печать бейджей с QR-метками',
    description: '300 худи размеров S-XXL, 350 ланьярдов и заготовки под бейджи с матовой ламинацией.',
    assigneeId: 'tm-4',
    deadline: getRelativeDateString(2),
    priority: 'high',
    status: 'stage-evt-1-in_progress',
    comments: [
      {
        id: 'comm-4',
        authorName: 'Анна Кузнецова',
        text: 'Макеты переданы в типографию. Первый тираж будет готов в четверг.',
        createdAt: new Date(Date.now() - 3600000 * 30).toISOString()
      }
    ]
  },
  {
    id: 'task-4',
    eventId: 'evt-1',
    title: 'Утверждение меню кофе-брейков и веганских опций питания',
    description: 'Согласовать с кейтерингом график подачи горячего кофе, сэндвичей и энергетических снеков на ночные часы хакатона.',
    assigneeId: 'tm-3',
    deadline: getRelativeDateString(5),
    priority: 'medium',
    status: 'stage-evt-1-in_progress',
    comments: []
  },
  {
    id: 'task-5',
    eventId: 'evt-1',
    title: 'Брифинг волонтеров зоны регистрации и обучение работе со сканером билетов',
    description: 'Собрать 15 волонтеров в Zoom, распределить смены и протестировать мобильный интерфейс QR-чекина.',
    assigneeId: 'tm-3',
    deadline: getRelativeDateString(9),
    priority: 'medium',
    status: 'stage-evt-1-todo',
    comments: []
  },
  {
    id: 'task-6',
    eventId: 'evt-1',
    title: 'Запуск рекламной кампании в Telegram-каналах и рассылка по базе выпускников',
    description: 'Размещение анонсов в каналах по ИТ, фронтенду и AI. Таргетированный охват не менее 50 000 просмотров.',
    assigneeId: 'tm-4',
    deadline: getRelativeDateString(-10),
    priority: 'medium',
    status: 'stage-evt-1-done',
    comments: [
      {
        id: 'comm-5',
        authorName: 'Анна Кузнецова',
        text: 'Посевы завершены успешно! Привлекли 280+ уникальных регистраций за 4 дня.',
        createdAt: new Date(Date.now() - 3600000 * 200).toISOString()
      }
    ]
  },
  {
    id: 'task-7',
    eventId: 'evt-1',
    title: 'Подготовка экспертного состава жюри и критериев оценки хакатона',
    description: 'Подтвердить участие 7 экспертов из Сбера, Яндекса и Т-Банка, согласовать регламент питчей 3 минуты + 2 минуты вопросы.',
    assigneeId: 'tm-1',
    deadline: getRelativeDateString(-5),
    priority: 'high',
    status: 'stage-evt-1-done',
    comments: []
  },
  {
    id: 'task-8',
    eventId: 'evt-1',
    title: 'Инструктаж службы скорой медицинской помощи и дежурной охраны',
    description: 'Обеспечить присутствие дежурной бригады медиков и круглосуточного поста охраны входной группы.',
    assigneeId: 'tm-1',
    deadline: getRelativeDateString(11),
    priority: 'low',
    status: 'stage-evt-1-review',
    comments: []
  }
];

export const INITIAL_BUDGET: BudgetItem[] = [
  {
    id: 'bud-1',
    eventId: 'evt-1',
    category: 'Аренда площадки',
    title: 'Аренда конгресс-холла, медиа-зоны и коворкинга Технопарка (3 суток)',
    plannedAmount: 800000,
    actualAmount: 800000,
    contractorId: 'cont-1',
    notes: 'Договор подписан, счет выставлен с НДС 20%'
  },
  {
    id: 'bud-2',
    eventId: 'evt-1',
    category: 'Кейтеринг',
    title: 'Питание участников хакатона: 6 кофе-брейков, 3 горячих обеда, ночные пиццы',
    plannedAmount: 450000,
    actualAmount: 620000, // OVERRUN! Planned 450k, actual 620k (+170 000 ₽)
    contractorId: 'cont-2',
    notes: 'Превышение сметы из-за увеличения порций ночного питания и закупки бутилированной воды'
  },
  {
    id: 'bud-3',
    eventId: 'evt-1',
    category: 'Оборудование',
    title: 'Светодиодный экран 8x4м, радиомикрофоны, видеомикшер и сетевые коммутаторы',
    plannedAmount: 500000,
    actualAmount: 480000,
    contractorId: 'cont-3',
    notes: 'Получена партнерская скидка 20 000 ₽ за раннее бронирование'
  },
  {
    id: 'bud-4',
    eventId: 'evt-1',
    category: 'Полиграфия и мерч',
    title: 'Худи оверсайз, пластиковые бейджи, стикерпаки и наградные кубки',
    plannedAmount: 250000,
    actualAmount: 230000,
    contractorId: 'cont-4',
    notes: 'Предоплата 100% внесена'
  },
  {
    id: 'bud-5',
    eventId: 'evt-1',
    category: 'Маркетинг и реклама',
    title: 'Таргетированная реклама и интеграции в профильных ИТ-сообществах',
    plannedAmount: 300000,
    actualAmount: 290000,
    notes: 'Конверсия клика в регистрацию составила рекордные 14.2%'
  },
  {
    id: 'bud-6',
    eventId: 'evt-1',
    category: 'Работа подрядчиков',
    title: 'Оплата услуг фотографов, видеооператоров монтажа и ведущего церемонии',
    plannedAmount: 200000,
    actualAmount: 180000,
    notes: 'Авансовые платежи переведены'
  }
];

export const INITIAL_GUESTS: GuestItem[] = [
  {
    id: 'gst-1',
    eventId: 'evt-1',
    fullName: 'Максим Белов',
    email: 'm.belov@techcorp.ru',
    phone: '+7 (916) 100-20-30',
    organization: 'TechCorp Solutions',
    ticketType: 'VIP',
    status: 'checked_in',
    registeredAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-1',
    dietaryNotes: 'Без глютена'
  },
  {
    id: 'gst-2',
    eventId: 'evt-1',
    fullName: 'Екатерина Гордеева',
    email: 'gordeeva.ai@neuralab.io',
    phone: '+7 (926) 200-30-40',
    organization: 'NeuraLab AI',
    ticketType: 'Спикер',
    status: 'checked_in',
    registeredAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-2'
  },
  {
    id: 'gst-3',
    eventId: 'evt-1',
    fullName: 'Артем Ковалев',
    email: 'artem.k@devstack.org',
    phone: '+7 (903) 300-40-50',
    organization: 'DevStack Community',
    ticketType: 'Стандарт',
    status: 'checked_in',
    registeredAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-3'
  },
  {
    id: 'gst-4',
    eventId: 'evt-1',
    fullName: 'Ольга Семенова',
    email: 'olga.s@fintech-hub.ru',
    phone: '+7 (915) 400-50-60',
    organization: 'FinTech Hub',
    ticketType: 'Стандарт',
    status: 'checked_in',
    registeredAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-4',
    dietaryNotes: 'Вегетарианское питание'
  },
  {
    id: 'gst-5',
    eventId: 'evt-1',
    fullName: 'Роман Васильев',
    email: 'r.vasiliev@cybernet.com',
    phone: '+7 (999) 500-60-70',
    organization: 'CyberNet Systems',
    ticketType: 'Стандарт',
    status: 'confirmed',
    registeredAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-5'
  },
  {
    id: 'gst-6',
    eventId: 'evt-1',
    fullName: 'София Лебедева',
    email: 'sofia.leb@media-it.ru',
    phone: '+7 (985) 600-70-80',
    organization: 'IT News Daily',
    ticketType: 'Пресса',
    status: 'confirmed',
    registeredAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-6'
  },
  {
    id: 'gst-7',
    eventId: 'evt-1',
    fullName: 'Денис Медведев',
    email: 'denis.m@cloudscale.net',
    phone: '+7 (905) 700-80-90',
    organization: 'CloudScale Team',
    ticketType: 'Стандарт',
    status: 'confirmed',
    registeredAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-7'
  },
  {
    id: 'gst-8',
    eventId: 'evt-1',
    fullName: 'Виктория Орлова',
    email: 'v.orlova@dataworks.ai',
    phone: '+7 (925) 800-90-01',
    organization: 'DataWorks Labs',
    ticketType: 'Стандарт',
    status: 'confirmed',
    registeredAt: new Date(Date.now() - 3600000 * 35).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-8'
  },
  {
    id: 'gst-9',
    eventId: 'evt-1',
    fullName: 'Илья Федоров',
    email: 'fedorov@smartcity.gov.ru',
    phone: '+7 (916) 900-01-12',
    organization: 'Центр Smart City',
    ticketType: 'VIP',
    status: 'registered',
    registeredAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-9'
  },
  {
    id: 'gst-10',
    eventId: 'evt-1',
    fullName: 'Алина Зайцева',
    email: 'alina.z@student-union.edu',
    phone: '+7 (910) 012-34-56',
    organization: 'МИРЭА Кафедра ИИ',
    ticketType: 'Стандарт',
    status: 'registered',
    registeredAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-10'
  },
  {
    id: 'gst-11',
    eventId: 'evt-1',
    fullName: 'Кирилл Григорьев',
    email: 'k.grigoriev@startup-foundry.vc',
    phone: '+7 (977) 123-45-67',
    organization: 'StartUp Foundry VC',
    ticketType: 'VIP',
    status: 'registered',
    registeredAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-11'
  },
  {
    id: 'gst-12',
    eventId: 'evt-1',
    fullName: 'Павел Новиков',
    email: 'pavel.novikov@inbox-temp.ru',
    phone: '+7 (901) 234-56-78',
    organization: 'Частный исследователь',
    ticketType: 'Стандарт',
    status: 'cancelled',
    registeredAt: new Date(Date.now() - 3600000 * 70).toISOString(),
    qrCodeToken: 'EVT-evt-1-gst-12'
  }
];

export const INITIAL_SURVEYS: SurveyResponse[] = [
  {
    id: 'srv-1',
    eventId: 'evt-1',
    guestName: 'Максим Белов (TechCorp)',
    rating: 5,
    feedback: 'Потрясающий уровень организации! Быстрый Wi-Fi, удобная площадка и оперативный чек-ин по QR-коду занял буквально 3 секунды.',
    submittedAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'srv-2',
    eventId: 'evt-1',
    guestName: 'Екатерина Гордеева (NeuraLab)',
    rating: 5,
    feedback: 'Отличная модерация секций и потрясающий звук в зале. Отдельная благодарность за качественный кофе и тайминг выступлений.',
    submittedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'srv-3',
    eventId: 'evt-1',
    guestName: 'Артем Ковалев (DevStack)',
    rating: 4,
    feedback: 'Все супер, задачи хакатона интересные и реальные. Хотелось бы чуть больше розеток в секторе B, но волонтеры оперативно помогли с удлинителями.',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'srv-4',
    eventId: 'evt-1',
    guestName: 'Ольга Семенова (FinTech Hub)',
    rating: 5,
    feedback: 'Искренний восторг от атмосферы и нетворкинга. Приложение и билеты сделаны максимально современно и красиво.',
    submittedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

export const INITIAL_KANBAN_STAGES: KanbanStage[] = [
  // evt-1
  { id: 'stage-evt-1-todo', eventId: 'evt-1', title: 'К выполнению', color: 'zinc', order: 0 },
  { id: 'stage-evt-1-in_progress', eventId: 'evt-1', title: 'В работе', color: 'amber', order: 1 },
  { id: 'stage-evt-1-review', eventId: 'evt-1', title: 'На проверке', color: 'blue', order: 2 },
  { id: 'stage-evt-1-done', eventId: 'evt-1', title: 'Готово', color: 'emerald', order: 3, isCompletedStage: true },

  // evt-2
  { id: 'stage-evt-2-todo', eventId: 'evt-2', title: 'К выполнению', color: 'zinc', order: 0 },
  { id: 'stage-evt-2-in_progress', eventId: 'evt-2', title: 'В работе', color: 'amber', order: 1 },
  { id: 'stage-evt-2-review', eventId: 'evt-2', title: 'На проверке', color: 'blue', order: 2 },
  { id: 'stage-evt-2-done', eventId: 'evt-2', title: 'Готово', color: 'emerald', order: 3, isCompletedStage: true },

  // evt-3
  { id: 'stage-evt-3-todo', eventId: 'evt-3', title: 'К выполнению', color: 'zinc', order: 0 },
  { id: 'stage-evt-3-in_progress', eventId: 'evt-3', title: 'В работе', color: 'amber', order: 1 },
  { id: 'stage-evt-3-review', eventId: 'evt-3', title: 'На проверке', color: 'blue', order: 2 },
  { id: 'stage-evt-3-done', eventId: 'evt-3', title: 'Готово', color: 'emerald', order: 3, isCompletedStage: true }
];

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  {
    id: 'mp-1',
    category: 'venue',
    serviceType: 'Конгресс-холл и площадки',
    title: 'Конгресс-центр «СитиХолл Экспо»',
    description: 'Флагманская площадка с залом-трансформером, 4K LED-стеной 12x4м, зонами кофе-брейков и подземным паркингом на 250 мест.',
    rating: 4.9,
    reviewsCount: 38,
    capacity: 500,
    price: 950000,
    city: 'Москва',
    format: 'Офлайн / Гибрид',
    tags: ['Wi-Fi 1 Гбит/с', 'LED Экран', 'Сцена', 'Паркинг', 'Гримерки', 'Кейтеринг-зона'],
    contactPerson: 'Виктор Васильев',
    phone: '+7 (495) 123-45-67',
    email: 'booking@cityhall-expo.ru'
  },
  {
    id: 'mp-2',
    category: 'venue',
    serviceType: 'Лофт и креативные пространства',
    title: 'Лофт-пространство «Красный Октябрь Event»',
    description: 'Стильное трехуровневое арт-пространство с панорамной верандой на набережную, историческим кирпичом и профессиональным светом.',
    rating: 4.8,
    reviewsCount: 26,
    capacity: 220,
    price: 380000,
    city: 'Москва',
    format: 'Офлайн / Воркшопы',
    tags: ['Панорамная веранда', 'Барная стойка', 'Световой пульт', 'Звук 8 кВт', 'Кухня'],
    contactPerson: 'Мария Воронова',
    phone: '+7 (495) 765-43-21',
    email: 'events@redoktyabr-loft.ru'
  },
  {
    id: 'mp-3',
    category: 'venue',
    serviceType: 'Технопарки и инновационные хабы',
    title: 'Технопарк «Сколково Резиденция»',
    description: 'Инновационный атриум для хакатонов и технологических форумов с резервным каналом связи, 40 переговорными и зоной отдыха.',
    rating: 5.0,
    reviewsCount: 44,
    capacity: 350,
    price: 650000,
    city: 'Москва / Сколково',
    format: 'Хакатон / Конференция',
    tags: ['Хакатон-зона 24/7', 'Резервный LTE', '40 Переговорных', 'Лаборатории', 'Охрана'],
    contactPerson: 'Андрей Ковалев',
    phone: '+7 (495) 999-88-77',
    email: 'skolkovo.events@residence.tech'
  },
  {
    id: 'mp-4',
    category: 'contractor',
    serviceType: 'Техническое обеспечение и звук',
    title: '«ProSound & Stream Lab»',
    description: 'Линейные массивы D&B, цифровые микшеры Yamaha, беспроводные микрофоны Shure Axient и бесперебойная онлайн-трансляция.',
    rating: 4.9,
    reviewsCount: 52,
    price: 420000,
    city: 'Москва',
    format: 'Под ключ',
    tags: ['Линейный массив', '4K Стриминг', 'Световые головы', 'Звукорежиссер', 'Синхронный перевод'],
    contactPerson: 'Денис Соколов',
    phone: '+7 (495) 333-22-11',
    email: 'hire@prosound-stream.ru'
  },
  {
    id: 'mp-5',
    category: 'contractor',
    serviceType: 'Кейтеринг и питание',
    title: '«GrandCatering Gourmet Event»',
    description: 'Премиальный выездной ресторан: кофе-брейки спешелти зерна, горячие сеты, гала-ужин, веганское и безглютеновое меню.',
    rating: 4.8,
    reviewsCount: 31,
    capacity: 600,
    price: 480000,
    city: 'Москва / Санкт-Петербург',
    format: 'Фуршет / Банкет',
    tags: ['Specialty кофе', 'Веган-меню', 'Фарфор и стекло', 'Официанты', 'Ночная доставка'],
    contactPerson: 'Ксения Лебедева',
    phone: '+7 (495) 444-55-66',
    email: 'order@grandcatering.pro'
  },
  {
    id: 'mp-6',
    category: 'contractor',
    serviceType: 'Мерч и полиграфия',
    title: '«ArtMerch Factory & Print»',
    description: 'Производство мерча полного цикла: оверсайз-худи, ланьярды, NFC-бейджи, эко-блокноты и наградные стелы из акрила.',
    rating: 4.9,
    reviewsCount: 40,
    price: 240000,
    city: 'Москва',
    format: 'Доставка 48ч',
    tags: ['Шелкография', 'NFC-бейджи', 'Худи плотностью 420г', 'Эко-материалы', 'Срочная печать'],
    contactPerson: 'Глеб Данилов',
    phone: '+7 (495) 555-01-99',
    email: 'team@artmerch-factory.ru'
  }
];

export const INITIAL_BROADCASTS: BroadcastMessage[] = [
  {
    id: 'bc-1',
    eventId: 'evt-1',
    title: 'Напоминание о старте чек-ина и расписание хакатона',
    message: 'Уважаемые участники! Регистрация на площадке Технопарка откроется в 09:30. Пожалуйста, подготовьте персональный QR-код из билета для ускоренного прохода.',
    audience: 'all',
    sentAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    recipientCount: 11
  },
  {
    id: 'bc-2',
    eventId: 'evt-1',
    title: 'Инструкции для VIP-гостей и менторской сессии',
    message: 'Приветствуем! Менторская зона расположена на 3 этаже в зале Альфа. Начало первого питч-сеанса в 14:00.',
    audience: 'vip',
    sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    recipientCount: 2
  }
];
