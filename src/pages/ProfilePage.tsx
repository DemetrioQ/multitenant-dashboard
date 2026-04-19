import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserCircle, Camera, Lock } from 'lucide-react'
import { getMe, updateMe, type UserProfile } from '../api/users'
import { changePassword } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { AvatarCropModal } from '../components/AvatarCropModal'

function inputClass(error?: string) {
  return `block w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-indigo-500'
  }`
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-red-400 text-xs mt-1">{msg}</p>
}

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
  if (f.newPassword.length > 0 && f.newPassword.length < 8) errors.newPassword = 'Must be at least 8 characters.'
  if (f.newPassword && f.currentPassword && f.newPassword === f.currentPassword) {
    errors.newPassword = 'Must be different from current password.'
  }
  if (f.confirmNewPassword && f.confirmNewPassword !== f.newPassword) {
    errors.confirmNewPassword = 'Passwords do not match.'
  }
  return errors
}

export function ProfilePage() {
  const { setAvatarUrl: setGlobalAvatar, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<Form>({ firstName: '', lastName: '', avatarUrl: '', bio: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  const [pwForm, setPwForm] = useState<PasswordForm>(emptyPasswordForm)
  const [pwErrors, setPwErrors] = useState<PasswordFieldErrors>({})
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSubmitError, setPwSubmitError] = useState<string | null>(null)

  const load = () =>
    getMe()
      .then((p) => {
        setProfile(p)
        setForm({
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
          avatarUrl: p.avatarUrl ?? '',
          bio: p.bio ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
    if (success) setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fieldErrors = validate(form)
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
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
      setGlobalAvatar(form.avatarUrl.trim() || null)
      load()
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
    if (Object.keys(fieldErrors).length > 0) { setPwErrors(fieldErrors); return }
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
    setGlobalAvatar(url)
    load()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <UserCircle className="w-5 h-5 text-gray-400" />
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
        </div>
        <p className="text-gray-400 mt-1 text-sm">
          {profile ? profile.email : ''}
          {profile && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
              {profile.role}
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              <div className="px-6 py-5 space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  First name <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Jane" className={inputClass(errors.firstName)} />
                <FieldError msg={errors.firstName} />
              </div>
              <div className="px-6 py-5 space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Last name <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Smith" className={inputClass(errors.lastName)} />
                <FieldError msg={errors.lastName} />
              </div>
              <div className="px-6 py-5 space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Bio <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={set('bio')}
                  placeholder="A short bio..."
                  rows={3}
                  className={`block w-full bg-gray-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                    errors.bio ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-indigo-500'
                  }`}
                />
                <FieldError msg={errors.bio} />
              </div>
            </div>

            {submitError && (
              <p className="mt-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{submitError}</p>
            )}
            {success && (
              <p className="mt-4 text-emerald-400 text-sm bg-emerald-950/40 border border-emerald-900/50 rounded-lg px-4 py-3">Profile saved.</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>

          <div className="mt-10 mb-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Change password</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            After changing your password, you'll be signed out of all sessions.
          </p>

          <form onSubmit={handleChangePassword} noValidate>
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              <div className="px-6 py-5 space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Current password</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={setPw('currentPassword')}
                  autoComplete="current-password"
                  className={inputClass(pwErrors.currentPassword)}
                />
                <FieldError msg={pwErrors.currentPassword} />
              </div>
              <div className="px-6 py-5 space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">New password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={setPw('newPassword')}
                  autoComplete="new-password"
                  className={inputClass(pwErrors.newPassword)}
                />
                <FieldError msg={pwErrors.newPassword} />
              </div>
              <div className="px-6 py-5 space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">Confirm new password</label>
                <input
                  type="password"
                  value={pwForm.confirmNewPassword}
                  onChange={setPw('confirmNewPassword')}
                  autoComplete="new-password"
                  className={inputClass(pwErrors.confirmNewPassword)}
                />
                <FieldError msg={pwErrors.confirmNewPassword} />
              </div>
            </div>

            {pwSubmitError && (
              <p className="mt-4 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-4 py-3">{pwSubmitError}</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={pwSaving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
              >
                {pwSaving ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </form>
        </>
      )}

      <AvatarCropModal
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onUpload={handleAvatarUpload}
      />
    </div>
  )
}
