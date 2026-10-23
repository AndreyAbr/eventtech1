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
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEventContext } from '../../context/EventContext';
import { GuestItem, GuestStatus } from '../../types/event';
import { exportGuestsToCSV } from '../../utils/csvExport';
import { formatDate } from '../../utils/analytics';

export const GuestsView: React.FC = () => {
  const {
    activeEvent,
    activeGuests,
    activeSurveys,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Участники и билеты
          </h1>
          <p className="text-xs text-zinc-500">
            Реестр делегатов, регистрация, QR-пропуска и чек-ин
          </p>
        </div>

        {/* Sub-Navigation */}
        <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
          {!isGuestMode && (
            <button
              onClick={() => setCurrentSubTab('list')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                currentSubTab === 'list'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Список ({activeGuests.length})
            </button>
          )}

          <button
            onClick={() => setCurrentSubTab('registration')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              currentSubTab === 'registration'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {isGuestMode ? 'Онлайн-регистрация' : 'Регистрация'}
          </button>

          {!isGuestMode && (
            <button
              onClick={() => setCurrentSubTab('terminal')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                currentSubTab === 'terminal'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              QR Чек-ин
            </button>
          )}

          <button
            onClick={() => setCurrentSubTab('surveys')}
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              currentSubTab === 'surveys'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
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
            <div className="flex items-center gap-2.5 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-xs">
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportGuestsToCSV(activeGuests, activeEvent.title)}
                className="btn-secondary"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500" />
                Экспорт в CSV
              </button>

              <button
                onClick={() => setCurrentSubTab('registration')}
                className="btn-primary"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Добавить участника
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card-surface overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
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
              <tbody className="divide-y divide-zinc-200/80 text-zinc-800">
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
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-medium text-zinc-900">
                        <div>{guest.fullName}</div>
                        {guest.dietaryNotes && (
                          <div className="text-[10px] text-zinc-500">
                            Особенности: {guest.dietaryNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 text-zinc-600">
                        {guest.organization}
                      </td>

                      <td className="py-2.5 px-3.5 text-zinc-500 font-mono text-[11px]">
                        <div>{guest.email}</div>
                        <div className="text-[10px] text-zinc-400">{guest.phone}</div>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className="text-[11px] font-medium text-zinc-700 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {guest.ticketType}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <select
                          aria-label="Сменить статус участника"
                          value={guest.status}
                          onChange={e => updateGuest({ ...guest, status: e.target.value as GuestStatus })}
                          className={`h-7 px-2 rounded border text-xs font-medium focus:outline-none ${
                            guest.status === 'checked_in'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : guest.status === 'confirmed'
                              ? 'bg-zinc-100 text-zinc-800 border-zinc-200'
                              : guest.status === 'registered'
                              ? 'bg-white text-zinc-700 border-zinc-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <option value="registered">Зарегистрирован</option>
                          <option value="confirmed">Подтвержден</option>
                          <option value="checked_in">На площадке</option>
                          <option value="cancelled">Отменен</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <button
                          onClick={() => setViewTicketGuest(guest)}
                          className="font-mono text-xs bg-zinc-100 hover:bg-zinc-200/80 px-2 py-0.5 rounded text-zinc-700 border border-zinc-200 inline-flex items-center gap-1.5 transition-colors"
                        >
                          <QrCode className="w-3 h-3 text-zinc-500" />
                          <span>{guest.qrCodeToken}</span>
                        </button>
                      </td>

                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          onClick={() => deleteGuest(guest.id)}
                          className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
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
          <div className="border-b border-zinc-200 pb-3 mb-4">
            <h2 className="text-base font-semibold text-zinc-900">
              Регистрация участника
            </h2>
            <p className="text-xs text-zinc-500">
              «{activeEvent.title}» • {formatDate(activeEvent.startDate)}
            </p>
          </div>

          <form onSubmit={handleRegSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                ФИО участника <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Иван Иванов"
                value={regForm.fullName}
                onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                className="input-base w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ivanov@example.com"
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                  className="input-base w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Компания / Вуз
                </label>
                <input
                  type="text"
                  placeholder="Например: Яндекс, МГУ"
                  value={regForm.organization}
                  onChange={e => setRegForm({ ...regForm, organization: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Тип пропуска
                </label>
                <select
                  value={regForm.ticketType}
                  onChange={e => setRegForm({ ...regForm, ticketType: e.target.value as GuestItem['ticketType'] })}
                  className="input-base w-full cursor-pointer"
                >
                  <option value="Стандарт">Стандартный билет</option>
                  <option value="VIP">VIP</option>
                  <option value="Спикер">Спикер</option>
                  <option value="Пресса">Пресса</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Особые пожелания или диета
              </label>
              <input
                type="text"
                placeholder="Например: Вегетарианское меню"
                value={regForm.dietaryNotes}
                onChange={e => setRegForm({ ...regForm, dietaryNotes: e.target.value })}
                className="input-base w-full"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn-primary w-full h-9 text-xs"
              >
                Зарегистрировать и выпустить билет
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: QR CHECK-IN TERMINAL */}
      {currentSubTab === 'terminal' && !isGuestMode && (
        <div className="max-w-xl mx-auto card-surface p-6 space-y-4">
          <div className="border-b border-zinc-200 pb-3">
            <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-zinc-600" />
              Терминал прохода (QR Check-in)
            </h2>
            <p className="text-xs text-zinc-500">
              Поиск по номеру токена или выбор из списка прибывших участников
            </p>
          </div>

          <div className="space-y-3 bg-zinc-50 p-4 rounded-md border border-zinc-200">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Быстрый выбор участника
              </label>
              <select
                value={terminalSelectedGuestId}
                onChange={e => {
                  setTerminalSelectedGuestId(e.target.value);
                  setTerminalToken('');
                }}
                className="input-base w-full cursor-pointer"
              >
                <option value="">Выберите гостя...</option>
                {activeGuests.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.ticketType}) — {g.status === 'checked_in' ? '✓ Уже на площадке' : 'Ожидает входа'}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-center text-[10px] uppercase font-mono text-zinc-400">
              Или
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Токен пропуска
              </label>
              <input
                type="text"
                placeholder="EVT-evt-1-gst-1"
                value={terminalToken}
                onChange={e => {
                  setTerminalToken(e.target.value);
                  setTerminalSelectedGuestId('');
                }}
                className="input-base w-full font-mono"
              />
            </div>
          </div>

          {selectedTerminalGuest && (
            <div className="p-4 rounded-md border border-zinc-200 bg-white flex items-center gap-4">
              <div className="p-2 border border-zinc-200 rounded shrink-0">
                <QRCodeSVG value={selectedTerminalGuest.qrCodeToken} size={84} level="M" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-semibold text-zinc-900 text-sm">
                  {selectedTerminalGuest.fullName}
                </div>
                <div className="text-zinc-600">
                  {selectedTerminalGuest.organization} • <strong className="text-zinc-900">{selectedTerminalGuest.ticketType}</strong>
                </div>
                <div className="font-mono text-zinc-400 text-[11px]">
                  {selectedTerminalGuest.qrCodeToken}
                </div>
                <div>
                  {selectedTerminalGuest.status === 'checked_in' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Чек-ин пройден
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Clock className="w-3 h-3" />
                      Ожидает отметки
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleTerminalCheckIn}
            className="btn-primary w-full h-9 text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Подтвердить проход (Check-in)
          </button>
        </div>
      )}

      {/* SUBTAB 4: SURVEYS & FEEDBACK */}
      {currentSubTab === 'surveys' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-surface p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider pb-2 border-b border-zinc-200">
              Оставить отзыв
            </h3>

            <form onSubmit={handleSurveySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Оценка
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSurveyRating(star)}
                      className="p-1 text-zinc-300 hover:text-amber-500 transition-colors"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= surveyRating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-medium text-zinc-700 ml-2">
                    {surveyRating} из 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Имя / Организация
                </label>
                <input
                  type="text"
                  placeholder="Иван (Компания)"
                  value={surveyName}
                  onChange={e => setSurveyName(e.target.value)}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Отзыв <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Поделитесь впечатлениями..."
                  value={surveyFeedback}
                  onChange={e => setSurveyFeedback(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md bg-white border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                <Send className="w-3.5 h-3.5" />
                Отправить
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 card-surface p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider pb-2 border-b border-zinc-200">
              Лента отзывов ({activeSurveys.length})
            </h3>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {activeSurveys.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  Отзывов пока нет
                </div>
              ) : (
                activeSurveys.map(item => (
                  <div key={item.id} className="p-3 rounded border border-zinc-200 bg-zinc-50/50 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-900">{item.guestName}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= item.rating ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed">{item.feedback}</p>
                    <div className="text-[10px] font-mono text-zinc-400">
                      {new Date(item.submittedAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clean Boarding Pass / Badge Ticket Modal */}
      {viewTicketGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40">
          <div className="bg-white border border-zinc-300 rounded-lg w-full max-w-sm shadow-md overflow-hidden flex flex-col">
            {/* Ticket Header */}
            <div className="p-5 border-b border-zinc-200 flex items-start justify-between bg-zinc-50">
              <div>
                <span className="font-mono text-[10px] uppercase font-semibold text-zinc-500 tracking-wider block">
                  Электронный пропуск
                </span>
                <h3 className="text-sm font-semibold text-zinc-900 mt-0.5 leading-snug">
                  {activeEvent.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {activeEvent.location}
                </p>
              </div>
              <button
                onClick={() => setViewTicketGuest(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Perforation Line */}
            <div className="border-t border-dashed border-zinc-300 my-0"></div>

            {/* Ticket Body */}
            <div className="p-5 text-center space-y-4">
              <div className="inline-block p-3 border border-zinc-200 rounded-md bg-white shadow-sm">
                <QRCodeSVG
                  value={viewTicketGuest.qrCodeToken}
                  size={140}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div>
                <h4 className="text-base font-semibold text-zinc-900">
                  {viewTicketGuest.fullName}
                </h4>
                <p className="text-xs text-zinc-500">
                  {viewTicketGuest.organization}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-zinc-50 p-2.5 rounded border border-zinc-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block">Категория</span>
                  <strong className="text-zinc-800">{viewTicketGuest.ticketType}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-medium text-zinc-400 block">Статус</span>
                  <strong className="text-zinc-800">
                    {viewTicketGuest.status === 'checked_in' ? 'На площадке' : 'Подтвержден'}
                  </strong>
                </div>
              </div>

              <div className="font-mono text-xs text-zinc-500 bg-zinc-100 py-1 px-2 rounded border border-zinc-200">
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
