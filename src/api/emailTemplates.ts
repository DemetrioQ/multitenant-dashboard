import { apiClient } from './client'

export type EmailTemplateType =
  | 'CustomerVerification'
  | 'CustomerPasswordReset'
  | 'OrderPlaced'
  | 'OrderPaid'
  | 'OrderFulfilled'

export interface EmailTemplateSummary {
  type: EmailTemplateType
  defaultSubject: string
  defaultBodyHtml: string
  defaultEnabled: boolean
  customSubject: string | null
  customBodyHtml: string | null
  customEnabled: boolean | null
  customUpdatedAt: string | null
  placeholders: string[]
}

export interface EmailTemplateDetail {
  type: EmailTemplateType
  subject: string
  bodyHtml: string
  enabled: boolean
  isCustom: boolean
  placeholders: string[]
}

export interface EmailTemplatePreview {
  subject: string
  bodyHtml: string
  enabled: boolean
}

export interface EmailTemplateUpdate {
  subject: string
  bodyHtml: string
  enabled: boolean
}

export const listEmailTemplates = () =>
  apiClient.get<EmailTemplateSummary[]>('/api/v1/email-templates').then((r) => r.data)

export const getEmailTemplate = (type: EmailTemplateType) =>
  apiClient.get<EmailTemplateDetail>(`/api/v1/email-templates/${type}`).then((r) => r.data)

export const saveEmailTemplate = (type: EmailTemplateType, data: EmailTemplateUpdate) =>
  apiClient.put<EmailTemplateDetail>(`/api/v1/email-templates/${type}`, data).then((r) => r.data)

export const revertEmailTemplate = (type: EmailTemplateType) =>
  apiClient.delete(`/api/v1/email-templates/${type}`)

export const previewEmailTemplate = (type: EmailTemplateType, data: EmailTemplateUpdate) =>
  apiClient
    .post<EmailTemplatePreview>(`/api/v1/email-templates/${type}/preview`, data)
    .then((r) => r.data)
