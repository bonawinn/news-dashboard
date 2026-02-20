export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }
  const resp = await fetch(url, opts)
  if (!resp.ok) throw new ApiError(resp.status, `HTTP ${resp.status}`)
  return resp.json() as Promise<T>
}

export function apiGet<T>(url: string): Promise<T> {
  return request<T>('GET', url)
}

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return request<T>('POST', url, body)
}

export function apiDelete<T>(url: string): Promise<T> {
  return request<T>('DELETE', url)
}
