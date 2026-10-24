import React, { useState } from 'react';
import {
  Sun,
  Moon,
  ArrowRight,
  LogIn,
  UserPlus,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { UserRole } from '../../types/event';

export const AuthLandingView: React.FC = () => {
  const {
    users,
    loginAsUser,
    loginByEmail,
    registerUser,
    theme,
    toggleTheme
  } = useEventContext();

  const [activeTab, setActiveTab] = useState<'demo' | 'email' | 'register'>('demo');

  // Email form state
  const [emailInput, setEmailInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form state
  const [registerData, setRegisterData] = useState<{
    name: string;
    email: string;
    position: string;
    role: UserRole;
    phone: string;
  }>({
    name: '',
    email: '',
    position: '',
    role: 'team',
    phone: ''
  });
  const [registerError, setRegisterError] = useState<string | null>(null);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!emailInput.trim()) {
      setLoginError('Введите адрес электронной почты');
      return;
    }
    const success = loginByEmail(emailInput.trim());
    if (!success) {
      setLoginError('Профиль с таким email не найден. Выберите профиль из списка или зарегистрируйтесь.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    if (!registerData.name.trim() || !registerData.email.trim()) {
      setRegisterError('Заполните обязательные поля: ФИО и Email');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === registerData.email.trim().toLowerCase())) {
      setRegisterError('Пользователь с таким email уже существует в системе');
      return;
    }

    registerUser(
      {
        name: registerData.name.trim(),
        email: registerData.email.trim().toLowerCase(),
        position:
          registerData.position.trim() ||
          (registerData.role === 'organizer' ? 'Администратор' : registerData.role === 'guest' ? 'Гость' : 'Специалист'),
        role: registerData.role,
        phone: registerData.phone.trim() || undefined
      },
      true
    );
  };

  // Group users into Admins (Developers) and Team/Guests
  const adminUsers = users.filter(u => u.role === 'organizer' || u.role === 'admin');
  const regularUsers = users.filter(u => u.role !== 'organizer' && u.role !== 'admin');

  const getRoleBadge = (role: UserRole) => {
    const label = role === 'organizer' || role === 'admin' ? 'Админ' : role === 'team' ? 'Команда' : 'Гость';
    return (
      <span className="font-mono text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900 font-sans">
      {/* 1. Minimal Top Header */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-6 sm:px-8 flex items-center justify-between bg-white dark:bg-[#0C0C0E]">
        <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <img
            src="/logo.png"
            alt="EventTech"
            className="h-4 w-auto object-contain sidebar-brand-logo"
          />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Hub
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 inline-flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          title="Переключить тему оформления"
          aria-label="Переключить тему"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-zinc-300" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600" />
          )}
        </button>
      </header>

      {/* 2. Centered Authentication Terminal (Linear / Vercel style) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-[460px] mx-auto space-y-5">
          {/* Title and subtitle */}
          <div className="text-left space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Вход в рабочее пространство
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Выберите профиль для быстрого входа или авторизуйтесь по Email
            </p>
          </div>

          {/* Segmented Control */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setActiveTab('demo');
                setLoginError(null);
                setRegisterError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'demo'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Быстрый вход (Демо)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setLoginError(null);
                setRegisterError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'email'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              По Email
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setLoginError(null);
                setRegisterError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'register'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Tab 1: Fast Demo Login */}
          {activeTab === 'demo' && (
            <div className="space-y-4 animate-fade-in">
              {/* Group 1: Admins (Developers) */}
              <div className="space-y-1.5">
                <div className="px-1 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <span>Администраторы (Разработчики)</span>
                  <span className="text-[10px]">{adminUsers.length}</span>
                </div>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#121215] divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden shadow-xs">
                  {adminUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => loginAsUser(u.id)}
                      className="w-full text-left py-2.5 px-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {u.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                              {u.name}
                            </span>
                            {getRoleBadge(u.role)}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {u.position}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Group 2: Team and Guests */}
              <div className="space-y-1.5">
                <div className="px-1 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <span>Команда и участники</span>
                  <span className="text-[10px]">{regularUsers.length}</span>
                </div>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#121215] divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden shadow-xs">
                  {regularUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => loginAsUser(u.id)}
                      className="w-full text-left py-2.5 px-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {u.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                              {u.name}
                            </span>
                            {getRoleBadge(u.role)}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {u.position}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Email Login */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-3.5 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 bg-white dark:bg-[#121215] shadow-xs animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Рабочий Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="a.abramov@eventtech.ru"
                    className="input-base w-full pl-8 text-xs font-mono"
                    autoFocus
                  />
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Подсказка: a.abramov@eventtech.ru, d.sivtsev@eventtech.ru, d.zhirokhov@eventtech.ru
                </p>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center h-9 text-xs"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                Войти в систему
              </button>
            </form>
          )}

          {/* Tab 3: Register */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 bg-white dark:bg-[#121215] shadow-xs animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  ФИО <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Иван Петров"
                  value={registerData.name}
                  onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
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
                  placeholder="petrov@eventtech.ru"
                  value={registerData.email}
                  onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                  className="input-base w-full text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Роль
                  </label>
                  <select
                    value={registerData.role}
                    onChange={e => setRegisterData({ ...registerData, role: e.target.value as UserRole })}
                    className="input-base w-full text-xs cursor-pointer"
                  >
                    <option value="organizer">Администратор</option>
                    <option value="team">Команда</option>
                    <option value="guest">Гость</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Должность
                  </label>
                  <input
                    type="text"
                    placeholder="Инженер"
                    value={registerData.position}
                    onChange={e => setRegisterData({ ...registerData, position: e.target.value })}
                    className="input-base w-full text-xs"
                  />
                </div>
              </div>

              {registerError && (
                <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{registerError}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full justify-center h-9 text-xs"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Создать профиль и войти
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
