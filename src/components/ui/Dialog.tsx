import { useState, useCallback, type ReactNode } from 'react'
import { Modal } from '../Modal'
import { Button } from './Button'

interface ConfirmOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

/**
 * Replaces window.confirm() with a styled, accessible dialog.
 *
 * Returns:
 *   - `confirm(options)` → Promise<boolean>
 *   - `dialog` → JSX to render once near the root of your component
 *
 * Usage:
 * ```tsx
 * const { confirm, dialog } = useConfirm()
 * const onDelete = async () => {
 *   if (await confirm({ title: 'Delete?', message: '...', destructive: true })) {
 *     // ...
 *   }
 * }
 * return <>{dialog}<Button onClick={onDelete}>Delete</Button></>
 * ```
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ ...options, resolve })
      }),
    [],
  )

  const close = (ok: boolean) => {
    if (!state) return
    state.resolve(ok)
    setState(null)
  }

  const dialog = state ? (
    <Modal title={state.title} onClose={() => close(false)}>
      <div className="space-y-4">
        <div className="text-sm text-gray-300">{state.message}</div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => close(false)} className="flex-1">
            {state.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            type="button"
            variant={state.destructive ? 'destructive' : 'primary'}
            onClick={() => close(true)}
            className="flex-1"
          >
            {state.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </div>
    </Modal>
  ) : null

  return { confirm, dialog }
}
