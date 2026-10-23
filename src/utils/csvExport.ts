import { GuestItem, BudgetItem } from '../types/event';

function downloadCSVFile(content: string, filename: string): void {
  // UTF-8 BOM prefix \uFEFF ensures proper Cyrillic display in Excel
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '""';
  const stringValue = String(field);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function exportGuestsToCSV(guests: GuestItem[], eventTitle: string): void {
  const headers = [
    'ID',
    'ФИО',
    'Email',
    'Телефон',
    'Организация',
    'Тип билета',
    'Статус',
    'QR-токен',
    'Дата регистрации',
    'Особые пожелания'
  ];

  const statusMap: Record<string, string> = {
    registered: 'Зарегистрирован',
    confirmed: 'Подтвержден',
    checked_in: 'На площадке (Check-in)',
    cancelled: 'Отменен'
  };

  const rows = guests.map(guest => [
    escapeCSV(guest.id),
    escapeCSV(guest.fullName),
    escapeCSV(guest.email),
    escapeCSV(guest.phone),
    escapeCSV(guest.organization),
    escapeCSV(guest.ticketType),
    escapeCSV(statusMap[guest.status] || guest.status),
    escapeCSV(guest.qrCodeToken),
    escapeCSV(new Date(guest.registeredAt).toLocaleString('ru-RU')),
    escapeCSV(guest.dietaryNotes || '—')
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\r\n');

  const safeTitle = eventTitle.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSVFile(csvContent, `Участники_${safeTitle}_${dateStr}.csv`);
}

export function exportBudgetToCSV(budget: BudgetItem[], eventTitle: string): void {
  const headers = [
    'ID',
    'Категория',
    'Статья расходов',
    'План (руб)',
    'Факт (руб)',
    'Отклонение (руб)',
    'Статус',
    'Заметки'
  ];

  const rows = budget.map(item => {
    const diff = item.actualAmount - item.plannedAmount;
    let statusText = 'В норме';
    if (diff > 0) statusText = `Перерасход (+${diff} ₽)`;
    else if (diff < 0) statusText = `Экономия (${Math.abs(diff)} ₽)`;

    return [
      escapeCSV(item.id),
      escapeCSV(item.category),
      escapeCSV(item.title),
      escapeCSV(item.plannedAmount),
      escapeCSV(item.actualAmount),
      escapeCSV(diff),
      escapeCSV(statusText),
      escapeCSV(item.notes || '—')
    ];
  });

  // Calculate totals
  const totalPlanned = budget.reduce((sum, i) => sum + (Number(i.plannedAmount) || 0), 0);
  const totalActual = budget.reduce((sum, i) => sum + (Number(i.actualAmount) || 0), 0);
  const totalDiff = totalActual - totalPlanned;
  const totalRow = [
    escapeCSV('ИТОГО'),
    escapeCSV('—'),
    escapeCSV('Все статьи расходов'),
    escapeCSV(totalPlanned),
    escapeCSV(totalActual),
    escapeCSV(totalDiff),
    escapeCSV(totalDiff > 0 ? 'Общий перерасход' : 'В рамках сметы'),
    escapeCSV('')
  ];

  const csvContent = [
    headers.map(h => `"${h}"`).join(';'),
    ...rows.map(row => row.join(';')),
    totalRow.join(';')
  ].join('\r\n');

  const safeTitle = eventTitle.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 40);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSVFile(csvContent, `Смета_Бюджет_${safeTitle}_${dateStr}.csv`);
}
