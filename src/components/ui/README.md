# UI primitives

Dark-mode-first components that encapsulate the repeated Tailwind class strings found across the app. **Use these instead of copy-pasting class strings into pages.**

## Quick rules

- Importing: `import { Button, Card, Input } from '../components/ui'`.
- Every primitive forwards its ref and accepts `className` for local tweaks. Extra classes win over defaults (thanks to `tailwind-merge`).
- Don't add one-off variants to primitives — use `className` on the call-site first. Only promote a variant when you see it in 3+ places.
- These are portable. Copy `src/components/ui/`, `src/lib/cn.ts`, and the `@theme` block in `src/index.css` into `saas-storefront` verbatim — then change `--color-brand` if the storefront needs a different accent.

## Components

### `Button`

```tsx
<Button>Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost" size="sm">Close</Button>

// As a Link (uses Radix Slot to pass classes to the child):
<Button asChild>
  <Link to="/settings">Settings</Link>
</Button>
```

Variants: `primary` (default), `secondary`, `ghost`, `destructive`, `outline`. Sizes: `sm`, `md` (default), `lg`.

### `IconButton`

For icon-only buttons (chevrons, X, etc). `aria-label` is **required** by the type.

```tsx
<IconButton aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></IconButton>
<IconButton aria-label="Close" variant="ghost"><X className="w-4 h-4" /></IconButton>
```

### `Badge`

Replaces the per-page `RoleBadge` / `StatusBadge` / `ActionBadge` copies.

```tsx
<Badge>Member</Badge>
<Badge variant="success">Active</Badge>
<Badge variant="warning">Dormant</Badge>
<Badge variant="destructive">Deactivated</Badge>
<Badge variant="rose">Refunded</Badge>
<Badge variant="info">Admin</Badge>
<Badge variant="brand">Super Admin</Badge>
```

### `Input`, `Textarea`, `Select`, `Checkbox`

```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" error={!!errors.email} />
<FieldError message={errors.email} />

<Textarea rows={4} error={!!errors.bio} />

<Select>
  <option value="">All statuses</option>
  <option value="paid">Paid</option>
</Select>

<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
```

### `Card` + slots

```tsx
<Card>
  <CardHeader>
    <h2 className="text-base font-semibold text-white">Team members</h2>
  </CardHeader>
  <CardContent>{/* list */}</CardContent>
  <CardFooter>
    <Button variant="secondary">Invite</Button>
  </CardFooter>
</Card>
```

You can also use `<Card>` standalone without slots when you just need the surface.

### `Label`, `FieldError`

Minimal form helpers. `FieldError` renders nothing when `message` is falsy.

### `Skeleton`

Animated placeholder block. Use to reserve space during loading instead of bare text.

```tsx
{
  loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold">{value}</p>
}
```

### `useConfirm`

Replaces `window.confirm()` with a styled, accessible dialog. Returns `{ confirm, dialog }`. Render `dialog` once near the root of the component, then `await confirm({ ... })` from event handlers.

```tsx
function ProductRow({ product }) {
  const { confirm, dialog } = useConfirm()

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Delete product?',
      message: `"${product.name}" will be permanently removed.`,
      destructive: true,
      confirmLabel: 'Delete',
    })
    if (ok) await deleteProduct(product.id)
  }

  return (
    <>
      {dialog}
      <Button variant="destructive" onClick={onDelete}>
        Delete
      </Button>
    </>
  )
}
```

### `useToast`

App-level notification. Mount `<ToastProvider>` once near the top of `App.tsx`; then any descendant can call `toast(message, variant)`. Variants: `success`, `error`, `info`. Auto-dismisses after 4s; user can dismiss earlier.

```tsx
const { toast } = useToast()

const onSave = async () => {
  try {
    await save()
    toast('Profile saved.', 'success')
  } catch (err) {
    toast(err.message, 'error')
  }
}
```

## When NOT to use a primitive

- Modals → use `src/components/Modal.tsx` directly when you need a custom form layout (Dialog is for confirm-style prompts only).
- Page loading / error states → use `src/components/PageStates.tsx` (`PageLoading`, `PageError`, `FetchingBar`).
- App-level error boundary → `src/components/ErrorBoundary.tsx`.

## Adding a new primitive

1. Put it in `src/components/ui/YourThing.tsx`.
2. Use `cva` for variant matrices; use `cn()` for simple cases.
3. `forwardRef` + spread `...props` so it composes well with forms and other wrappers.
4. Export from `src/components/ui/index.ts`.
5. Document it in this file.
