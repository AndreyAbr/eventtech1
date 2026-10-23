import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  PlusCircle,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  Clock,
  Building,
  Edit2,
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
    updateTeamMember,
    deleteTeamMember,
    addContractor,
    updateContractor,
    deleteContractor
  } = useEventContext();

  // Active section tab: 'team' | 'contractors'
  const [activeSection, setActiveSection] = useState<'team' | 'contractors'>('team');

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);

  // New Team Member Form
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

  // New Contractor Form
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
    return <div className="p-8 text-center text-slate-400">Мероприятие не выбрано.</div>;
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

  const contractorStatuses: { id: ContractorStatus; label: string; color: string }[] = [
    { id: 'negotiation', label: 'Переговоры', color: 'bg-slate-800 text-slate-300 border-slate-700' },
    { id: 'contracted', label: 'Договор подписан', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    { id: 'paid', label: 'Оплачено', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    { id: 'completed', label: 'Выполнено', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSection('team')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSection === 'team'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Команда организаторов ({activeTeam.length})
          </button>

          <button
            onClick={() => setActiveSection('contractors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSection === 'contractors'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Подрядчики и партнеры ({activeContractors.length})
          </button>
        </div>

        {activeSection === 'team' ? (
          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            Добавить сотрудника
          </button>
        ) : (
          <button
            onClick={() => setIsContractorModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            Добавить подрядчика
          </button>
        )}
      </div>

      {/* SECTION 1: TEAM MEMBERS */}
      {activeSection === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTeam.map(member => {
            const memberTasks = activeTasks.filter(t => t.assigneeId === member.id);
            const doneTasks = memberTasks.filter(t => t.status === 'done');
            return (
              <div
                key={member.id}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">
                        {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                          {member.fullName}
                        </h4>
                        <p className="text-xs text-indigo-400 font-medium">
                          {member.roleTitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        member.systemRole === 'admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {member.systemRole === 'admin' ? 'Admin' : 'Команда'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 mb-3">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
                      Зона ответственности:
                    </span>
                    {member.zoneOfResponsibility || 'Общие организационные задачи'}
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{member.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Tasks Summary & Delete */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Задачи:</span>
                    <span className="font-semibold text-white font-mono">
                      {doneTasks.length} / {memberTasks.length} выполнено
                    </span>
                  </div>

                  {activeTeam.length > 1 && (
                    <button
                      onClick={() => deleteTeamMember(member.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
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

      {/* SECTION 2: CONTRACTORS & VENUES */}
      {activeSection === 'contractors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeContractors.map(cont => {
            return (
              <div
                key={cont.id}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/40 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-400" />
                        {cont.companyName}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 font-medium">
                        {cont.serviceType}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white font-mono">
                        {formatCurrency(cont.cost)}
                      </div>
                      <div className="text-[10px] text-slate-400">Стоимость контракта</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 my-3">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Контактное лицо</span>
                      <strong className="text-slate-200">{cont.contactPerson}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Телефон & Связь</span>
                      <strong className="text-slate-200">{cont.phone}</strong>
                    </div>
                  </div>
                </div>

                {/* Status Switcher & Delete */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Статус:</span>
                    <select
                      aria-label="Сменить статус контракта"
                      value={cont.status}
                      onChange={e => updateContractor({ ...cont, status: e.target.value as ContractorStatus })}
                      className="bg-slate-800 text-xs font-semibold text-white rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none"
                    >
                      <option value="negotiation">Переговоры</option>
                      <option value="contracted">Договор подписан</option>
                      <option value="paid">Оплачено</option>
                      <option value="completed">Выполнено</option>
                    </select>
                  </div>

                  <button
                    onClick={() => deleteContractor(cont.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition"
                    title="Удалить подрядчика"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Team Member */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                Новый участник команды
              </h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTeamSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ФИО сотрудника <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Иван Петров"
                  value={newMember.fullName}
                  onChange={e => setNewMember({ ...newMember, fullName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Роль в оргкомитете <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Технический координатор"
                  value={newMember.roleTitle}
                  onChange={e => setNewMember({ ...newMember, roleTitle: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Зона ответственности
                </label>
                <input
                  type="text"
                  placeholder="Например: Звуковое оборудование и Wi-Fi"
                  value={newMember.zoneOfResponsibility}
                  onChange={e => setNewMember({ ...newMember, zoneOfResponsibility: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="petrov@eventtech.pro"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Телефон</label>
                  <input
                    type="tel"
                    required
                    placeholder="+7 (999) 000-00-00"
                    value={newMember.phone}
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Системная роль доступа
                </label>
                <select
                  value={newMember.systemRole}
                  onChange={e => setNewMember({ ...newMember, systemRole: e.target.value as 'admin' | 'team' })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="team">Участник команды (Team)</option>
                  <option value="admin">Администратор (Admin)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Contractor */}
      {isContractorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Новый подрядчик или партнер
              </h3>
              <button
                onClick={() => setIsContractorModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContractorSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Название компании <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ООО «Звук и Свет»"
                  value={newContractor.companyName}
                  onChange={e => setNewContractor({ ...newContractor, companyName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Предоставляемая услуга <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Монтаж сценического оборудования"
                  value={newContractor.serviceType}
                  onChange={e => setNewContractor({ ...newContractor, serviceType: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Стоимость договора (₽)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={newContractor.cost}
                    onChange={e => setNewContractor({ ...newContractor, cost: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Статус
                  </label>
                  <select
                    value={newContractor.status}
                    onChange={e => setNewContractor({ ...newContractor, status: e.target.value as ContractorStatus })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="negotiation">Переговоры</option>
                    <option value="contracted">Договор подписан</option>
                    <option value="paid">Оплачено</option>
                    <option value="completed">Выполнено</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Контактное лицо
                </label>
                <input
                  type="text"
                  placeholder="Менеджер проекта"
                  value={newContractor.contactPerson}
                  onChange={e => setNewContractor({ ...newContractor, contactPerson: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Телефон</label>
                  <input
                    type="tel"
                    placeholder="+7 (495) 000-00-00"
                    value={newContractor.phone}
                    onChange={e => setNewContractor({ ...newContractor, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sales@company.ru"
                    value={newContractor.email}
                    onChange={e => setNewContractor({ ...newContractor, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsContractorModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition"
                >
                  Добавить подрядчика
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
