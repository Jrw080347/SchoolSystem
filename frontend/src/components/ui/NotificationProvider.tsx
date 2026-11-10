'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { NOTIFICATION_EVENT } from '@/lib/notifications'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export type NotificationKind = 'success' | 'error'

interface NotificationState {
  kind: NotificationKind
  title: string
  message: string
}

interface NotificationContextValue {
  notify: (kind: NotificationKind, message: string, title?: string) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<NotificationState | null>(null)

  const notify = useCallback((kind: NotificationKind, message: string, title?: string) => {
    setNotification({
      kind,
      message,
      title: title || (kind === 'success' ? 'ดำเนินการสำเร็จ' : 'เกิดข้อผิดพลาด'),
    })
  }, [])

  const close = useCallback(() => setNotification(null), [])
  const modalRef = useRef<HTMLElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!notification) return
    previouslyFocused.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    modalRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused.current?.focus()
    }
  }, [notification, close])

  useEffect(() => {
    const fieldErrorText = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
      if (field.validity.valueMissing) return 'กรุณากรอกข้อมูลในช่องนี้'
      if (field.validity.typeMismatch) return 'รูปแบบข้อมูลไม่ถูกต้อง'
      if (field.validity.tooShort && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return `กรุณากรอกอย่างน้อย ${field.minLength} ตัวอักษร`
      if (field.validity.tooLong && (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return `กรุณากรอกไม่เกิน ${field.maxLength} ตัวอักษร`
      if (field.validity.rangeUnderflow && field instanceof HTMLInputElement) return `ค่าต้องไม่น้อยกว่า ${field.min}`
      if (field.validity.rangeOverflow && field instanceof HTMLInputElement) return `ค่าต้องไม่เกิน ${field.max}`
      if (field.validity.patternMismatch) return 'รูปแบบข้อมูลไม่ถูกต้องตามเงื่อนไข'
      if (field.validity.badInput) return 'กรุณากรอกข้อมูลให้ถูกต้อง'
      return 'ข้อมูลในช่องนี้ไม่ถูกต้อง'
    }

    const fieldParent = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) =>
      field.parentElement?.classList.contains('relative')
        ? field.parentElement.parentElement
        : field.parentElement

    const showFieldError = (target: EventTarget | null) => {
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return
      target.classList.add('!border-red-500', 'focus:!border-red-500', 'focus:!ring-red-500/20')
      target.setAttribute('aria-invalid', 'true')
      const parent = fieldParent(target)
      parent?.querySelector('.field-validation-message')?.remove()
      const message = document.createElement('p')
      message.className = 'field-validation-message mt-1 text-xs font-medium text-red-600'
      message.textContent = fieldErrorText(target)
      parent?.appendChild(message)
    }

    const clearFieldError = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return
      target.classList.remove('!border-red-500', 'focus:!border-red-500', 'focus:!ring-red-500/20')
      target.removeAttribute('aria-invalid')
      fieldParent(target)?.querySelector('.field-validation-message')?.remove()
    }

    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationState>).detail
      if (detail?.kind && detail?.message) setNotification({
        kind: detail.kind,
        message: detail.message,
        title: detail.title || (detail.kind === 'success' ? 'ดำเนินการสำเร็จ' : 'เกิดข้อผิดพลาด'),
      })
    }
    const handleInvalid = (event: Event) => showFieldError(event.target)
    document.addEventListener('invalid', handleInvalid, true)
    document.addEventListener('input', clearFieldError, true)
    document.addEventListener('change', clearFieldError, true)
    window.addEventListener(NOTIFICATION_EVENT, handleNotification)
    return () => {
      document.removeEventListener('invalid', handleInvalid, true)
      document.removeEventListener('input', clearFieldError, true)
      document.removeEventListener('change', clearFieldError, true)
      window.removeEventListener(NOTIFICATION_EVENT, handleNotification)
    }
  }, [])


  const value = useMemo<NotificationContextValue>(() => ({
    notify,
    success: (message, title) => notify('success', message, title),
    error: (message, title) => notify('error', message, title),
  }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {notification && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget) close()
          }}
        >
          <section
            ref={modalRef}
            tabIndex={-1}
            role={notification.kind === 'error' ? 'alertdialog' : 'dialog'}
            aria-modal="true"
            aria-labelledby="notification-title"
            aria-describedby="notification-message"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notification.kind === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {notification.kind === 'success'
                  ? <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
                  : <AlertCircle aria-hidden="true" className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="notification-title" className="text-lg font-semibold text-slate-900">{notification.title}</h2>
                <p id="notification-message" className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{notification.message}</p>
              </div>
              <button type="button" onClick={close} aria-label="ปิด" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                autoFocus
                onClick={close}
                className={`rounded-lg px-5 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${notification.kind === 'success' ? 'bg-primary-700 hover:bg-primary-800 focus-visible:ring-primary-600' : 'bg-red-700 hover:bg-red-800 focus-visible:ring-red-600'}`}
              >
                ตกลง
              </button>
            </div>
          </section>
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotification must be used within NotificationProvider')
  return context
}
