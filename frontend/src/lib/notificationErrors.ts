export interface ParsedApiError {
  message: string
  fieldErrors: Record<string, string>
}

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const errorMessage = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (isRecord(value)) {
    for (const key of ['message', 'detail', 'error', 'title']) {
      const candidate = value[key]
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    }
  }
  return undefined
}

const parseFieldErrors = (value: unknown): Record<string, string> => {
  if (Array.isArray(value)) {
    return value.reduce<Record<string, string>>((result, item) => {
      if (!isRecord(item)) return result
      const field = item.field ?? item.propertyPath ?? item.name
      const message = item.message ?? item.defaultMessage ?? item.reason
      if (typeof field === 'string' && typeof message === 'string' && message.trim()) {
        result[field] = message.trim()
      }
      return result
    }, {})
  }

  if (!isRecord(value)) return {}
  return Object.entries(value).reduce<Record<string, string>>((result, [field, detail]) => {
    const message = errorMessage(detail)
    if (message) result[field] = message
    return result
  }, {})
}

export function parseApiError(error: unknown, fallback = 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'): ParsedApiError {
  const root = isRecord(error) ? error : {}
  const response = isRecord(root.response) ? root.response : {}
  const body = isRecord(response.data) ? response.data : isRecord(root.data) ? root.data : root
  const nested = isRecord(body.data) ? body.data : {}

  const fieldErrors = {
    ...parseFieldErrors(body.fieldErrors),
    ...parseFieldErrors(body.errors),
    ...parseFieldErrors(body.violations),
    ...parseFieldErrors(nested.fieldErrors),
    ...parseFieldErrors(nested.errors),
    ...parseFieldErrors(nested.violations),
  }

  let message = errorMessage(body) || errorMessage(nested) || errorMessage(root) || fallback
  if (message.toLowerCase().includes('bad credentials')) {
    message = 'ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง'
  }
  return { message, fieldErrors }
}
