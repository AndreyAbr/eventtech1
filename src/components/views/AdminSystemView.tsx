import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Layers,
  Users,
  Terminal,
  FileText,
  Database,
  Plus,
  Trash2,
  LogIn,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Search,
  Play,
  Server,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import {
  UserProfile,
  UserRole,
  EventType,
  SysCatalogItem,
  SqlExecutionResult
} from '../../types/event';
import { formatCurrency, formatDate } from '../../utils/analytics';

type AdminTab = 'constants' | 'catalogs' | 'users' | 'sql_console' | 'audit_log' | 'maintenance';

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
    resetDemoData,
    dbMeta,
    sysConfig,
    sysCatalogs,
    auditLog,
    tableStats,
    updateSysConfig,
    saveSysCatalogItem,
    deleteSysCatalogItem,
    executeSql,
    getTableInspectorData,
    downloadBackup,
    restoreBackup,
    refreshAuditLog,
    notify
  } = useEventContext();

  const [activeTab, setActiveTab] = useState<AdminTab>('constants');

  // ==========================================
  // 1. CONSTANTS STATE
  // ==========================================
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    const draft: Record<string, string> = {};
    for (const [key, item] of Object.entries(sysConfig)) {
      draft[key] = item.value;
    }
    setConfigDraft(draft);
  }, [sysConfig]);

  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    await updateSysConfig(configDraft);
    setIsSavingConfig(false);
  };

  // ==========================================
  // 2. CATALOGS STATE
  // ==========================================
  const [selectedCatalogType, setSelectedCatalogType] = useState<string>('budget_categories');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState<SysCatalogItem | null>(null);
  const [catalogForm, setCatalogForm] = useState<{
    code: string;
    name: string;
    color: string;
    sortOrder: number;
  }>({
    code: '',
    name: '',
    color: '#3B82F6',
    sortOrder: 1
  });

  const filteredCatalogs = useMemo(() => {
    return sysCatalogs
      .filter(item => item.catalogType === selectedCatalogType)
      .filter(item =>
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(catalogSearch.toLowerCase())
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sysCatalogs, selectedCatalogType, catalogSearch]);

  const handleOpenCatalogModal = (item?: SysCatalogItem) => {
    if (item) {
      setEditingCatalogItem(item);
      setCatalogForm({
        code: item.code,
        name: item.name,
        color: item.color,
        sortOrder: item.sortOrder
      });
    } else {
      setEditingCatalogItem(null);
      const currentItems = sysCatalogs.filter(c => c.catalogType === selectedCatalogType);
      const nextNum = currentItems.length + 1;
      const prefix = selectedCatalogType === 'budget_categories' ? 'BC' : selectedCatalogType === 'event_types' ? 'ET' : 'TC';
      setCatalogForm({
        code: `${prefix}-${nextNum < 10 ? '0' : ''}${nextNum}`,
        name: '',
        color: '#3B82F6',
        sortOrder: nextNum
      });
    }
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogForm.name.trim()) return;

    const itemToSave: SysCatalogItem = {
      id: editingCatalogItem ? editingCatalogItem.id : `cat-${Date.now().toString(36)}`,
      catalogType: selectedCatalogType,
      code: catalogForm.code.trim(),
      name: catalogForm.name.trim(),
      color: catalogForm.color,
      sortOrder: Number(catalogForm.sortOrder) || 1,
      isProtected: editingCatalogItem ? editingCatalogItem.isProtected : false
    };

    await saveSysCatalogItem(itemToSave);
    setIsCatalogModalOpen(false);
  };

  const handleDeleteCatalogItem = async (id: string, name: string) => {
    if (confirm(`Удалить элемент справочника «${name}»?`)) {
      await deleteSysCatalogItem(id);
    }
  };

  // ==========================================
  // 3. USERS STATE
  // ==========================================
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<{
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

  // Top 3 Core Admins sorted first
  const sortedAndFilteredUsers = useMemo(() => {
    const topAdminOrder = ['Андрей Абрамов', 'Данил Сивцев', 'Дмитрий Жирохов'];
    const copy = [...users].sort((a, b) => {
      const idxA = topAdminOrder.indexOf(a.name);
      const idxB = topAdminOrder.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return copy.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.position.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.email.trim()) return;
    registerUser(newUserData, false);
    setIsNewUserModalOpen(false);
    setNewUserData({
      name: '',
      email: '',
      role: 'team',
      position: '',
      phone: ''
    });
  };

  // ==========================================
  // 4. SQL CONSOLE & TABLE INSPECTOR
  // ==========================================
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM sys_config;');
  const [sqlResult, setSqlResult] = useState<SqlExecutionResult | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [selectedInspectorTable, setSelectedInspectorTable] = useState<string>('sys_config');

  const handleRunSql = async (queryToRun?: string) => {
    const q = (queryToRun !== undefined ? queryToRun : sqlQuery).trim();
    if (!q) return;
    setIsExecutingSql(true);
    const result = await executeSql(q);
    setSqlResult(result);
    setIsExecutingSql(false);
  };

  const handleSelectInspectorTable = async (tableName: string) => {
    setSelectedInspectorTable(tableName);
    const generatedQuery = `SELECT * FROM ${tableName} LIMIT 50;`;
    setSqlQuery(generatedQuery);
    await handleRunSql(generatedQuery);
  };

  const sqlPresets = [
    { label: 'Константы ИБ', query: 'SELECT * FROM sys_config;' },
    { label: 'Справочники метаданных', query: 'SELECT * FROM sys_catalogs ORDER BY catalogType, sortOrder;' },
    { label: 'Перерасход по смете (Факт > План)', query: "SELECT id, eventId, json_extract(data, '$.title') as title, json_extract(data, '$.category') as category, json_extract(data, '$.plannedAmount') as planned, json_extract(data, '$.actualAmount') as actual FROM budget_items WHERE CAST(json_extract(data, '$.actualAmount') AS INTEGER) > CAST(json_extract(data, '$.plannedAmount') AS INTEGER);" },
    { label: 'Задачи с критическим приоритетом', query: "SELECT id, eventId, json_extract(data, '$.title') as title, json_extract(data, '$.priority') as priority, json_extract(data, '$.deadline') as deadline FROM tasks WHERE json_extract(data, '$.priority') = 'critical';" },
    { label: 'Распределение пользователей по ролям', query: 'SELECT role, count(*) as user_count FROM users GROUP BY role;' },
    { label: 'Журнал регистрации (последние 20)', query: 'SELECT id, timestamp, userName, action, metadataObject, details FROM audit_log ORDER BY id DESC LIMIT 20;' }
  ];

  // ==========================================
  // 5. AUDIT LOG STATE
  // ==========================================
  const [auditSearch, setAuditSearch] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('all');

  const auditUsers = useMemo(() => {
    const set = new Set<string>();
    auditLog.forEach(log => set.add(log.userName));
    return Array.from(set);
  }, [auditLog]);

  const filteredAuditLog = useMemo(() => {
    return auditLog.filter(item => {
      const matchesSearch =
        item.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        item.metadataObject.toLowerCase().includes(auditSearch.toLowerCase()) ||
        item.details.toLowerCase().includes(auditSearch.toLowerCase());
      const matchesUser = auditUserFilter === 'all' || item.userName === auditUserFilter;
      return matchesSearch && matchesUser;
    });
  }, [auditLog, auditSearch, auditUserFilter]);

  // ==========================================
  // 6. MAINTENANCE STATE
  // ==========================================
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
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

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm(`Восстановить информационную базу из резервной копии «${file.name}»? Текущие данные будут перезаписаны.`)) {
          await restoreBackup(json);
        }
      } catch {
        notify('Ошибка чтения файла резервной копии (.json)', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.title.trim()) return;
    const newId = addEvent(newEventData);
    setActiveEventId(newId);
    setIsNewEventModalOpen(false);
    notify(`Мероприятие «${newEventData.title}» успешно создано`, 'success');
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Monolithic Frame */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-[#111114] shadow-sm flex flex-col min-h-[680px]">
        
        {/* System Configurator Banner / Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs">
              1C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  Конфигуратор информационной базы
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  ERP v2.6
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Регламентированное управление метаданными, справочниками и физической базой SQLite
              </div>
            </div>
          </div>

          {/* SQLite Telemetry Badge */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
              <Server className="w-3.5 h-3.5 text-zinc-500" />
              <span>{dbMeta.dbEngine}</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span>{dbMeta.dbSizeKB} КБ</span>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <span>{dbMeta.totalRecords} строк</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Онлайн
            </div>
          </div>
        </div>

        {/* 2-Pane Monolithic Body */}
        <div className="flex flex-1 flex-col md:flex-row min-h-0">
          
          {/* LEFT METADATA TREE PANE */}
          <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Дерево метаданных ИБ
              </div>

              <button
                onClick={() => setActiveTab('constants')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                  activeTab === 'constants'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-sm'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Константы и политика</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('catalogs')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                  activeTab === 'catalogs'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-sm'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Справочники</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'catalogs' ? 'bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                  {sysCatalogs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                  activeTab === 'users'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-sm'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Пользователи и роли</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'users' ? 'bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sql_console');
                  if (!sqlResult) handleRunSql();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                  activeTab === 'sql_console'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-sm'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Инспектор БД и SQL</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">13</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit_log');
                  refreshAuditLog();
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                  activeTab === 'audit_log'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-sm'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Журнал регистрации</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activeTab === 'audit_log' ? 'bg-zinc-700 dark:bg-zinc-300 text-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                  {auditLog.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('maintenance')}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                  activeTab === 'maintenance'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium shadow-sm'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>Администрирование</span>
                </div>
              </button>
            </div>

            {/* Current Session Info */}
            <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 px-2 py-1 text-[11px]">
              <div className="text-zinc-400 dark:text-zinc-500">Сеанс администратора:</div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {currentUser?.name || 'Андрей Абрамов'}
              </div>
              <div className="text-[10px] text-zinc-500">Права: Полный доступ</div>
            </div>
          </div>

          {/* RIGHT WORKSPACE PANE */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#111114]">

            {/* TAB 1: CONSTANTS & POLICY */}
            {activeTab === 'constants' && (
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Константы и финансовая политика ИБ
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Глобальные параметры системы. Вступают в силу немедленно после записи в SQLite.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingConfig ? 'Запись...' : 'Применить и записать в БД'}</span>
                  </button>
                </div>

                <div className="space-y-6 max-w-3xl">
                  {/* Group 1: General */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60 pb-1.5">
                      Основные реквизиты
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Наименование организации
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={configDraft['org_name'] || ''}
                          onChange={e => setConfigDraft(prev => ({ ...prev, org_name: e.target.value }))}
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Квота участников по умолчанию
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          value={configDraft['default_event_headcount'] || '200'}
                          onChange={e => setConfigDraft(prev => ({ ...prev, default_event_headcount: e.target.value }))}
                          className="w-40 px-2.5 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Finance & Budget Control Policy */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60 pb-1.5">
                      Финансово-бюджетный регламент
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block">
                          Строгий контроль лимита бюджета
                        </label>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          Режим 1С:Бюджетирование
                        </span>
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configDraft['strict_budget_control'] === 'true'}
                            onChange={e => setConfigDraft(prev => ({ ...prev, strict_budget_control: e.target.checked ? 'true' : 'false' }))}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span className="text-xs text-zinc-700 dark:text-zinc-300">
                            Запрещать проведение фактических расходов свыше лимита сметы мероприятия
                          </span>
                        </label>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800/40">
                          При включении: попытка ввести в таблице сметы факт, превышающий лимит мероприятия, блокируется предупреждением бюджетного контроля!
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Порог предупреждения об исчерпании (%)
                      </label>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="50"
                          max="100"
                          value={configDraft['budget_warning_threshold'] || '90'}
                          onChange={e => setConfigDraft(prev => ({ ...prev, budget_warning_threshold: e.target.value }))}
                          className="w-40 px-2.5 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Ставка налога / УСН / НДС (%)
                      </label>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={configDraft['tax_rate_percent'] || '0'}
                          onChange={e => setConfigDraft(prev => ({ ...prev, tax_rate_percent: e.target.value }))}
                          className="w-40 px-2.5 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                        <span className="text-xs text-zinc-400">0% — без налога, 6% — УСН Доходы, 20% — НДС</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Валюта регламентированного учета
                      </label>
                      <div className="sm:col-span-2">
                        <select
                          value={configDraft['default_currency'] || 'RUB'}
                          onChange={e => setConfigDraft(prev => ({ ...prev, default_currency: e.target.value }))}
                          className="w-40 px-2.5 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        >
                          <option value="RUB">Российский рубль (₽ / RUB)</option>
                          <option value="USD">Доллар США ($ / USD)</option>
                          <option value="EUR">Евро (€ / EUR)</option>
                          <option value="KZT">Казахстанский тенге (₸ / KZT)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Registration */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/60 pb-1.5">
                      Регистрация и аккредитация участников
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Публичная регистрация гостей
                      </label>
                      <div className="sm:col-span-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configDraft['allow_public_registration'] === 'true'}
                            onChange={e => setConfigDraft(prev => ({ ...prev, allow_public_registration: e.target.checked ? 'true' : 'false' }))}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span className="text-xs text-zinc-700 dark:text-zinc-300">
                            Разрешать самостоятельную регистрацию гостей на открытые мероприятия
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Мгновенный чек-ин по QR-коду
                      </label>
                      <div className="sm:col-span-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configDraft['auto_checkin_qr'] === 'true'}
                            onChange={e => setConfigDraft(prev => ({ ...prev, auto_checkin_qr: e.target.checked ? 'true' : 'false' }))}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span className="text-xs text-zinc-700 dark:text-zinc-300">
                            Проводить чек-ин автоматически при распознавании токена бейджа
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: METADATA CATALOGS */}
            {activeTab === 'catalogs' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Catalog Sub-tabs & Toolbar */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md text-xs font-medium">
                      <button
                        onClick={() => setSelectedCatalogType('budget_categories')}
                        className={`px-3 py-1 rounded transition-colors ${
                          selectedCatalogType === 'budget_categories'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        Справочник.СтатьиБюджета
                      </button>
                      <button
                        onClick={() => setSelectedCatalogType('event_types')}
                        className={`px-3 py-1 rounded transition-colors ${
                          selectedCatalogType === 'event_types'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        Справочник.ТипыМероприятий
                      </button>
                      <button
                        onClick={() => setSelectedCatalogType('ticket_categories')}
                        className={`px-3 py-1 rounded transition-colors ${
                          selectedCatalogType === 'ticket_categories'
                            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                        }`}
                      >
                        Справочник.КатегорииБилетов
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenCatalogModal()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Создать элемент</span>
                    </button>
                  </div>

                  {/* Search inside catalog */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Поиск по коду или наименованию элемента..."
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      className="w-full sm:w-80 pl-8 pr-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                  </div>
                </div>

                {/* Dense 1C Catalog Table */}
                <div className="flex-1 overflow-x-auto min-h-0">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-zinc-500 font-mono text-[11px]">
                        <th className="py-2 px-3 w-24">КОД</th>
                        <th className="py-2 px-3">НАИМЕНОВАНИЕ</th>
                        <th className="py-2 px-3 w-32">МАРКЕР</th>
                        <th className="py-2 px-3 w-24 text-center">ПОРЯДОК</th>
                        <th className="py-2 px-3 w-28">ТИП</th>
                        <th className="py-2 px-3 w-28 text-right">ДЕЙСТВИЯ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-normal">
                      {filteredCatalogs.map(item => (
                        <tr key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400 font-medium">
                            {item.code}
                          </td>
                          <td className="py-2 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-mono text-[11px] text-zinc-500">{item.color}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-zinc-600 dark:text-zinc-400">
                            {item.sortOrder}
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            {item.isProtected ? (
                              <span className="text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                Системный
                              </span>
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                                Пользователь
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenCatalogModal(item)}
                                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                title="Редактировать"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCatalogItem(item.id, item.name)}
                                className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCatalogs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                            Элементы справочника не найдены.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: USERS & ROLES */}
            {activeTab === 'users' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Users Toolbar */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Поиск пользователей..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 w-56"
                      />
                    </div>

                    <select
                      value={userRoleFilter}
                      onChange={e => setUserRoleFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                      <option value="all">Все роли ({users.length})</option>
                      <option value="organizer">Администраторы</option>
                      <option value="team">Команда</option>
                      <option value="guest">Гости / Участники</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setIsNewUserModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Создать пользователя</span>
                  </button>
                </div>

                {/* Dense 1C Users Table */}
                <div className="flex-1 overflow-x-auto min-h-0">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-zinc-500 font-mono text-[11px]">
                        <th className="py-2 px-3 w-28">КОД ID</th>
                        <th className="py-2 px-3">ФИО ПОЛЬЗОВАТЕЛЯ</th>
                        <th className="py-2 px-3">EMAIL</th>
                        <th className="py-2 px-3">ДОЛЖНОСТЬ</th>
                        <th className="py-2 px-3 w-32">РОЛЬ ИБ</th>
                        <th className="py-2 px-3 w-32 text-right">ДЕЙСТВИЯ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {sortedAndFilteredUsers.map(user => {
                        const isCurrent = currentUser?.id === user.id;
                        const isCoreDev = ['Андрей Абрамов', 'Данил Сивцев', 'Дмитрий Жирохов'].includes(user.name);

                        return (
                          <tr
                            key={user.id}
                            className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors ${
                              isCurrent ? 'bg-zinc-50 dark:bg-zinc-900/60 font-medium' : ''
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] text-zinc-500">
                              {user.id}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-700 dark:text-zinc-300 shrink-0">
                                  {user.avatarInitials}
                                </div>
                                <div className="truncate">
                                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                                    {user.name}
                                  </span>
                                  {isCoreDev && (
                                    <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 font-mono">
                                      CORE DEV
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400">
                                      (текущий)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                              {user.email}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
                              {user.position}
                            </td>
                            <td className="py-2 px-3">
                              {user.role === 'organizer' || user.role === 'admin' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                                  Администратор
                                </span>
                              ) : user.role === 'team' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  Команда
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  Гость
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                {!isCurrent && (
                                  <button
                                    onClick={() => loginAsUser(user.id)}
                                    className="px-2 py-0.5 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                                    title="Войти под этим пользователем"
                                  >
                                    Войти
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingUserId(user.id);
                                    setEditUserForm({
                                      name: user.name,
                                      email: user.email,
                                      position: user.position,
                                      role: user.role
                                    });
                                  }}
                                  className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                  title="Редактировать"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {!user.isSystemDefault && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Удалить пользователя «${user.name}»?`)) {
                                        deleteUserProfile(user.id);
                                      }
                                    }}
                                    className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                                    title="Удалить"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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
            )}

            {/* TAB 4: SQL CONSOLE & TABLE INSPECTOR */}
            {activeTab === 'sql_console' && (
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Left Mini Tables Selector */}
                <div className="w-full md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 p-2 overflow-y-auto">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-2 py-1">
                    Физические таблицы БД
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {tableStats.map(stat => (
                      <button
                        key={stat.tableName}
                        onClick={() => handleSelectInspectorTable(stat.tableName)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-mono transition-colors ${
                          selectedInspectorTable === stat.tableName
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                        }`}
                      >
                        <span className="truncate">{stat.tableName}</span>
                        <span className={`text-[10px] px-1 rounded ${selectedInspectorTable === stat.tableName ? 'bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                          {stat.rowCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right SQL Editor & Results */}
                <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 space-y-3 overflow-y-auto">
                  {/* Query Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pb-1">
                    <span className="text-[11px] text-zinc-400 mr-1">Быстрые выборки:</span>
                    {sqlPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSqlQuery(preset.query);
                          handleRunSql(preset.query);
                        }}
                        className="px-2 py-0.5 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* SQL Textarea */}
                  <div className="relative border border-zinc-300 dark:border-zinc-700 rounded-md overflow-hidden bg-zinc-900 text-zinc-100">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/80 border-b border-zinc-700/80 text-[11px] text-zinc-400">
                      <span>SQL Query Editor (better-sqlite3)</span>
                      <span className="font-mono text-[10px]">Ctrl+Enter для запуска</span>
                    </div>
                    <textarea
                      rows={4}
                      value={sqlQuery}
                      onChange={e => setSqlQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.ctrlKey && e.key === 'Enter') {
                          e.preventDefault();
                          handleRunSql();
                        }
                      }}
                      className="w-full p-3 font-mono text-xs bg-transparent text-zinc-100 focus:outline-none resize-y"
                      placeholder="Введите SQL запрос (SELECT, INSERT, UPDATE, DELETE, PRAGMA)..."
                    />
                    <div className="flex items-center justify-between p-2 bg-zinc-800/60 border-t border-zinc-700/60">
                      <div className="text-[11px] font-mono text-zinc-400">
                        Таблица: <span className="text-zinc-200">{selectedInspectorTable}</span>
                      </div>
                      <button
                        onClick={() => handleRunSql()}
                        disabled={isExecutingSql}
                        className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isExecutingSql ? 'Выполнение...' : 'Выполнить SQL'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Execution Metric Badge */}
                  {sqlResult && (
                    <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">Время:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {sqlResult.executionTimeMs} мс
                        </span>
                        <span className="text-zinc-500">Строк:</span>
                        <span className="text-zinc-900 dark:text-zinc-100">{sqlResult.rows?.length || 0}</span>
                        {sqlResult.changes !== undefined && (
                          <>
                            <span className="text-zinc-500">Изменено:</span>
                            <span className="text-zinc-900 dark:text-zinc-100">{sqlResult.changes}</span>
                          </>
                        )}
                      </div>
                      {sqlResult.error && (
                        <span className="text-red-500 font-semibold">{sqlResult.error}</span>
                      )}
                    </div>
                  )}

                  {/* Results Data Grid */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-x-auto max-h-80 min-h-[160px] bg-white dark:bg-[#0c0c0e]">
                    {sqlResult && sqlResult.columns && sqlResult.columns.length > 0 ? (
                      <table className="w-full text-left font-mono text-[11px] border-collapse">
                        <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800/90 z-10 border-b border-zinc-200 dark:border-zinc-700">
                          <tr>
                            {sqlResult.columns.map((col, idx) => (
                              <th key={idx} className="py-1.5 px-2.5 font-semibold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-700 last:border-r-0">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                          {sqlResult.rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                              {sqlResult.columns.map((col, colIdx) => {
                                const val = row[col];
                                const displayVal = typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val !== undefined ? val : '');
                                return (
                                  <td
                                    key={colIdx}
                                    className="py-1 px-2.5 text-zinc-800 dark:text-zinc-200 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 truncate max-w-xs"
                                    title={displayVal}
                                  >
                                    {displayVal}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        {isExecutingSql ? 'Выполнение запроса...' : 'Таблица результатов пуста.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AUDIT LOG */}
            {activeTab === 'audit_log' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Audit Toolbar */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Поиск по журналу регистрации..."
                        value={auditSearch}
                        onChange={e => setAuditSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 w-64"
                      />
                    </div>

                    <select
                      value={auditUserFilter}
                      onChange={e => setAuditUserFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                      <option value="all">Все пользователи</option>
                      {auditUsers.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => refreshAuditLog()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Обновить</span>
                  </button>
                </div>

                {/* Audit Log Table */}
                <div className="flex-1 overflow-x-auto min-h-0">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-zinc-500 font-mono text-[11px]">
                        <th className="py-2 px-3 w-16">ID</th>
                        <th className="py-2 px-3 w-36">ДАТА / ВРЕМЯ</th>
                        <th className="py-2 px-3 w-40">ПОЛЬЗОВАТЕЛЬ</th>
                        <th className="py-2 px-3 w-44">СОБЫТИЕ</th>
                        <th className="py-2 px-3 w-44">ОБЪЕКТ МЕТАДАННЫХ</th>
                        <th className="py-2 px-3">КОММЕНТАРИЙ / ПОДРОБНОСТИ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-[11px]">
                      {filteredAuditLog.map(log => (
                        <tr key={log.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                          <td className="py-2 px-3 text-zinc-400">#{log.id}</td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                            {formatDate(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                          </td>
                          <td className="py-2 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {log.userName}
                          </td>
                          <td className="py-2 px-3 text-zinc-800 dark:text-zinc-200">
                            {log.action}
                          </td>
                          <td className="py-2 px-3 text-zinc-500">
                            {log.metadataObject}
                          </td>
                          <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 truncate max-w-md">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                      {filteredAuditLog.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-400 text-xs">
                            Записи в журнале регистрации отсутствуют.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: MAINTENANCE & BACKUP */}
            {activeTab === 'maintenance' && (
              <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Администрирование и Резервное копирование ИБ
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Управление экземплярами мероприятий, полный дамп СУБД SQLite и восстановление данных.
                  </p>
                </div>

                {/* Section 1: Event Instance Management */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                      Информационные базы мероприятий ({events.length})
                    </span>
                    <button
                      onClick={() => setIsNewEventModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Создать мероприятие</span>
                    </button>
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                    {events.map(ev => {
                      const isActive = ev.id === activeEventId;
                      return (
                        <div
                          key={ev.id}
                          className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                            isActive ? 'bg-zinc-50 dark:bg-zinc-900/60 font-medium' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{ev.title}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                                {ev.type}
                              </span>
                              {isActive && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400">
                                  Активно в интерфейсе
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              Лимит: {formatCurrency(ev.totalBudgetLimit)} | Квота: {ev.plannedHeadcount} чел. | Даты: {formatDate(ev.startDate)} - {formatDate(ev.endDate)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isActive && (
                              <button
                                onClick={() => {
                                  setActiveEventId(ev.id);
                                  notify(`Переключено на мероприятие: «${ev.title}»`, 'info');
                                }}
                                className="px-2.5 py-1 rounded text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
                              >
                                Активировать
                              </button>
                            )}
                            {events.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm(`Удалить мероприятие «${ev.title}» и связанные данные?`)) {
                                    deleteEvent(ev.id);
                                  }
                                }}
                                className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
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
                </div>

                {/* Section 2: Backup & Restore */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Резервное копирование и восстановление ИБ
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Export */}
                    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium text-xs">
                        <Download className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        <span>Выгрузить информационную базу (.json)</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Формирует полный дамп всех физических таблиц SQLite, констант, справочников и пользователей в единый файл JSON.
                      </p>
                      <button
                        onClick={downloadBackup}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Скачать файл архива (.json)</span>
                      </button>
                    </div>

                    {/* Import */}
                    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
                      <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-medium text-xs">
                        <Upload className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        <span>Загрузить информационную базу из файла</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Восстанавливает таблицы базы данных из ранее сохраненного файла архива в режиме транзакции.
                      </p>
                      <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Выбрать файл архива (.json)...</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleRestoreFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 3: Reset Demo Database */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Сбросить информационную базу к эталонным демо-данным</span>
                      </div>
                      <div className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1">
                        Полная очистка и повторная инициализация всех таблиц SQLite из seedData.ts.
                      </div>
                    </div>
                    <button
                      onClick={() => setIsResetConfirmOpen(true)}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors shrink-0 shadow-sm"
                    >
                      Восстановить эталонную демо-базу
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT CATALOG ITEM                        */}
      {/* ======================================================== */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {editingCatalogItem ? 'Редактировать элемент' : 'Новый элемент справочника'}
              </h3>
              <button
                onClick={() => setIsCatalogModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCatalogSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Справочник метаданных
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    selectedCatalogType === 'budget_categories'
                      ? 'Справочник.СтатьиБюджета'
                      : selectedCatalogType === 'event_types'
                      ? 'Справочник.ТипыМероприятий'
                      : 'Справочник.КатегорииБилетов'
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Код элемента
                  </label>
                  <input
                    type="text"
                    required
                    value={catalogForm.code}
                    onChange={e => setCatalogForm(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Порядок
                  </label>
                  <input
                    type="number"
                    required
                    value={catalogForm.sortOrder}
                    onChange={e => setCatalogForm(prev => ({ ...prev, sortOrder: Number(e.target.value) || 1 }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Наименование
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Транспорт и логистика"
                  value={catalogForm.name}
                  onChange={e => setCatalogForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Цвет маркера
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={catalogForm.color}
                    onChange={e => setCatalogForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={catalogForm.color}
                    onChange={e => setCatalogForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-28 px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm"
                >
                  Записать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE USER                                       */}
      {/* ======================================================== */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Создание пользователя информационной базы
              </h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  ФИО пользователя
                </label>
                <input
                  type="text"
                  required
                  placeholder="Иванов Иван Иванович"
                  value={newUserData.name}
                  onChange={e => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@eventtech.ru"
                  value={newUserData.email}
                  onChange={e => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Должность / Специализация
                </label>
                <input
                  type="text"
                  placeholder="Инженер по безопасности площадки"
                  value={newUserData.position}
                  onChange={e => setNewUserData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Роль в системе
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={e => setNewUserData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="organizer">Администратор</option>
                    <option value="team">Команда</option>
                    <option value="guest">Гость / Участник</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Телефон
                  </label>
                  <input
                    type="text"
                    placeholder="+7 (999) 000-00-00"
                    value={newUserData.phone}
                    onChange={e => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm"
                >
                  Создать пользователя
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE EVENT                                      */}
      {/* ======================================================== */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Создание нового мероприятия ИБ
              </h3>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Название мероприятия
                </label>
                <input
                  type="text"
                  required
                  placeholder="Российский ИИ-Саммит 2026"
                  value={newEventData.title}
                  onChange={e => setNewEventData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Тип мероприятия
                  </label>
                  <select
                    value={newEventData.type}
                    onChange={e => setNewEventData(prev => ({ ...prev, type: e.target.value as EventType }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
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
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Лимит бюджета (₽)
                  </label>
                  <input
                    type="number"
                    required
                    value={newEventData.totalBudgetLimit}
                    onChange={e => setNewEventData(prev => ({ ...prev, totalBudgetLimit: Number(e.target.value) || 0 }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventData.startDate}
                    onChange={e => setNewEventData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventData.endDate}
                    onChange={e => setNewEventData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Место проведения
                </label>
                <input
                  type="text"
                  required
                  placeholder="Конгресс-центр Технопарка"
                  value={newEventData.location}
                  onChange={e => setNewEventData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-sm"
                >
                  Создать и активировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESET DEMO DATABASE CONFIRMATION                  */}
      {/* ======================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-[#111114] p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold">
                Подтверждение сброса базы данных
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Вы собираетесь сбросить физическую базу данных <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">data/eventtech.db</span> к эталонным демонстрационным данным.
              Все добавленные пользователи, задачи, изменения сметы и журнал аудита будут перезаписаны исходными данными.
            </p>
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  setIsResetConfirmOpen(false);
                  await resetDemoData();
                }}
                className="px-4 py-1.5 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-sm"
              >
                Да, выполнить сброс
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
