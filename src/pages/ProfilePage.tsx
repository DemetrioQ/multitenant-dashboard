import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { UserCircle, Camera, Lock } from 'lucide-react'
import { getMe, updateMe } from '../api/users'
import { changePassword } from '../api/auth'
import { qk } from '../lib/queryKeys'
import { useAuth } from '../hooks/useAuth'
import { ImageCropModal } from '../components/ImageCropModal'
import { PageLoading } from '../components/PageStates'
import { Badge, Button, Card, FieldError, Input, Label, Textarea } from '../components/ui'

interface Form {
  firstName: string
  lastName: string
  avatarUrl: string
  bio: string
}

type FormErrors = Partial<Record<keyof Form, string>>

function validate(f: Form): FormErrors {
  const errors: FormErrors = {}
  if (f.firstName.length > 100) errors.firstName = 'Max 100 characters.'
  if (f.lastName.length > 100) errors.lastName = 'Max 100 characters.'
  if (f.avatarUrl && f.avatarUrl.length > 500) errors.avatarUrl = 'Max 500 characters.'
  if (f.bio && f.bio.length > 500) errors.bio = 'Max 500 characters.'
  return errors
}

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

type PasswordFieldErrors = Partial<Record<keyof PasswordForm, string>>

const emptyPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
}

function validatePassword(f: PasswordForm): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {}
  if (!f.currentPassword) errors.currentPassword = 'Required.'
  if (f.newPassword.length > 0 && f.newPassword.length < 8)
    errors.newPassword = 'Must be at least 8 characters.'
  if (f.newPassword && f.currentPassword && f.newPassword === f.currentPassword) {
    errors.newPassword = 'Must be different from current password.'
  }
  if (f.confirmNewPassword && f.confirmNewPassword !== f.newPassword) {
    errors.confirmNewPassword = 'Passwords do not match.'
  }
  return errors
}

