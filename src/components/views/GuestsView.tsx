import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  QrCode,
  MessageSquare,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Send,
  Download,
  X,
  Sparkles,
  Ticket,
  Clock,
  ScanLine
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEventContext } from '../../context/EventContext';
import { GuestItem, GuestStatus } from '../../types/event';
import { exportGuestsToCSV } from '../../utils/csvExport';

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

  // Search and filters for list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTicketType, setFilterTicketType] = useState<string>('all');

  // Registration Form State
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
    return <div className="p-8 text-center text-slate-400">Мероприятие не выбрано.</div>;
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

    // Reset form & show ticket preview
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
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
        {!isGuestMode && (
          <button
            onClick={() => setCurrentSubTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              currentSubTab === 'list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Список участников ({activeGuests.length})
          </button>
        )}

        <button
          onClick={() => setCurrentSubTab('registration')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            currentSubTab === 'registration'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          {isGuestMode ? 'Онлайн-регистрация & Билет' : 'Форма регистрации (Превью)'}
        </button>

        {!isGuestMode && (
          <button
            onClick={() => setCurrentSubTab('terminal')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              currentSubTab === 'terminal'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            Терминал QR Чек-ина
          </button>
        )}

        <button
          onClick={() => setCurrentSubTab('surveys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            currentSubTab === 'surveys'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Опросы и обратная связь ({activeSurveys.length})
        </button>
      </div>

      {/* SUBTAB 1: GUESTS LIST */}
      {currentSubTab === 'list' && !isGuestMode && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Поиск по ФИО, организации или email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <select
                aria-label="Фильтр по статусу участия"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Все статусы</option>
                <option value="registered">Зарегистрирован</option>
                <option value="confirmed">Подтвержден</option>
                <option value="checked_in">На площадке (Check-in)</option>
                <option value="cancelled">Отменен</option>
              </select>

              <select
                aria-label="Фильтр по типу билета"
                value={filterTicketType}
                onChange={e => setFilterTicketType(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Все билеты</option>
                <option value="Стандарт">Стандарт</option>
                <option value="VIP">VIP</option>
                <option value="Спикер">Спикер</option>
                <option value="Пресса">Пресса</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => exportGuestsToCSV(activeGuests, activeEvent.title)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Выгрузить в CSV</span>
              </button>

              <button
                onClick={() => setCurrentSubTab('registration')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Добавить гостя</span>
              </button>
            </div>
          </div>

          {/* Table of Guests */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Участник</th>
                    <th className="py-3 px-4">Организация</th>
                    <th className="py-3 px-4">Контакты</th>
                    <th className="py-3 px-4">Тип билета</th>
                    <th className="py-3 px-4">Статус</th>
                    <th className="py-3 px-4">QR-билет</th>
                    <th className="py-3 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Участники не найдены по заданным критериям
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map(guest => (
                      <tr
                        key={guest.id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="py-3 px-4 font-semibold text-white">
                          <div>{guest.fullName}</div>
                          {guest.dietaryNotes && (
                            <div className="text-[10px] text-amber-300 font-normal">
                              Диета: {guest.dietaryNotes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-300">
                          {guest.organization}
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          <div>{guest.email}</div>
                          <div className="text-[10px]">{guest.phone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              guest.ticketType === 'VIP'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : guest.ticketType === 'Спикер'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : guest.ticketType === 'Пресса'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {guest.ticketType}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <select
                            aria-label="Сменить статус участника"
                            value={guest.status}
                            onChange={e => updateGuest({ ...guest, status: e.target.value as GuestStatus })}
                            className={`rounded-lg px-2 py-1 text-xs font-semibold border ${
                              guest.status === 'checked_in'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : guest.status === 'confirmed'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : guest.status === 'registered'
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <option value="registered">Зарегистрирован</option>
                            <option value="confirmed">Подтвержден</option>
                            <option value="checked_in">На площадке (Check-in)</option>
                            <option value="cancelled">Отменен</option>
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          <button
                            onClick={() => setViewTicketGuest(guest)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                          >
                            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Открыть билет</span>
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => deleteGuest(guest.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Удалить запись гостя"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: REGISTRATION FORM */}
      {currentSubTab === 'registration' && (
        <div className="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/20">
              <Ticket className="w-6 h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Регистрация участника на мероприятие
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              «{activeEvent.title}» • {activeEvent.location}
            </p>
          </div>

          <form onSubmit={handleRegSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Фамилия и Имя участника <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Иван Иванов"
                value={regForm.fullName}
                onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Рабочий Email <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ivanov@company.ru"
                  value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Контактный телефон
                </label>
                <input
                  type="tel"
                  placeholder="+7 (999) 000-00-00"
                  value={regForm.phone}
                  onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Компания / Учебное заведение
                </label>
                <input
                  type="text"
                  placeholder="Например: Сбер, МГУ, Фриланс"
                  value={regForm.organization}
                  onChange={e => setRegForm({ ...regForm, organization: e.target.value })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Категория билета
                </label>
                <select
                  value={regForm.ticketType}
                  onChange={e => setRegForm({ ...regForm, ticketType: e.target.value as GuestItem['ticketType'] })}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Стандарт">Стандартный билет (Участник)</option>
                  <option value="VIP">VIP Делегат</option>
                  <option value="Спикер">Спикер / Ментор</option>
                  <option value="Пресса">Представитель СМИ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Особые пожелания или диетические ограничения (опционально)
              </label>
              <input
                type="text"
                placeholder="Например: Вегетарианское меню, доступ для маломобильных граждан"
                value={regForm.dietaryNotes}
                onChange={e => setRegForm({ ...regForm, dietaryNotes: e.target.value })}
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Зарегистрироваться и получить электронный билет</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: QR CHECK-IN TERMINAL */}
      {currentSubTab === 'terminal' && !isGuestMode && (
        <div className="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl animate-fade-in space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-600/20">
              <ScanLine className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Терминал экспресс QR-чекина на входе
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Сканируйте QR-код билета или введите токен для подтверждения прохода на площадку
            </p>
          </div>

          <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Быстрый выбор зарегистрированного гостя
              </label>
              <select
                value={terminalSelectedGuestId}
                onChange={e => {
                  setTerminalSelectedGuestId(e.target.value);
                  setTerminalToken('');
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Выберите участника из списка...</option>
                {activeGuests.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.fullName} ({g.ticketType}) — {g.status === 'checked_in' ? '✓ Уже на площадке' : 'Ожидает входа'}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 text-slate-500 text-[10px] font-bold">ИЛИ ВВЕДИТЕ ТОКЕН</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Код / Токен билета (QR-токен)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Например: EVT-evt-1-gst-1"
                  value={terminalToken}
                  onChange={e => {
                    setTerminalToken(e.target.value);
                    setTerminalSelectedGuestId('');
                  }}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Scanned Guest Preview Card */}
          {selectedTerminalGuest && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center gap-5 animate-scale-up">
              <div className="p-3 bg-white rounded-2xl shadow-md shrink-0">
                <QRCodeSVG value={selectedTerminalGuest.qrCodeToken} size={110} level="M" />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h4 className="text-base font-bold text-white">
                    {selectedTerminalGuest.fullName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {selectedTerminalGuest.ticketType}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Организация: <strong className="text-slate-200">{selectedTerminalGuest.organization}</strong>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Токен: {selectedTerminalGuest.qrCodeToken}
                </div>
                <div className="pt-1">
                  {selectedTerminalGuest.status === 'checked_in' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                      Чек-ин уже пройден
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <Clock className="w-4 h-4" />
                      Готов к проходу
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleTerminalCheckIn}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Отметить вход (Check-in)</span>
          </button>
        </div>
      )}

      {/* SUBTAB 4: SURVEYS & FEEDBACK */}
      {currentSubTab === 'surveys' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left (1 col): Survey Form */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Оставить отзыв о мероприятии
            </h3>

            <form onSubmit={handleSurveySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ваша оценка
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSurveyRating(star)}
                      className="p-1 text-slate-600 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= surveyRating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 font-mono ml-2">
                    {surveyRating} из 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ваше имя или организация
                </label>
                <input
                  type="text"
                  placeholder="Иван (Компания Х)"
                  value={surveyName}
                  onChange={e => setSurveyName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Отзыв и впечатления <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Что вам больше всего понравилось? Что можно улучшить в следующий раз?"
                  value={surveyFeedback}
                  onChange={e => setSurveyFeedback(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить отзыв</span>
              </button>
            </form>
          </div>

          {/* Right (2 cols): Reviews Feed */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Лента отзывов участников ({activeSurveys.length})
              </h3>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {activeSurveys.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Отзывы пока не оставлены. Станьте первым!
                </div>
              ) : (
                activeSurveys.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white">
                        {item.guestName}
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.feedback}
                    </p>

                    <div className="text-[10px] text-slate-500">
                      {new Date(item.submittedAt).toLocaleString('ru-RU')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Electronic Ticket Modal with QR Code */}
      {viewTicketGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative">
            {/* Ticket Header Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white text-center relative">
              <button
                onClick={() => setViewTicketGuest(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider mb-2 inline-block">
                Электронный билет
              </span>
              <h3 className="text-base font-bold leading-tight line-clamp-2">
                {activeEvent.title}
              </h3>
              <p className="text-xs text-indigo-200 mt-1">
                {activeEvent.location}
              </p>
            </div>

            {/* Ticket Perforated Divider */}
            <div className="relative flex items-center justify-between px-4 py-1">
              <div className="w-5 h-5 rounded-full bg-black -ml-6 border-r border-indigo-500/40"></div>
              <div className="border-b-2 border-dashed border-slate-700 flex-1 mx-2"></div>
              <div className="w-5 h-5 rounded-full bg-black -mr-6 border-l border-indigo-500/40"></div>
            </div>

            {/* Ticket Body with QR Code */}
            <div className="p-6 text-center space-y-4">
              <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
                <QRCodeSVG
                  value={viewTicketGuest.qrCodeToken}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-white">
                  {viewTicketGuest.fullName}
                </h4>
                <p className="text-xs text-slate-400">
                  {viewTicketGuest.organization}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Категория</span>
                  <strong className="text-indigo-400">{viewTicketGuest.ticketType}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Статус</span>
                  <strong className="text-emerald-400">
                    {viewTicketGuest.status === 'checked_in' ? 'На площадке' : 'Подтвержден'}
                  </strong>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Код билета: {viewTicketGuest.qrCodeToken}
              </div>

              <button
                type="button"
                onClick={() => setViewTicketGuest(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
