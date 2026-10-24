import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Plus,
  Mail,
  Phone,
  Trash2,
  X,
  UserPlus,
  Search,
  SlidersHorizontal,
  Star,
  CheckCircle,
  Building2,
  Check,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { TeamMember, ContractorItem, ContractorStatus, MarketplaceItem } from '../../types/event';
import { formatCurrency, pluralizeRu } from '../../utils/analytics';

export const TeamContractorsView: React.FC = () => {
  const {
    activeEvent,
    activeTeam,
    activeContractors,
    activeTasks,
    addTeamMember,
    deleteTeamMember,
    addContractor,
    updateContractor,
    deleteContractor,
    marketplaceItems,
    hireMarketplaceItem,
    setActiveTab,
    setSelectedTeamMemberFilter
  } = useEventContext();

  const [activeSection, setActiveSection] = useState<'team' | 'contractors' | 'marketplace'>('team');

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);

  // Marketplace search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'venue' | 'contractor'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(1000000);
  const [minCapacity, setMinCapacity] = useState<number>(0);

  // Comparison state (array of MarketplaceItem IDs, max 3)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Forms
  const [newMember, setNewMember] = useState<{
    fullName: string;
    roleTitle: string;
    zoneOfResponsibility: string;
    email: string;
    phone: string;
    systemRole: 'admin' | 'team';
  }>({
    fullName: '',
    roleTitle: '',
    zoneOfResponsibility: '',
    email: '',
    phone: '',
    systemRole: 'team'
  });

  const [newContractor, setNewContractor] = useState<{
    companyName: string;
    serviceType: string;
    contactPerson: string;
    phone: string;
    email: string;
    cost: number;
    status: ContractorStatus;
  }>({
    companyName: '',
    serviceType: '',
    contactPerson: '',
    phone: '',
    email: '',
    cost: 100000,
    status: 'negotiation'
  });

  if (!activeEvent) {
    return <div className="p-8 text-center text-xs text-zinc-400">Мероприятие не выбрано.</div>;
  }

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.fullName.trim() || !newMember.roleTitle.trim()) return;

    addTeamMember({
      eventId: activeEvent.id,
      fullName: newMember.fullName.trim(),
      roleTitle: newMember.roleTitle.trim(),
      zoneOfResponsibility: newMember.zoneOfResponsibility.trim(),
      email: newMember.email.trim(),
      phone: newMember.phone.trim(),
      systemRole: newMember.systemRole
    });

    setIsTeamModalOpen(false);
    setNewMember({
      fullName: '',
      roleTitle: '',
      zoneOfResponsibility: '',
      email: '',
      phone: '',
      systemRole: 'team'
    });
  };

  const handleContractorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractor.companyName.trim() || !newContractor.serviceType.trim()) return;

    addContractor({
      eventId: activeEvent.id,
      companyName: newContractor.companyName.trim(),
      serviceType: newContractor.serviceType.trim(),
      contactPerson: newContractor.contactPerson.trim(),
      phone: newContractor.phone.trim(),
      email: newContractor.email.trim(),
      cost: Math.max(0, Number(newContractor.cost) || 0),
      status: newContractor.status
    });

    setIsContractorModalOpen(false);
    setNewContractor({
      companyName: '',
      serviceType: '',
      contactPerson: '',
      phone: '',
      email: '',
      cost: 100000,
      status: 'negotiation'
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  // Filtered marketplace items
  const filteredMarketplace = marketplaceItems.filter(item => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (item.price > maxPrice) return false;
    if (minCapacity > 0 && (item.capacity || 0) < minCapacity) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.serviceType.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const comparedItems = marketplaceItems.filter(item => compareIds.includes(item.id));

  return (
    <div className="space-y-4">
      {/* Top Header & 3-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Команда, подрядчики и каталог
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Организационный комитет, нанятые подрядчики и поиск поставщиков со сравнением
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveSection('team')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeSection === 'team'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Команда ({activeTeam.length})
            </button>
            <button
              onClick={() => setActiveSection('contractors')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeSection === 'contractors'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Подрядчики ({activeContractors.length})
            </button>
            <button
              onClick={() => setActiveSection('marketplace')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeSection === 'marketplace'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Каталог площадок ({marketplaceItems.length})
            </button>
          </div>

          {activeSection === 'team' && (
            <button onClick={() => setIsTeamModalOpen(true)} className="btn-primary">
              <UserPlus className="w-3.5 h-3.5" />
              Добавить в команду
            </button>
          )}

          {activeSection === 'contractors' && (
            <button onClick={() => setIsContractorModalOpen(true)} className="btn-primary">
              <Plus className="w-3.5 h-3.5" />
              Добавить подрядчика
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: TEAM */}
      {activeSection === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeTeam.map(member => {
            const memberTasks = activeTasks.filter(t => t.assigneeId === member.id);
            const doneTasks = memberTasks.filter(t => t.status === 'done' || t.status.endsWith('-done'));
            return (
              <div
                key={member.id}
                className="card-surface p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {member.fullName}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {member.roleTitle}
                      </p>
                    </div>

                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 uppercase">
                      {member.systemRole === 'admin' ? 'Admin' : 'Team'}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 mb-3">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase block mb-0.5">
                      Зона ответственности
                    </span>
                    {member.zoneOfResponsibility || 'Общая координация'}
                  </div>

                  <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-zinc-400" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-zinc-400" />
                      <span>{member.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Clickable task count to filter TasksView */}
                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setSelectedTeamMemberFilter(member.id);
                      setActiveTab('tasks');
                    }}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-mono text-[11px] hover:underline flex items-center gap-1 group"
                    title="Показать все задачи этого сотрудника на доске"
                  >
                    <span>Задачи:</span>
                    <strong className="text-zinc-900 dark:text-zinc-100">{doneTasks.length}</strong>
                    <span>/ {memberTasks.length}</span>
                    <span className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">→</span>
                  </button>

                  {activeTeam.length > 1 && (
                    <button
                      onClick={() => deleteTeamMember(member.id)}
                      className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                      title="Удалить сотрудника"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 2: CONTRACTORS */}
      {activeSection === 'contractors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeContractors.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              Подрядчики еще не добавлены. Наймите их из Каталога площадок или добавьте вручную.
            </div>
          ) : (
            activeContractors.map(cont => (
              <div
                key={cont.id}
                className="card-surface p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {cont.companyName}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {cont.serviceType}
                      </p>
                    </div>

                    <select
                      aria-label="Статус договора с подрядчиком"
                      value={cont.status}
                      onChange={e => updateContractor({ ...cont, status: e.target.value as ContractorStatus })}
                      className={`h-7 px-2 rounded border text-xs font-medium focus:outline-none cursor-pointer transition-colors ${
                        cont.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70'
                          : cont.status === 'contracted'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/70'
                          : cont.status === 'negotiation'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/70'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <option value="negotiation" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Переговоры</option>
                      <option value="contracted" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Договор подписан</option>
                      <option value="paid" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Оплачено</option>
                      <option value="completed" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Услуга оказана</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">Контактное лицо:</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{cont.contactPerson}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-zinc-400 dark:text-zinc-500">Телефон:</span>
                      <span>{cont.phone}</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-zinc-400 dark:text-zinc-500">E-mail:</span>
                      <span>{cont.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="font-mono">
                    <span className="text-zinc-400 dark:text-zinc-500 text-[11px] mr-1">Сумма:</span>
                    <strong className="text-sm text-zinc-900 dark:text-zinc-100 font-semibold">{formatCurrency(cont.cost)}</strong>
                  </div>

                  <button
                    onClick={() => deleteContractor(cont.id)}
                    className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                    title="Удалить подрядчика"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SECTION 3: MARKETPLACE / VENDORS CATALOG */}
      {activeSection === 'marketplace' && (
        <div className="space-y-4">
          {/* Marketplace Toolbar & Filters */}
          <div className="card-surface p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Поиск по названию, городу, тегам..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-base pl-8 w-full"
                />
              </div>

              <select
                aria-label="Фильтр по категории"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value as any)}
                className="input-base text-xs h-8 cursor-pointer"
              >
                <option value="all">Все категории</option>
                <option value="venue">Площадки для мероприятий</option>
                <option value="contractor">Подрядчики и сервисы</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <span>Макс. бюджет:</span>
                <select
                  aria-label="Максимальный бюджет"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="input-base text-xs h-8 cursor-pointer font-mono"
                >
                  <option value={200000}>до 200 000 ₽</option>
                  <option value={400000}>до 400 000 ₽</option>
                  <option value={600000}>до 600 000 ₽</option>
                  <option value={1000000}>до 1 000 000 ₽</option>
                </select>
              </div>
            </div>

            {/* Comparison button */}
            <div className="flex items-center gap-2 shrink-0">
              {compareIds.length > 0 && (
                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="btn-primary"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Сравнить ({compareIds.length})
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarketplace.map(item => {
              const isCompared = compareIds.includes(item.id);
              const isAlreadyContracted = activeContractors.some(c => c.companyName === item.title);

              return (
                <div
                  key={item.id}
                  className={`card-surface p-4 flex flex-col justify-between transition-all ${
                    isCompared ? 'ring-2 ring-zinc-900 dark:ring-zinc-100 border-zinc-900 dark:border-zinc-100' : ''
                  }`}
                >
                  <div>
                    {/* Header: Category Badge & Compare Checkbox */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium">
                        {item.category === 'venue' ? 'Площадка' : 'Подрядчик'} • {item.serviceType}
                      </span>

                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400 select-none">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => toggleCompare(item.id)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 w-3.5 h-3.5"
                        />
                        <span className="text-[11px]">Сравнить</span>
                      </label>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 mt-1 mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium font-mono text-[11px]">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {item.rating}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500">({item.reviewsCount} отзывов)</span>
                      <span>•</span>
                      <span>{item.city}</span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
                      {item.description}
                    </p>

                    {/* Characteristics / Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {item.capacity && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                          до {item.capacity} гостей
                        </span>
                      )}
                      {item.tags.map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500 block font-medium">Стоимость</span>
                      <strong className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatCurrency(item.price)}
                      </strong>
                    </div>

                    {isAlreadyContracted ? (
                      <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" />
                        В проекте
                      </span>
                    ) : (
                      <button
                        onClick={() => hireMarketplaceItem(item)}
                        className="btn-primary"
                        title="Добавить в проект: подрядчик и статья сметы"
                      >
                        Привлечь
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/70">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Сравнение площадок и подрядчиков
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Сопоставление параметров, вместимости, рейтингов и сметной стоимости
                </p>
              </div>
              <button
                onClick={() => setIsCompareModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-2 px-3 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] font-medium w-36">Параметр</th>
                    {comparedItems.map(item => (
                      <th key={item.id} className="py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        {item.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/70 text-zinc-800 dark:text-zinc-200">
                  <tr>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Тип и категория</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[11px] border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {item.category === 'venue' ? 'Площадка' : 'Подрядчик'} • {item.serviceType}
                        </span>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Стоимость</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="py-2.5 px-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        {formatCurrency(item.price)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Вместимость</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="py-2.5 px-3 font-mono text-zinc-800 dark:text-zinc-200">
                        {item.capacity ? `${item.capacity} человек` : '—'}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Рейтинг и отзывы</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="py-2.5 px-3">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">
                          ★ {item.rating}
                        </span>{' '}
                        <span className="text-zinc-400 dark:text-zinc-500">({item.reviewsCount} отзывов)</span>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Город / Формат</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="py-2.5 px-3 text-zinc-800 dark:text-zinc-200">
                        {item.city} ({item.format})
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Особенности & Теги</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Контакты</td>
                    {comparedItems.map(item => (
                      <td key={item.id} className="py-2.5 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        <div>{item.contactPerson}</div>
                        <div>{item.phone}</div>
                        <div>{item.email}</div>
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Решение</td>
                    {comparedItems.map(item => {
                      const isAlreadyContracted = activeContractors.some(c => c.companyName === item.title);
                      return (
                        <td key={item.id} className="py-3 px-3">
                          {isAlreadyContracted ? (
                            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2 py-1 rounded inline-flex items-center gap-1 font-medium">
                              <Check className="w-3 h-3" />
                              В проекте
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                hireMarketplaceItem(item);
                                setIsCompareModalOpen(false);
                              }}
                              className="btn-primary"
                            >
                              Привлечь в проект
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Очистить выбор
              </button>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="btn-secondary"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Team Member */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/70">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Добавить участника команды</h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTeamSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">ФИО сотрудника *</label>
                <input
                  type="text"
                  required
                  placeholder="Иван Иванов"
                  value={newMember.fullName}
                  onChange={e => setNewMember({ ...newMember, fullName: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Должность / Роль *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Технический координатор"
                  value={newMember.roleTitle}
                  onChange={e => setNewMember({ ...newMember, roleTitle: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Зона ответственности</label>
                <input
                  type="text"
                  placeholder="Например: Сцена, свет и трансляция"
                  value={newMember.zoneOfResponsibility}
                  onChange={e => setNewMember({ ...newMember, zoneOfResponsibility: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="mail@event.ru"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Телефон</label>
                  <input
                    type="tel"
                    placeholder="+7 999 000-00-00"
                    value={newMember.phone}
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsTeamModalOpen(false)} className="btn-secondary">
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Contractor */}
      {isContractorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100">
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/70">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Добавить подрядчика</h3>
              <button onClick={() => setIsContractorModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleContractorSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Компания / Подрядчик *</label>
                <input
                  type="text"
                  required
                  placeholder="ООО Звук и Свет"
                  value={newContractor.companyName}
                  onChange={e => setNewContractor({ ...newContractor, companyName: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Тип услуги *</label>
                  <input
                    type="text"
                    required
                    placeholder="Звуковое оборудование"
                    value={newContractor.serviceType}
                    onChange={e => setNewContractor({ ...newContractor, serviceType: e.target.value })}
                    className="input-base w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Стоимость (₽)</label>
                  <input
                    type="number"
                    step="10000"
                    value={newContractor.cost}
                    onChange={e => setNewContractor({ ...newContractor, cost: Number(e.target.value) })}
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Контактное лицо</label>
                <input
                  type="text"
                  placeholder="Имя представителя"
                  value={newContractor.contactPerson}
                  onChange={e => setNewContractor({ ...newContractor, contactPerson: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Телефон</label>
                  <input
                    type="tel"
                    placeholder="+7 999 000-00-00"
                    value={newContractor.phone}
                    onChange={e => setNewContractor({ ...newContractor, phone: e.target.value })}
                    className="input-base w-full text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="info@company.ru"
                    value={newContractor.email}
                    onChange={e => setNewContractor({ ...newContractor, email: e.target.value })}
                    className="input-base w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsContractorModalOpen(false)} className="btn-secondary">
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
