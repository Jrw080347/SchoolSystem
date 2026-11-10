import type { NotificationKind } from '@/components/ui/NotificationProvider'

export const NOTIFICATION_EVENT = 'school-system:notification'

export function notifyUser(kind: NotificationKind, message: string, title?: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: { kind, message, title } }))
}

// Compatibility facade while existing pages migrate from transient toast feedback.
export const toast = {
  success: (message: string) => notifyUser('success', message),
  error: (message: string) => notifyUser('error', message),
}
