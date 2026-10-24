import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  Trash2,
  LogIn,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Wallet
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { UserProfile, UserRole, EventType } from '../../types/event';
import { formatCurrency, formatDate } from '../../utils/analytics';

export const AdminSystemView: React.FC = () => {
  const {
    users,
    currentUser,
    loginAsUser,
    registerUser,
    updateUserProfile,
    deleteUserProfile,
    events,
    activeEventId,
    setActiveEventId,
    addEvent,
    deleteEvent,
    resetDemoData
  } = useEventContext();

  const [adminSection, setAdminSection] = useState<'users' | 'events'>('users');

  // Search & Filter state for users
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Modal / Form: New User Profile
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    position: string;
    phone: string;
  }>({
    name: '',
    email: '',
    role: 'team',
    position: '',
    phone: ''
  });
  const [newUserError, setNewUserError] = useState<string | null>(null);

  // Inline Editing Profile
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    position: string;
    role: UserRole;
  }>({
    name: '',
    email: '',
    position: '',
    role: 'team'
  });

  // Modal: New Event
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState<{
    title: string;
    type: EventType;
    startDate: string;
    startTime: string;
    endDate: string;
    location: string;
    isOnline: boolean;
    description: string;
    goals: string;
    plannedHeadcount: number;
    totalBudgetLimit: number;
    leadOrganizer: string;
  }>({
    title: '',
    type: 'Конференция',
    startDate: new Date(Date.now() + 86400000 * 20).toISOString().split('T')[0],
    startTime: '09:30',
    endDate: new Date(Date.now() + 86400000 * 22).toISOString().split('T')[0],
    location: 'Конгресс-холл "Иннополис"',
    isOnline: false,
    description: '',
    goals: '',
    plannedHeadcount: 200,
    totalBudgetLimit: 2500000,
    leadOrganizer: currentUser?.name || 'Андрей Абрамов'
  });

  // Calculate System Summary
  const adminCount = users.filter(u => u.role === 'organizer' || u.role === 'admin').length;
  const teamCount = users.filter(u => u.role === 'team').length;
  const guestCount = users.filter(u => u.role === 'guest').length;
  const totalBudgetVolume = events.reduce((acc, ev) => acc + (ev.totalBudgetLimit || 0), 0);

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewUserError(null);
    if (!newUserData.name.trim() || !newUserData.email.trim()) {
      setNewUserError('Заполните ФИО и Email');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === newUserData.email.trim().toLowerCase())) {
      setNewUserError('Пользователь с таким email уже существует в системе');
      return;
    }

    registerUser(
      {
        name: newUserData.name.trim(),
        email: newUserData.email.trim().toLowerCase(),
        position: newUserData.position.trim() || (newUserData.role === 'organizer' ? 'Организатор' : 'Сотрудник'),
        role: newUserData.role,
        phone: newUserData.phone.trim() || undefined
      },
      false
    );

    setIsNewUserModalOpen(false);
    setNewUserData({
      name: '',
      email: '',
      role: 'team',
      position: '',
      phone: ''
    });
  };

  const startEditUser = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      position: user.position,
      role: user.role
    });
  };

  const saveEditUser = (userId: string) => {
    if (!editForm.name.trim() || !editForm.email.trim()) return;
    updateUserProfile(userId, {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      position: editForm.position.trim(),
      role: editForm.role
    });
    setEditingUserId(null);
  };

  const handleRoleChangeInline = (userId: string, newRole: UserRole) => {
    updateUserProfile(userId, { role: newRole });
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.title.trim()) return;
    const newId = addEvent({
      ...newEventData,
      plannedHeadcount: Math.max(1, Number(newEventData.plannedHeadcount) || 10),
      totalBudgetLimit: Math.max(0, Number(newEventData.totalBudgetLimit) || 0)
    });
    setIsNewEventModalOpen(false);
    setActiveEventId(newId);
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* 1. Page Header (Strict & Minimalist) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Настройки системы и пользователи
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Управление профилями команды, правами доступа и мероприятиями
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Вы уверены, что хотите сбросить всю базу данных к исходным демонстрационным данным? Все изменения будут удалены.')) {
                resetDemoData();
              }
            }}
            className="btn-secondary text-xs"
            title="Сброс базы данных к исходному состоянию"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Сбросить демо-данные</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Statistics Summary Bar */}
      <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
          <div>
            Пользователей:{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{users.length}</span>{' '}
            <span className="text-zinc-500">({adminCount} адм. • {teamCount} команда • {guestCount} гост.)</span>
          </div>
          <span>•</span>
          <div>
            Мероприятий:{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{events.length}</span>
          </div>
          <span>•</span>
          <div>
            Суммарный бюджет:{' '}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(totalBudgetVolume)}</span>
          </div>
        </div>
      </div>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setAdminSection('users')}
          className={`pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            adminSection === 'users'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Пользователи ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setAdminSection('events')}
          className={`pb-2.5 px-1 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            adminSection === 'events'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Все проекты ({events.length})
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {adminSection === 'users' && (
        <section className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Список зарегистрированных аккаунтов и настройка уровней доступа
            </div>

            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="btn-primary text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить пользователя
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по имени, email или должности..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-base w-full pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-500 shrink-0">Роль:</span>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value as any)}
                className="input-base text-xs cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Все роли ({users.length})</option>
                <option value="organizer">Администраторы ({adminCount})</option>
                <option value="team">Команда ({teamCount})</option>
                <option value="guest">Гости ({guestCount})</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-[#121216] shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 font-medium">
                    <th className="py-2.5 px-4">Пользователь</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Должность / Организация</th>
                    <th className="py-2.5 px-4">Роль в системе</th>
                    <th className="py-2.5 px-4 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {filteredUsers.map(user => {
                    const isCurrent = currentUser?.id === user.id;
                    const isEditing = editingUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors ${
                          isCurrent ? 'bg-zinc-100/40 dark:bg-zinc-800/20' : ''
                        }`}
                      >
                        {/* Name & Avatar */}
                        <td className="py-2.5 px-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              className="input-base text-xs py-1 px-2 w-full"
                            />
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium text-xs flex items-center justify-center shrink-0">
                                {user.avatarInitials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                    {user.name}
                                  </span>
                                  {isCurrent && (
                                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 font-medium">
                                      Вы
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Email */}
                        <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                          {isEditing ? (
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                              className="input-base text-xs py-1 px-2 w-full font-mono"
                            />
                          ) : (
                            user.email
                          )}
                        </td>

                        {/* Position */}
                        <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.position}
                              onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                              className="input-base text-xs py-1 px-2 w-full"
                            />
                          ) : (
                            user.position
                          )}
                        </td>

                        {/* Role Selector inline (Strict neutral input-base, no colored rainbow backgrounds) */}
                        <td className="py-2.5 px-4">
                          <select
                            value={isEditing ? editForm.role : user.role}
                            onChange={e => {
                              const newRole = e.target.value as UserRole;
                              if (isEditing) {
                                setEditForm({ ...editForm, role: newRole });
                              } else {
                                handleRoleChangeInline(user.id, newRole);
                              }
                            }}
                            className="input-base text-xs h-7 px-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                          >
                            <option value="organizer">Администратор</option>
                            <option value="team">Команда</option>
                            <option value="guest">Гость</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEditUser(user.id)}
                                  className="p-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 transition-colors"
                                  title="Сохранить изменения"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 transition-colors"
                                  title="Отмена"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEditUser(user)}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                  title="Редактировать данные"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {!isCurrent && (
                                  <button
                                    onClick={() => loginAsUser(user.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
                                    title="Войти под этим профилем для проверки прав"
                                  >
                                    <LogIn className="w-3 h-3 text-zinc-500" />
                                    <span>Войти</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    if (isCurrent) {
                                      alert('Нельзя удалить активный профиль, под которым вы сейчас авторизованы.');
                                      return;
                                    }
                                    if (window.confirm(`Удалить профиль пользователя «${user.name}»?`)) {
                                      deleteUserProfile(user.id);
                                    }
                                  }}
                                  disabled={isCurrent}
                                  className={`p-1.5 rounded transition-colors ${
                                    isCurrent
                                      ? 'opacity-30 cursor-not-allowed text-zinc-400'
                                      : 'text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                                  }`}
                                  title={isCurrent ? 'Нельзя удалить свой текущий профиль' : 'Удалить профиль'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: EVENTS MANAGEMENT */}
      {adminSection === 'events' && (
        <section className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Список всех мероприятий в системе и выбор текущего активного проекта
            </div>

            <button
              onClick={() => setIsNewEventModalOpen(true)}
              className="btn-primary text-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Создать мероприятие
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {events.map(ev => {
              const isActive = ev.id === activeEventId;
              return (
                <div
                  key={ev.id}
                  className={`p-4 rounded-lg border transition-all flex flex-col justify-between ${
                    isActive
                      ? 'border-zinc-900 dark:border-zinc-400 bg-zinc-50/70 dark:bg-zinc-800/30 ring-1 ring-zinc-900 dark:ring-zinc-400 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {ev.type}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center gap-1 font-mono">
                          <Check className="w-2.5 h-2.5" />
                          Активно
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {ev.title}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        <span>{formatDate(ev.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Wallet className="w-3 h-3 text-zinc-400" />
                        <span>Лимит: {formatCurrency(ev.totalBudgetLimit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => setActiveEventId(ev.id)}
                      disabled={isActive}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${
                        isActive
                          ? 'text-zinc-900 dark:text-zinc-100 font-semibold cursor-default'
                          : 'btn-secondary text-xs'
                      }`}
                    >
                      {isActive ? 'Выбрано сейчас' : 'Сделать активным'}
                    </button>

                    {events.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить мероприятие «${ev.title}»?`)) {
                            deleteEvent(ev.id);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                        title="Удалить мероприятие"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal: New User Profile */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md shadow-xl overflow-hidden flex flex-col animate-fade-in">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Регистрация нового профиля
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Создание аккаунта администратора, сотрудника или гостя
                </p>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  ФИО <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Сергей Васильев"
                  value={newUserData.name}
                  onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="input-base w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="s.vasiliev@eventtech.ru"
                  value={newUserData.email}
                  onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="input-base w-full text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Роль
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={e => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                    className="input-base w-full text-xs cursor-pointer"
                  >
                    <option value="organizer">Администратор</option>
                    <option value="team">Команда</option>
                    <option value="guest">Гость</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    placeholder="+7 999 123-45-67"
                    value={newUserData.phone}
                    onChange={e => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Должность / Организация
                </label>
                <input
                  type="text"
                  placeholder="Например: Руководитель отдела логистики"
                  value={newUserData.position}
                  onChange={e => setNewUserData({ ...newUserData, position: e.target.value })}
                  className="input-base w-full text-xs"
                />
              </div>

              {newUserError && (
                <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{newUserError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Создать профиль
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Event */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col animate-fade-in">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Новое мероприятие
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Добавление события в базу системы
                </p>
              </div>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Название события <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ИТ-Конференция «CodeTech 2026»"
                  value={newEventData.title}
                  onChange={e => setNewEventData({ ...newEventData, title: e.target.value })}
                  className="input-base w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Тип события
                  </label>
                  <select
                    value={newEventData.type}
                    onChange={e => setNewEventData({ ...newEventData, type: e.target.value as EventType })}
                    className="input-base w-full text-xs cursor-pointer"
                  >
                    <option value="Хакатон">Хакатон</option>
                    <option value="Конференция">Конференция</option>
                    <option value="Форум">Форум</option>
                    <option value="Воркшоп">Воркшоп</option>
                    <option value="Выставка">Выставка</option>
                    <option value="Корпоратив">Корпоратив</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Лимит бюджета (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newEventData.totalBudgetLimit}
                    onChange={e => setNewEventData({ ...newEventData, totalBudgetLimit: Number(e.target.value) })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    value={newEventData.startDate}
                    onChange={e => setNewEventData({ ...newEventData, startDate: e.target.value })}
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Гостей
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEventData.plannedHeadcount}
                    onChange={e => setNewEventData({ ...newEventData, plannedHeadcount: Number(e.target.value) })}
                    className="input-base w-full font-mono text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Создать и открыть
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
