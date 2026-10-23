export class ApiError extends Error {
  status: number
  fields: Record<string, string>

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  const response = await fetch(path, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
    headers,
  })

  if (response.status === 401) {
    window.location.assign('/admin-login.html')
    throw new ApiError('Your session expired. Sign in again.', 401)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new ApiError(
      payload?.error || `Request failed (${response.status}).`,
      response.status,
      payload?.fields ?? {},
    )
  }

  return payload as T
}

type Body = Record<string, unknown>

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: Body) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body: Body) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: Body) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export async function uploadImage(dataUrl: string): Promise<string> {
  const result = await api.post<{ url: string }>('/api/admin/uploads', { data: dataUrl })
  return result.url
}

/** Changes the admin password. The current one is required as confirmation. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/api/admin/password', { currentPassword, newPassword })
}

export async function downloadProductsCsv(): Promise<void> {
  const response = await fetch('/api/admin/products.csv', { credentials: 'same-origin' })
  if (response.status === 401) {
    window.location.assign('/admin-login.html')
    throw new ApiError('Your session expired. Sign in again.', 401)
  }
  if (!response.ok) throw new ApiError('The CSV could not be exported.', response.status)

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') ?? ''
  const match = /filename="([^"]+)"/.exec(disposition)
  const name = match?.[1] ?? 'falaise-products.csv'
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export type RestoreResult = {
  counts: {
    collections: number
    products: number
    colors: number
    variants: number
    contentSections: number
  }
}

/** Downloads the catalogue + content backup as a dated JSON file. */
export async function downloadBackup(): Promise<void> {
  const response = await fetch('/api/admin/backup', { credentials: 'same-origin' })
  if (response.status === 401) {
    window.location.assign('/admin-login.html')
    throw new ApiError('Your session expired. Sign in again.', 401)
  }
  if (!response.ok) throw new ApiError('The backup could not be downloaded.', response.status)

  const blob = await response.blob()
  const disposition = response.headers.get('content-disposition') ?? ''
  const match = /filename="([^"]+)"/.exec(disposition)
  const stamp = new Date().toISOString().slice(0, 10)
  const name = match?.[1] ?? `falaise-backup-${stamp}.json`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Applies a backup file. The server validates it and rolls back on any failure. */
export async function restoreBackupFile(file: File): Promise<RestoreResult> {
  const text = await file.text()
  let payload: unknown
  try {
    payload = JSON.parse(text)
  } catch {
    throw new ApiError('That file is not valid JSON.', 422)
  }
  return api.post<RestoreResult>('/api/admin/restore', payload as Body)
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('That file could not be read.'))
    reader.readAsDataURL(file)
  })
}

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG or WebP image.'
  if (file.size > IMAGE_MAX_BYTES) return 'Images must be 5 MB or smaller.'
  return null
}
