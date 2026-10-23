import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Plus,
  Mail,
  Phone,
  Trash2,
  X,
  UserPlus
} from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { TeamMember, ContractorItem, ContractorStatus } from '../../types/event';
import { formatCurrency } from '../../utils/analytics';

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
    deleteContractor
  } = useEventContext();

  const [activeSection, setActiveSection] = useState<'team' | 'contractors'>('team');

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      {/* Top Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
            Команда и подрядчики
          </h1>
          <p className="text-xs text-zinc-500">
            Организационный комитет, зоны ответственности и внешние контрагенты
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200">
            <button
              onClick={() => setActiveSection('team')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeSection === 'team'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Команда ({activeTeam.length})
            </button>
            <button
              onClick={() => setActiveSection('contractors')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeSection === 'contractors'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Подрядчики ({activeContractors.length})
            </button>
          </div>

          {activeSection === 'team' ? (
            <button onClick={() => setIsTeamModalOpen(true)} className="btn-primary">
              <UserPlus className="w-3.5 h-3.5" />
              Добавить
            </button>
          ) : (
            <button onClick={() => setIsContractorModalOpen(true)} className="btn-primary">
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: TEAM */}
      {activeSection === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeTeam.map(member => {
            const memberTasks = activeTasks.filter(t => t.assigneeId === member.id);
            const doneTasks = memberTasks.filter(t => t.status === 'done');
            return (
              <div
                key={member.id}
                className="card-surface p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900">
                        {member.fullName}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {member.roleTitle}
                      </p>
                    </div>

                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">
                      {member.systemRole === 'admin' ? 'Admin' : 'Team'}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-600 bg-zinc-50 p-2.5 rounded border border-zinc-200 mb-3">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase block mb-0.5">
                      Зона ответственности
                    </span>
                    {member.zoneOfResponsibility || 'Общая координация'}
                  </div>

                  <div className="space-y-1 text-xs text-zinc-500 mb-3 font-mono text-[11px]">
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

                <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono text-[11px]">
                    Задачи: <strong className="text-zinc-800">{doneTasks.length}</strong>/{memberTasks.length}
                  </span>

                  {activeTeam.length > 1 && (
                    <button
                      onClick={() => deleteTeamMember(member.id)}
                      className="text-zinc-400 hover:text-red-600 p-1"
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
          {activeContractors.map(cont => (
            <div
              key={cont.id}
              className="card-surface p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">
                      {cont.companyName}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {cont.serviceType}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-zinc-900 font-mono tabular-nums">
                      {formatCurrency(cont.cost)}
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase font-mono">Сумма</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 p-2.5 rounded border border-zinc-200 my-2">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-medium">Контакт</span>
                    <span className="text-zinc-800 font-medium">{cont.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400 block font-medium">Связь</span>
                    <span className="text-zinc-600 font-mono text-[11px]">{cont.phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-500">Статус:</span>
                  <select
                    aria-label="Сменить статус контракта"
                    value={cont.status}
                    onChange={e => updateContractor({ ...cont, status: e.target.value as ContractorStatus })}
                    className="h-7 px-2 rounded border border-zinc-200 bg-white text-xs font-medium focus:outline-none"
                  >
                    <option value="negotiation">Переговоры</option>
                    <option value="contracted">Договор подписан</option>
                    <option value="paid">Оплачено</option>
                    <option value="completed">Выполнено</option>
                  </select>
                </div>

                <button
                  onClick={() => deleteContractor(cont.id)}
                  className="text-zinc-400 hover:text-red-600 p-1"
                  title="Удалить подрядчика"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Team Member */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40">
          <div className="bg-white border border-zinc-200 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Новый сотрудник</h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTeamSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  ФИО <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Иван Петров"
                  value={newMember.fullName}
                  onChange={e => setNewMember({ ...newMember, fullName: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Роль / Должность <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Технический координатор"
                  value={newMember.roleTitle}
                  onChange={e => setNewMember({ ...newMember, roleTitle: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Зона ответственности
                </label>
                <input
                  type="text"
                  placeholder="Сценическое оборудование и звук"
                  value={newMember.zoneOfResponsibility}
                  onChange={e => setNewMember({ ...newMember, zoneOfResponsibility: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    required
                    value={newMember.phone}
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                    className="input-base w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Роль доступа</label>
                <select
                  value={newMember.systemRole}
                  onChange={e => setNewMember({ ...newMember, systemRole: e.target.value as 'admin' | 'team' })}
                  className="input-base w-full cursor-pointer"
                >
                  <option value="team">Участник команды (Team)</option>
                  <option value="admin">Администратор (Admin)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Contractor */}
      {isContractorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40">
          <div className="bg-white border border-zinc-200 rounded-lg w-full max-w-md shadow-md overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">Новый подрядчик</h3>
              <button
                onClick={() => setIsContractorModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleContractorSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Компания <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ООО «Монтаж Про»"
                  value={newContractor.companyName}
                  onChange={e => setNewContractor({ ...newContractor, companyName: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Услуга <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Звуковое сопровождение"
                  value={newContractor.serviceType}
                  onChange={e => setNewContractor({ ...newContractor, serviceType: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Сумма договора (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={newContractor.cost}
                    onChange={e => setNewContractor({ ...newContractor, cost: Math.max(0, Number(e.target.value)) })}
                    className="input-base w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Статус</label>
                  <select
                    value={newContractor.status}
                    onChange={e => setNewContractor({ ...newContractor, status: e.target.value as ContractorStatus })}
                    className="input-base w-full cursor-pointer"
                  >
                    <option value="negotiation">Переговоры</option>
                    <option value="contracted">Договор подписан</option>
                    <option value="paid">Оплачено</option>
                    <option value="completed">Выполнено</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Контактное лицо</label>
                <input
                  type="text"
                  placeholder="Менеджер"
                  value={newContractor.contactPerson}
                  onChange={e => setNewContractor({ ...newContractor, contactPerson: e.target.value })}
                  className="input-base w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={newContractor.phone}
                    onChange={e => setNewContractor({ ...newContractor, phone: e.target.value })}
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newContractor.email}
                    onChange={e => setNewContractor({ ...newContractor, email: e.target.value })}
                    className="input-base w-full"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsContractorModalOpen(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
