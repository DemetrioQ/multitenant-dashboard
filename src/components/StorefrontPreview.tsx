import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { LayoutGrid, FileText, ExternalLink, Smartphone, Monitor } from 'lucide-react'

// Embeds the storefront's /preview/product page in an iframe and pushes the
// current form state into it via postMessage. Because the iframe loads the
// real storefront components, the preview automatically stays in sync with
// any storefront design changes — no duplicated JSX in the dashboard.

export interface PreviewProductInput {
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string | null
  sku?: string | null
}

type View = 'card' | 'detail'
type Viewport = 'mobile' | 'desktop'

interface Props {
  storeUrl: string | null
  product: PreviewProductInput
}

// Intrinsic dimensions the iframe is rendered at — visually scaled down
// via CSS transform to fit the available stage width. These match common
// storefront breakpoints so the layout the user sees in the preview is
// the layout the user will see on a real device of that class.
const VIEWPORT_DIM: Record<Viewport, { w: number; h: number }> = {
  mobile: { w: 390, h: 844 },
  desktop: { w: 1280, h: 900 },
}

function buildInitialUrl(storeUrl: string, view: View, product: PreviewProductInput): string {
  const params = new URLSearchParams({
    view,
    name: product.name,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
  })
  if (product.imageUrl) params.set('imageUrl', product.imageUrl)
  if (product.sku) params.set('sku', product.sku)
  // Drop trailing slash on storeUrl so we don't end up with `//preview/...`
  const base = storeUrl.replace(/\/+$/, '')
  return `${base}/preview/product?${params.toString()}`
}

function targetOriginFor(storeUrl: string): string {
  try {
    return new URL(storeUrl).origin
  } catch {
    return '*'
  }
}

export function StorefrontPreview({ storeUrl, product }: Props) {
  const [view, setView] = useState<View>('card')
  const [viewport, setViewport] = useState<Viewport>('mobile')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState(1)

  // Fit the iframe (rendered at its intrinsic dimensions) inside the
  // available stage width via CSS transform: scale(...). Only relevant for
  // the detail view's viewport toggle — the card view skips scaling entirely
  // and just fills the column.
  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || view !== 'detail') return
    const dim = VIEWPORT_DIM[viewport]
    function recalc() {
      if (!stage) return
      setScale(Math.min(1, stage.clientWidth / dim.w))
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(stage)
    return () => ro.disconnect()
  }, [viewport, view])

  // The iframe src is fixed at mount — subsequent updates use postMessage so
  // the iframe doesn't reload on every keystroke. We only rebuild the URL
  // when storeUrl changes (effectively never within a session).
  const initialSrc = useMemo(
    () => (storeUrl ? buildInitialUrl(storeUrl, 'card', product) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeUrl],
  )

  // Listen for the iframe's "ready" handshake.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (iframeRef.current && e.source === iframeRef.current.contentWindow) {
        if (e.data?.type === 'preview-ready') setReady(true)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Push product/view updates to the iframe.
  useEffect(() => {
    if (!ready || !storeUrl) return
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.postMessage({ type: 'preview-update', product, view }, targetOriginFor(storeUrl))
  }, [product, view, ready, storeUrl])

  if (!storeUrl) {
    return (
      <div className="h-full min-h-[300px] grid place-items-center rounded-lg border border-dashed border-gray-700 bg-gray-900/40 text-sm text-gray-500 p-6 text-center">
        Storefront URL not available — preview disabled.
      </div>
    )
  }

  const dim = VIEWPORT_DIM[viewport]
  // For detail view the wrapper is sized to the iframe's *visual*
  // (post-transform) box — CSS transforms don't change layout size, so
  // without this trick the iframe's 1280×900 layout box would push the
  // modal much taller than what's actually visible. Card view skips this
  // entirely and just fills the column.
  const isDetail = view === 'detail'
  const wrapperStyle: React.CSSProperties = isDetail
    ? { width: dim.w * scale, height: dim.h * scale }
    : { width: '100%', height: '100%' }
  const iframeStyle: React.CSSProperties = isDetail
    ? {
        width: `${dim.w}px`,
        height: `${dim.h}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }
    : { width: '100%', height: '100%' }

  return (
    <div className="flex flex-col h-full min-h-[400px] rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900">
        <div className="flex gap-1">
          <ViewTab active={view === 'card'} onClick={() => setView('card')} icon={LayoutGrid}>
            Card
          </ViewTab>
          <ViewTab active={view === 'detail'} onClick={() => setView('detail')} icon={FileText}>
            Detail
          </ViewTab>
        </div>
        <div className="flex items-center gap-2">
          {isDetail && (
            <div className="flex gap-1">
              <ViewTab
                active={viewport === 'mobile'}
                onClick={() => setViewport('mobile')}
                icon={Smartphone}
                title="Mobile preview (390px)"
              />
              <ViewTab
                active={viewport === 'desktop'}
                onClick={() => setViewport('desktop')}
                icon={Monitor}
                title="Desktop preview (1280px, scaled to fit)"
              />
            </div>
          )}
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            title="Open storefront in a new tab"
          >
            <ExternalLink className="w-3 h-3" />
            Open store
          </a>
        </div>
      </div>
      <div
        ref={stageRef}
        className={`flex-1 bg-gray-950 ${isDetail ? 'overflow-auto p-4' : 'overflow-hidden'}`}
      >
        <div
          className={`relative mx-auto bg-white ${
            isDetail && viewport === 'mobile'
              ? 'rounded-[28px] ring-4 ring-gray-800 shadow-2xl overflow-hidden mt-2'
              : ''
          }`}
          style={wrapperStyle}
        >
          <iframe
            ref={iframeRef}
            src={initialSrc ?? undefined}
            title="Storefront preview"
            className="bg-white border-0 absolute top-0 left-0"
            style={iframeStyle}
            // sandbox keeps the iframe isolated; allow-scripts so postMessage
            // and hydration work, allow-same-origin so the storefront's
            // session cookies (if any) don't break it.
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  children,
  title,
}: {
  active: boolean
  onClick: () => void
  icon: typeof LayoutGrid
  children?: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {children}
    </button>
  )
}
