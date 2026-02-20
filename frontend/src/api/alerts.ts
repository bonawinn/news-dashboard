import { apiGet, apiPost, apiDelete } from './client.ts'
import type { AlertsListResponse, AlertCreatePayload, TelegramTestResponse } from '../types/api.ts'

export function listAlerts(): Promise<AlertsListResponse> {
  return apiGet<AlertsListResponse>('/api/alerts/list')
}

export function createAlert(payload: AlertCreatePayload): Promise<{ id: number }> {
  return apiPost('/api/alerts/create', payload)
}

export function deleteAlert(id: number): Promise<unknown> {
  return apiDelete(`/api/alerts/delete/${id}`)
}

export function testTelegram(): Promise<TelegramTestResponse> {
  return apiPost<TelegramTestResponse>('/api/alerts/test')
}