export function ProfilePage() {
  const { signOut, isDemo } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: qk.userMe,
    queryFn: getMe,
  })
  const loading = isLoading && !profile

  const [form, setForm] = useState<Form>({ firstName: '', lastName: '', avatarUrl: '', bio: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const [pwForm, setPwForm] = useState<PasswordForm>(emptyPasswordForm)
  const [pwErrors, setPwErrors] = useState<PasswordFieldErrors>({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSubmitError, setPwSubmitError] = useState<string | null>(null)

  // Seed the form once, when profile first arrives. Subsequent refetches
  // (invalidation, background sync) must not clobber in-progress edits.
  const seededRef = useRef(false)
  useEffect(() => {
    if (!profile || seededRef.current) return
    setForm({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      bio: profile.bio ?? '',
    })
    seededRef.current = true
  }, [profile])

  const invalidateProfile = () => qc.invalidateQueries({ queryKey: qk.userMe })

  const set =
    (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
      if (success) setSuccess(false)
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fieldErrors = validate(form)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setSaving(true)
    setSubmitError(null)
    setSuccess(false)
    try {
      await updateMe({
        firstName: form.firstName.trim() || null,
        lastName: form.lastName.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        bio: form.bio.trim() || null,
      })
      setSuccess(true)
      invalidateProfile()
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail ?? 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const setPw = (key: keyof PasswordForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwForm((prev) => ({ ...prev, [key]: e.target.value }))
    if (pwErrors[key]) setPwErrors((prev) => ({ ...prev, [key]: undefined }))
    if (pwSubmitError) setPwSubmitError(null)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const fieldErrors = validatePassword(pwForm)
    if (Object.keys(fieldErrors).length > 0) {
      setPwErrors(fieldErrors)
      return
    }
    setPwSaving(true)
    setPwSubmitError(null)
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword)
      navigate('/login', {
        replace: true,
        state: { flash: 'Password changed. Please sign in again.' },
      })
      signOut()
    } catch (err: any) {
      const status = err.response?.status
      const detail: string = err.response?.data?.detail ?? 'Failed to change password.'
      if (status === 400) {
        const lower = detail.toLowerCase()
        if (lower.includes('current')) {
          setPwErrors({ currentPassword: detail })
        } else {
          setPwErrors({ newPassword: detail })
        }
      } else {
        setPwSubmitError(detail)
      }
    } finally {
      setPwSaving(false)
    }
  }

  const handleAvatarUpload = async (url: string) => {
    await updateMe({
      firstName: form.firstName.trim() || null,
      lastName: form.lastName.trim() || null,
      avatarUrl: url,
      bio: form.bio.trim() || null,
    })
    setForm((prev) => ({ ...prev, avatarUrl: url }))
    invalidateProfile()
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <UserCircle className="w-5 h-5 text-gray-400" />
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
        </div>
        <p className="text-gray-400 mt-1 text-sm flex items-center gap-2">
          {profile ? profile.email : ''}
          {profile && <Badge>{profile.role}</Badge>}
        </p>
      </div>

      {loading ? (
        <PageLoading />
      ) : (
        <>
          {/* Clickable avatar */}
          <div
            className="relative group cursor-pointer w-fit mx-auto mb-8"
            onClick={() => setShowAvatarModal(true)}
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-3xl font-bold text-gray-400">
                {profile?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
              <Camera className="w-5 h-5 text-white mb-1" />
              <span className="text-white text-xs font-medium">Change</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <Card className="divide-y divide-gray-800">
              <div className="px-6 py-5 space-y-1.5">
                <Label htmlFor="first-name">
                  First name <span className="text-gray-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="first-name"
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="Jane"
                  error={!!errors.firstName}
                />
                <FieldError message={errors.firstName} />
              </div>
              <div className="px-6 py-5 space-y-1.5">
                <Label htmlFor="last-name">
                  Last name <span className="text-gray-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="last-name"
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Smith"
                  error={!!errors.lastName}
                />
                <FieldError message={errors.lastName} />
              </div>
              <div className="px-6 py-5 space-y-1.5">
                <Label htmlFor="bio">
                  Bio <span className="text-gray-500 font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={set('bio')}
                  placeholder="A short bio..."
                  rows={3}
                  className="resize-none"
                  error={!!errors.bio}
                />
                <FieldError message={errors.bio} />
              </div>
            </Card>

            {submitError && (
              <p className="mt-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
                {submitError}
              </p>
            )}
            {success && (
              <p className="mt-4 text-emerald-400 text-sm bg-emerald-950/40 border border-emerald-900/50 rounded-lg px-4 py-3">
                Profile saved.
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={saving} size="lg">
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>

          {isDemo ? (
            <div className="mt-10 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm">
              <span className="font-medium">Password changes are disabled on demo accounts.</span>{' '}
              Real accounts can manage credentials here.
            </div>
          ) : (
            <>
              <div className="mt-10 mb-4 flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-white">Change password</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                After changing your password, you'll be signed out of all sessions.
              </p>

              <form onSubmit={handleChangePassword} noValidate>
                <Card className="divide-y divide-gray-800">
                  <div className="px-6 py-5 space-y-1.5">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={pwForm.currentPassword}
                      onChange={setPw('currentPassword')}
                      autoComplete="current-password"
                      error={!!pwErrors.currentPassword}
                    />
                    <FieldError message={pwErrors.currentPassword} />
                  </div>
                  <div className="px-6 py-5 space-y-1.5">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={pwForm.newPassword}
                      onChange={setPw('newPassword')}
                      autoComplete="new-password"
                      error={!!pwErrors.newPassword}
                    />
                    <FieldError message={pwErrors.newPassword} />
                  </div>
                  <div className="px-6 py-5 space-y-1.5">
                    <Label htmlFor="confirm-new-password">Confirm new password</Label>
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={pwForm.confirmNewPassword}
                      onChange={setPw('confirmNewPassword')}
                      autoComplete="new-password"
                      error={!!pwErrors.confirmNewPassword}
                    />
                    <FieldError message={pwErrors.confirmNewPassword} />
                  </div>
                </Card>

                {pwSubmitError && (
                  <p className="mt-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">
                    {pwSubmitError}
                  </p>
                )}

                <div className="mt-6 flex justify-end">
                  <Button type="submit" disabled={pwSaving} size="lg">
                    {pwSaving ? 'Changing...' : 'Change password'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </>
      )}

      <ImageCropModal
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onUpload={handleAvatarUpload}
        title="Upload avatar"
        route="avatarUploader"
        cropShape="round"
        aspect={1}
        fileNamePrefix="avatar"
        maxSizeLabel="Max 2 MB"
      />
    </div>
  )
}
