import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ScanLine,
  MessageSquare,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Star,
  Send,
  X,
  QrCode,
  Radio,
  Sparkles,
  History,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEventContext } from '../../context/EventContext';
import { GuestItem, GuestStatus, BroadcastMessage } from '../../types/event';
import { exportGuestsToCSV } from '../../utils/csvExport';
import { formatDate, pluralizeRu } from '../../utils/analytics';

export const GuestsView: React.FC = () => {
  const {
    activeEvent,
    activeGuests,
    activeSurveys,
    activeBroadcasts,
    sendBroadcast,
    addGuest,
    updateGuest,
    deleteGuest,
    checkInGuest,
    addSurvey,
    currentUserRole,
    notify
  } = useEventContext();

  const isGuestMode = currentUserRole === 'guest';

  // Sub-tabs: 'list' | 'registration' | 'terminal' | 'surveys'
  const [currentSubTab, setCurrentSubTab] = useState<'list' | 'registration' | 'terminal' | 'surveys'>(
    isGuestMode ? 'registration' : 'list'
  );

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTicketType, setFilterTicketType] = useState<string>('all');

  // Registration form
  const [regForm, setRegForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    organization: string;
    ticketType: GuestItem['ticketType'];
    dietaryNotes: string;
  }>({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    ticketType: 'Стандарт',
    dietaryNotes: ''
  });

  // Ticket Preview Modal
  const [viewTicketGuest, setViewTicketGuest] = useState<GuestItem | null>(null);

  // QR Terminal State
  const [terminalToken, setTerminalToken] = useState('');
  const [terminalSelectedGuestId, setTerminalSelectedGuestId] = useState('');

  // Survey Form State
  const [surveyRating, setSurveyRating] = useState<number>(5);
  const [surveyName, setSurveyName] = useState<string>('');
  const [surveyFeedback, setSurveyFeedback] = useState<string>('');

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'confirmed' | 'vip' | 'checked_in'>('all');

  if (!activeEvent) {
    return <div className="p-8 text-center text-xs text-zinc-400">Мероприятие не выбрано.</div>;
  }

  // Registration submit handler
  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.fullName.trim() || !regForm.email.trim()) return;

    const newGuest = addGuest({
      eventId: activeEvent.id,
      fullName: regForm.fullName.trim(),
      email: regForm.email.trim(),
      phone: regForm.phone.trim(),
      organization: regForm.organization.trim() || 'Индивидуальный участник',
      ticketType: regForm.ticketType,
      status: 'confirmed',
      dietaryNotes: regForm.dietaryNotes.trim() || undefined
    });

    setRegForm({
      fullName: '',
      email: '',
      phone: '',
      organization: '',
      ticketType: 'Стандарт',
      dietaryNotes: ''
    });

    setViewTicketGuest(newGuest);
  };

  // QR Check-in Terminal Handler
  const handleTerminalCheckIn = () => {
    const tokenToScan = terminalToken.trim() || terminalSelectedGuestId;
    if (!tokenToScan) {
      notify('Введите токен билета или выберите участника из списка', 'warning');
      return;
    }
    const success = checkInGuest(tokenToScan);
    if (success) {
      setTerminalToken('');
      setTerminalSelectedGuestId('');
    }
  };

  // Survey Submit Handler
  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyFeedback.trim()) return;

    addSurvey({
      eventId: activeEvent.id,
      guestName: surveyName.trim() || 'Анонимный участник',
      rating: surveyRating,
      feedback: surveyFeedback.trim()
    });

    setSurveyName('');
    setSurveyFeedback('');
    setSurveyRating(5);
  };

  // Broadcast Audience Count
  const getRecipientCount = (audience: 'all' | 'confirmed' | 'vip' | 'checked_in') => {
    switch (audience) {
      case 'confirmed':
        return activeGuests.filter(g => g.status === 'confirmed').length;
      case 'vip':
        return activeGuests.filter(g => g.ticketType === 'VIP').length;
      case 'checked_in':
        return activeGuests.filter(g => g.status === 'checked_in').length;
      case 'all':
      default:
        return activeGuests.filter(g => g.status !== 'cancelled').length;
    }
  };

  // Broadcast Submit Handler
  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    const count = getRecipientCount(broadcastAudience);
    sendBroadcast({
      eventId: activeEvent.id,
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      audience: broadcastAudience,
      recipientCount: count
    });

    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  const applyBroadcastTemplate = (title: string, message: string) => {
    setBroadcastTitle(title);
    setBroadcastMessage(message);
  };

  // Filter guests
  const filteredGuests = activeGuests.filter(guest => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      guest.fullName.toLowerCase().includes(query) ||
      guest.organization.toLowerCase().includes(query) ||
      guest.email.toLowerCase().includes(query) ||
      guest.qrCodeToken.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (filterStatus !== 'all' && guest.status !== filterStatus) return false;
    if (filterTicketType !== 'all' && guest.ticketType !== filterTicketType) return false;
    return true;
  });

  const selectedTerminalGuest = activeGuests.find(
    g => g.id === terminalSelectedGuestId || g.qrCodeToken.toLowerCase() === terminalToken.trim().toLowerCase()
  );

  return (
    <div className="space-y-4">
      {/* Header and Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Участники и билеты
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Реестр делегатов, регистрация, QR-пропуска, чек-ин и рассылки
          </p>
        </div>

        {/* Sub-Navigation */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
          {!isGuestMode && (
            <button
              onClick={() => setCurrentSubTab('list')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                currentSubTab === 'list'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Список ({activeGuests.length})
            </button>
          )}

          <button
            onClick={() => setCurrentSubTab('registration')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              currentSubTab === 'registration'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {isGuestMode ? 'Онлайн-регистрация' : 'Регистрация'}
          </button>

          {!isGuestMode && (
            <button
              onClick={() => setCurrentSubTab('terminal')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                currentSubTab === 'terminal'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              QR Чек-ин
            </button>
          )}

          <button
            onClick={() => setCurrentSubTab('surveys')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              currentSubTab === 'surveys'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            Отзывы ({activeSurveys.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: GUESTS LIST */}
      {currentSubTab === 'list' && !isGuestMode && (
        <div className="space-y-3">
          {/* Filters Bar */}
          <div className="card-surface p-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full md:w-auto flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <input
                  type="text"
                  placeholder="Поиск по ФИО, компании, email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-base w-full pl-8"
                />
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <select
                aria-label="Фильтр по статусу участия"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="input-base h-8 text-xs cursor-pointer"
              >
                <option value="all">Все статусы</option>
                <option value="registered">Зарегистрирован</option>
                <option value="confirmed">Подтвержден</option>
                <option value="checked_in">На площадке</option>
                <option value="cancelled">Отменен</option>
              </select>

              <select
                aria-label="Фильтр по типу билета"
                value={filterTicketType}
                onChange={e => setFilterTicketType(e.target.value)}
                className="input-base h-8 text-xs cursor-pointer"
              >
                <option value="all">Все типы</option>
                <option value="Стандарт">Стандарт</option>
                <option value="VIP">VIP</option>
                <option value="Спикер">Спикер</option>
                <option value="Пресса">Пресса</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Broadcast Notification Button */}
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="btn-secondary"
                title="Информировать участников (Рассылка)"
              >
                <Radio className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>Рассылка</span>
                {activeBroadcasts.length > 0 && (
                  <span className="font-mono text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 rounded text-zinc-700 dark:text-zinc-300">
                    {activeBroadcasts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => exportGuestsToCSV(activeGuests, activeEvent.title)}
                className="btn-secondary"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                Экспорт CSV
              </button>

              <button
                onClick={() => setCurrentSubTab('registration')}
                className="btn-primary"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Регистрация
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card-surface overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Участник</th>
                  <th className="py-2.5 px-3.5">Организация</th>
                  <th className="py-2.5 px-3.5">Контакты</th>
                  <th className="py-2.5 px-3.5">Категория</th>
                  <th className="py-2.5 px-3.5">Статус</th>
                  <th className="py-2.5 px-3.5">Код пропуска</th>
                  <th className="py-2.5 px-3.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/70 text-zinc-800 dark:text-zinc-200">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400">
                      Участники не найдены
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map(guest => (
                    <tr
                      key={guest.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                        <div>{guest.fullName}</div>
                        {guest.dietaryNotes && (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            Особенности: {guest.dietaryNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-300">
                        {guest.organization}
                      </td>

                      <td className="py-2.5 px-3.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        <div>{guest.email}</div>
                        <div>{guest.phone}</div>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                          guest.ticketType === 'VIP'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                            : guest.ticketType === 'Спикер'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {guest.ticketType}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <select
                          aria-label="Изменить статус участника"
                          value={guest.status}
                          onChange={e => updateGuest({ ...guest, status: e.target.value as GuestStatus })}
                          className="h-7 px-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 cursor-pointer"
                        >
                          <option value="registered">Зарегистрирован</option>
                          <option value="confirmed">Подтвержден</option>
                          <option value="checked_in">На площадке (Чек-ин)</option>
                          <option value="cancelled">Отменен</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                        <button
                          onClick={() => setViewTicketGuest(guest)}
                          className="hover:text-zinc-900 dark:hover:text-zinc-100 underline flex items-center gap-1"
                          title="Посмотреть QR билет"
                        >
                          <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{guest.qrCodeToken}</span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={() => deleteGuest(guest.id)}
                          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"
                          title="Удалить участника"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REGISTRATION FORM */}
      {currentSubTab === 'registration' && (
        <div className="max-w-xl mx-auto card-surface p-6">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {isGuestMode ? 'Регистрация на мероприятие' : 'Ручная регистрация нового гостя'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              После заполнения формы генерируется персональный QR-билет для прохода через терминал.
            </p>
          </div>

          <form onSubmit={handleRegSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                ФИО участника <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Иван Иванович Иванов"
                value={regForm.fullName}
                onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                className="input-base w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Электронная почта <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ivan@example.com"
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  className="input-base w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                  className="input-base w-full font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Организация / Компания
                </label>
                <input
                  type="text"
                  placeholder="ООО Технологии"
                  value={regForm.organization}
                  onChange={e => setRegForm({ ...regForm, organization: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Категория билета
                </label>
                <select
                  value={regForm.ticketType}
                  onChange={e => setRegForm({ ...regForm, ticketType: e.target.value as any })}
                  className="input-base w-full cursor-pointer"
                >
                  <option value="Стандарт">Стандартный билет</option>
                  <option value="VIP">VIP доступ</option>
                  <option value="Спикер">Спикер / Докладчик</option>
                  <option value="Пресса">Пресса и медиа</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Пожелания по питанию / Комментарий
              </label>
              <input
                type="text"
                placeholder="Вегетарианское меню, безглютен и т.д."
                value={regForm.dietaryNotes}
                onChange={e => setRegForm({ ...regForm, dietaryNotes: e.target.value })}
                className="input-base w-full"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto"
              >
                Подтвердить регистрацию и получить билет
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: QR CHECK-IN TERMINAL */}
      {currentSubTab === 'terminal' && !isGuestMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card-surface p-5 space-y-4">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                Терминал сканирования билетов на входе
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Введите токен из QR-кода или выберите участника для мгновенной фиксации явки
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Скан или ввод токена пропуска
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Например: EVT-evt-1-gst-10"
                    value={terminalToken}
                    onChange={e => {
                      setTerminalToken(e.target.value);
                      setTerminalSelectedGuestId('');
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleTerminalCheckIn();
                    }}
                    className="input-base flex-1 font-mono uppercase"
                  />
                  <button
                    onClick={handleTerminalCheckIn}
                    className="btn-primary"
                  >
                    Чек-ин
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Или быстрый выбор из списка ожидающих:
                </label>
                <select
                  value={terminalSelectedGuestId}
                  onChange={e => {
                    setTerminalSelectedGuestId(e.target.value);
                    setTerminalToken('');
                  }}
                  className="input-base w-full cursor-pointer"
                >
                  <option value="">-- Выберите гостя для отметки явки --</option>
                  {activeGuests
                    .filter(g => g.status !== 'checked_in')
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.fullName} ({g.organization}) — {g.qrCodeToken}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedTerminalGuest && (
              <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Найден участник</span>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{selectedTerminalGuest.fullName}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{selectedTerminalGuest.organization} • {selectedTerminalGuest.ticketType}</p>
                </div>
                <button
                  onClick={handleTerminalCheckIn}
                  className="btn-primary"
                >
                  Зафиксировать вход
                </button>
              </div>
            )}
          </div>

          <div className="card-surface p-5 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Последние отметки явки
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {activeGuests.filter(g => g.status === 'checked_in').length === 0 ? (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-6">
                  На площадку еще никто не прибыл
                </div>
              ) : (
                activeGuests
                  .filter(g => g.status === 'checked_in')
                  .slice(0, 10)
                  .map(g => (
                    <div key={g.id} className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{g.fullName}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{g.organization}</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                        Чек-ин
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SURVEYS & NPS */}
      {currentSubTab === 'surveys' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 card-surface p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Оставить отзыв о мероприятии
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Анкета удовлетворенности для расчета NPS и качества организации
              </p>
            </div>

            <form onSubmit={handleSurveySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Ваше имя (или оставьте пустым)
                </label>
                <input
                  type="text"
                  placeholder="Анонимный гость"
                  value={surveyName}
                  onChange={e => setSurveyName(e.target.value)}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Оценка мероприятия
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSurveyRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= surveyRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-zinc-300 dark:text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 ml-2">
                    {surveyRating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Отзыв / Впечатления <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Что понравилось, а что стоит улучшить?"
                  value={surveyFeedback}
                  onChange={e => setSurveyFeedback(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 resize-none"
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                <Send className="w-3.5 h-3.5" />
                Отправить отзыв
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 card-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Лента отзывов участников ({activeSurveys.length})
                </h3>
              </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activeSurveys.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  Отзывов пока нет. Будьте первыми, кто оставит впечатление!
                </div>
              ) : (
                activeSurveys.map(s => (
                  <div key={s.id} className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{s.guestName}</strong>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < s.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200 dark:text-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                        {new Date(s.submittedAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{s.feedback}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal (Center of Communication) */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/70">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Центр уведомлений и рассылок участникам
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Оповещения об изменении программы, напоминания о регистрации и опросы
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Fast Templates */}
              <div>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase block mb-1.5">
                  Быстрые шаблоны:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      applyBroadcastTemplate(
                        'Напоминание: старт регистрации через 1 час',
                        'Уважаемый участник! Регистрация на площадке начинается за 1 час до старта. Пожалуйста, приготовьте ваш электронный QR-билет для сканирования на входе.'
                      )
                    }
                    className="text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    ⏰ Напоминание о регистрации
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBroadcastTemplate(
                        'Обновление тайминга программы мероприятия',
                        'Внимание! В расписание ключевых докладов и сессий внесены небольшие уточнения. Ознакомиться со свежим таймингом можно во вкладке Календарь.'
                      )
                    }
                    className="text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    📢 Изменение программы
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBroadcastTemplate(
                        'Электронный билет и инструкция по проходу',
                        'Ваш персональный пропуск подтвержден. Предъявите QR-код билета из личного кабинета сотруднику зоны регистрации.'
                      )
                    }
                    className="text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    🎟 QR-билеты
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      applyBroadcastTemplate(
                        'Анкета обратной связи о мероприятии',
                        'Благодарим вас за участие! Пожалуйста, оставьте короткий отзыв и оценку во вкладке «Отзывы» — это займет не более 30 секунд.'
                      )
                    }
                    className="text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                  >
                    ⭐️ Сбор отзывов
                  </button>
                </div>
              </div>

              {/* Compose Broadcast Form */}
              <form onSubmit={handleBroadcastSubmit} className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Тема сообщения <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например: Обновление программы"
                      value={broadcastTitle}
                      onChange={e => setBroadcastTitle(e.target.value)}
                      className="input-base w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Аудитория получателей
                    </label>
                    <select
                      value={broadcastAudience}
                      onChange={e => setBroadcastAudience(e.target.value as any)}
                      className="input-base w-full cursor-pointer"
                    >
                      <option value="all">Все зарегистрированные ({getRecipientCount('all')} чел.)</option>
                      <option value="confirmed">Подтвержденные ({getRecipientCount('confirmed')} чел.)</option>
                      <option value="vip">VIP гости ({getRecipientCount('vip')} чел.)</option>
                      <option value="checked_in">Прибывшие на площадку ({getRecipientCount('checked_in')} чел.)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Текст рассылки <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Напишите текст сообщения для отправки..."
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    Получателей: <strong className="text-zinc-900 dark:text-zinc-100">{getRecipientCount(broadcastAudience)}</strong>
                  </span>
                  <button type="submit" className="btn-primary">
                    <Send className="w-3.5 h-3.5" />
                    Отправить рассылку
                  </button>
                </div>
              </form>

              {/* History Log */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mb-2">
                  <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  История отправленных рассылок ({activeBroadcasts.length})
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeBroadcasts.length === 0 ? (
                    <div className="text-xs text-zinc-400 dark:text-zinc-500 py-3 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
                      Рассылок еще не было
                    </div>
                  ) : (
                    activeBroadcasts.map(bc => (
                      <div key={bc.id} className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-zinc-900 dark:text-zinc-100 font-medium">{bc.title}</strong>
                          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                            {new Date(bc.sentAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed text-[11px]">{bc.message}</p>
                        <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                          <span className="px-1.5 py-0.2 bg-zinc-200/60 dark:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300">
                            {bc.audience}
                          </span>
                          <span>•</span>
                          <span>{bc.recipientCount} получателей</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="btn-secondary"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Boarding Pass / Badge Ticket Modal */}
      {viewTicketGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#141418] border border-zinc-300 dark:border-zinc-800 rounded-lg w-full max-w-sm shadow-md overflow-hidden flex flex-col">
            {/* Ticket Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/70">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="bg-white dark:bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700 inline-flex items-center">
                    <img src="/logo.png" alt="EventTech" className="h-3.5 w-auto object-contain" />
                  </div>
                  <span className="font-mono text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">
                    Электронный пропуск
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {activeEvent.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {activeEvent.location}
                </p>
              </div>
              <button
                onClick={() => setViewTicketGuest(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Perforation Line */}
            <div className="border-t border-dashed border-zinc-300 dark:border-zinc-800 my-0"></div>

            {/* Ticket Body */}
            <div className="p-5 text-center space-y-4">
              {/* SVG QR Code Pod - Explicitly pure white for camera scanner readability */}
              <div className="inline-block p-3 border border-zinc-200 rounded-md bg-white shadow-sm">
                <QRCodeSVG
                  value={viewTicketGuest.qrCodeToken}
                  size={140}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {viewTicketGuest.fullName}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {viewTicketGuest.organization}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block">Категория</span>
                  <strong className="text-zinc-800 dark:text-zinc-200">{viewTicketGuest.ticketType}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block">Статус</span>
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {viewTicketGuest.status === 'checked_in' ? 'На площадке' : 'Подтвержден'}
                  </strong>
                </div>
              </div>

              <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 py-1 px-2 rounded border border-zinc-200 dark:border-zinc-800">
                {viewTicketGuest.qrCodeToken}
              </div>

              <button
                type="button"
                onClick={() => setViewTicketGuest(null)}
                className="btn-primary w-full"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
