import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError, changePassword } from '../api'
import { Button, Field, Input, Panel, useToast } from '../ui'

type FieldErrors = {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export function Account() {
  const toast = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setChanged(false)

    const next: FieldErrors = {}
    if (!currentPassword) next.currentPassword = 'Enter the password you signed in with.'
    if (newPassword.length < 10) next.newPassword = 'Use at least 10 characters.'
    else if (newPassword === currentPassword) {
      next.newPassword = 'Choose a password different from the current one.'
    }
    if (confirmPassword !== newPassword) next.confirmPassword = 'The two passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      setChanged(true)
      toast.push('Password changed.')
    } catch (cause) {
      if (cause instanceof ApiError) {
        const fields = cause.fields ?? {}
        if (fields.currentPassword || fields.newPassword) {
          setErrors({ currentPassword: fields.currentPassword, newPassword: fields.newPassword })
        } else {
          setError(cause.message)
        }
      } else {
        setError('The password could not be changed.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-4">
        <p className="label text-mute">Admin</p>
        <h1 className="display mt-2 text-[clamp(2rem,5vw,2.8rem)]">Account</h1>
        <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-mute">
          One password opens this admin. Change it here whenever you take over a shop, hand one
          over, or think someone else has seen it.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="display text-xl">Password</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-mute">
            Enter the current password to confirm it is you, then choose a new one of 10
            characters or more.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            <Field
              label="Current password"
              htmlFor="account-current"
              error={errors.currentPassword}
            >
              <Input
                id="account-current"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                invalid={Boolean(errors.currentPassword)}
                required
              />
            </Field>

            <Field
              label="New password"
              htmlFor="account-new"
              error={errors.newPassword}
              hint="10 characters or more. A phrase you can remember beats a short scramble."
            >
              <Input
                id="account-new"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                invalid={Boolean(errors.newPassword)}
                required
              />
            </Field>

            <Field
              label="Repeat new password"
              htmlFor="account-confirm"
              error={errors.confirmPassword}
            >
              <Input
                id="account-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                invalid={Boolean(errors.confirmPassword)}
                required
              />
            </Field>

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Change password'}
              </Button>
              {changed ? (
                <p role="status" className="text-[12px] text-mute">
                  The new password is active.
                </p>
              ) : null}
            </div>
          </form>

          {error ? (
            <p role="alert" className="mt-4 border border-ink px-3 py-2 text-[13px]">
              {error}
            </p>
          ) : null}
        </Panel>

        <Panel className="p-5">
          <h2 className="display text-xl">Keeping it safe</h2>
          <dl className="mt-4 space-y-3 border-t border-line pt-4 text-[13px] leading-relaxed">
            <div>
              <dt className="label text-mute">Store it</dt>
              <dd className="mt-1">
                Keep the password in a password manager. Nothing else on the site needs to know
                it; a locked-out admin can still be reset from the server, which is why that
                access matters too.
              </dd>
            </div>
            <div>
              <dt className="label text-mute">Other devices</dt>
              <dd className="mt-1">
                A change here does not sign out a browser that is already signed in. Sessions end
                on their own after 12 hours; on a shared machine, use Sign out in the header.
              </dd>
            </div>
            <div>
              <dt className="label text-mute">If it leaks</dt>
              <dd className="mt-1">
                Change it here first, then rotate the session secret on the host so the old
                sessions stop working. The hosting guide has the steps.
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  )
}
