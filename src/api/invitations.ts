import { apiClient } from './client'

export interface InvitationDetails {
  email: string
  tenantName: string
  tenantSlug: string
}

export const getInvitation = (token: string) =>
  apiClient.get<InvitationDetails>(`/api/v1/invitations/${token}`).then((r) => r.data)

export const sendInvitation = (email: string) =>
  apiClient.post('/api/v1/invitations', { email })

export const acceptInvitation = (token: string, password: string, firstName: string, lastName: string) =>
  apiClient.post('/api/v1/invitations/accept', { token, password, firstName, lastName })
