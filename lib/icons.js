const svg = (body, { width = 14, height = 14, viewBox = '0 0 24 24', strokeWidth = 1.5, fill = 'none' } = {}) => `<svg width="${width}" height="${height}" viewBox="${viewBox}" fill="${fill}" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

const PAID_MARK = '<path d="M10.3 7.35c-.5-.72-1.34-1.1-2.45-1.1-1.76 0-2.95.88-2.95 2.15 0 2.96 5.9 1.23 5.9 3.95 0 1.35-1.23 2.35-3 2.35-1.05 0-1.98-.31-2.78-.88"/><path d="M7.85 5.1v11.8"/><path d="m13.9 13.85 1.7 1.7 3.15-3.65"/>'

export const ICONS = Object.freeze({
  action_edit: svg('<path d="M7 13.161l5.464-5.464a1 1 0 0 1 1.415 0l2.12 2.12a1 1 0 0 1 0 1.415l-1.928 1.929"/><path d="m7 13.161-2.172 2.172a1 1 0 0 0-.218.327l-1.028 2.496c-.508 1.233.725 2.466 1.958 1.959l2.497-1.028c.122-.05.233-.125.326-.218l2.172-2.172"/>'),
  action_print: svg('<path d="M6 9V4.6A1.6 1.6 0 0 1 7.6 3h8.8A1.6 1.6 0 0 1 18 4.6V9"/><path d="M6 18H4.6A1.6 1.6 0 0 1 3 16.4v-4.8A1.6 1.6 0 0 1 4.6 10h14.8a1.6 1.6 0 0 1 1.6 1.6v4.8a1.6 1.6 0 0 1-1.6 1.6H18"/><path d="M6 14h12v7H6z"/><path d="M17 13h.01"/>'),
  action_approve: svg('<path d="m5 12 4 4L19 6"/>'),
  action_pay: svg(PAID_MARK),
  status_submitted: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'),
  status_approved: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>'),
  status_rejected: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  status_paid: svg(`<circle cx="12" cy="12" r="9"/>${PAID_MARK}`),
  activity_create: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
  activity_approved: svg('<path d="m5 12 4 4L19 6"/>'),
  activity_rejected: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  activity_reject: svg('<path d="M7 7l10 10M17 7 7 17"/>'),
  activity_paid: svg(PAID_MARK),
  activity_submitted: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'),
  activity_update: svg('<path d="M13.576 3.271a2.1 2.1 0 0 1 2.97 2.97L8.32 14.47a4 4 0 0 1-1.692 1.01L3.4 16.6l1.12-3.228a4 4 0 0 1 1.01-1.692z"/><path d="m12.06 4.788 2.97 2.97"/>'),
  activity_delete: svg('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 1h6a2 2 0 0 0 2-1l1-12"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>'),
  method_cash: svg('<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.75"/><path d="M6.5 9.5h.01M17.5 14.5h.01"/>'),
  method_card: svg('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18"/><path d="M7 15h3.5"/>'),
  method_cheque: svg('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6 13h5"/><path d="M14.5 10h3.5M14.5 13h3.5"/>'),
  'method_e-transfer': svg('<path d="M4 8h10"/><path d="m11 5 3 3-3 3"/><path d="M20 16H10"/><path d="m13 13-3 3 3 3"/>'),
  method_interac: svg('<path d="M4 8h10"/><path d="m11 5 3 3-3 3"/><path d="M20 16H10"/><path d="m13 13-3 3 3 3"/>'),
  'method_in-kind': svg('<path d="M12 20s-6-3.6-6-8.4A3.6 3.6 0 0 1 12 9a3.6 3.6 0 0 1 6 2.6C18 16.4 12 20 12 20Z"/><path d="M12 9V4"/>'),
})

const icon = (key, fallback = '') => ICONS[key] || fallback

export const actionIcon = name => icon(`action_${name}`, ICONS.action_edit)
export const activityIcon = badge => icon(`activity_${badge}`, ICONS.activity_update)
export const statusIcon = status => icon(`status_${status}`, '')
export const methodIcon = method => icon(`method_${method}`, ICONS.method_cash)
