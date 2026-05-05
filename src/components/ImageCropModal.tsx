import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Upload } from 'lucide-react'
import getCroppedImg from '../utils/cropImage'
import { uploadFiles } from '../uploadthing/client'
import type { OurFileRouter } from '../uploadthing/router'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  onUpload: (url: string) => void | Promise<void>
  title: string
  route: keyof OurFileRouter
  cropShape?: 'round' | 'rect'
  aspect?: number
  fileNamePrefix?: string
  maxSizeLabel?: string
}

const MAX_PREVIEW_DIMENSION = 2000

async function downscaleIfHuge(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }
  const { width, height } = bitmap
  const longest = Math.max(width, height)
  if (longest <= MAX_PREVIEW_DIMENSION) {
    bitmap.close?.()
    return file
  }
  const scale = MAX_PREVIEW_DIMENSION / longest
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.92)
  })
}

export function ImageCropModal({
  open,
  onClose,
  onUpload,
  title,
  route,
  cropShape = 'round',
  aspect = 1,
  fileNamePrefix = 'image',
  maxSizeLabel = 'Max 2 MB',
}: Props) {
  const inputId = useId()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loadingFile, setLoadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const objectUrlRef = useRef<string | null>(null)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setLoadingFile(true)
    try {
      const blob = await downscaleIfHuge(file)
      releaseObjectUrl()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      setImageSrc(url)
    } catch (err) {
      console.error('[ImageCropModal] failed to load file', err)
      setError('Could not read that file. Try a different image.')
    } finally {
      setLoadingFile(false)
    }
  }

  useEffect(() => releaseObjectUrl, [])

  const reset = () => {
    releaseObjectUrl()
    setImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setUploading(true)
    setError(null)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const file = new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' })
      const res = await uploadFiles(route, { files: [file] })
      const url = res[0]!.ufsUrl
      await onUpload(url)
      handleClose()
    } catch (err) {
      console.error('[ImageCropModal] upload failed', err)
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to upload image. Please try again.'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  if (!open) return null

  return (
    <Modal title={title} onClose={handleClose}>
      {!imageSrc ? (
        <label
          htmlFor={inputId}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer aspect-square w-full transition-colors ${
            isDragActive
              ? 'bg-indigo-500/10 border-indigo-500'
              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
          }`}
        >
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={loadingFile}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void handleFile(file)
            }}
          />
          <Upload className="w-8 h-8 text-gray-500 mb-3" />
          <p className="text-sm text-gray-400">
            {loadingFile
              ? 'Loading...'
              : isDragActive
                ? 'Drop the image here...'
                : 'Drag & drop or click to select'}
          </p>
          <p className="text-xs text-gray-600 mt-1">{maxSizeLabel}</p>
        </label>
      ) : (
        <>
          <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-800">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-gray-500 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
          </div>
        </>
      )}

      {error && (
        <p className="mt-3 text-red-400 text-sm bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {imageSrc && (
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={reset}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Change image
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {uploading ? 'Uploading...' : 'Confirm & Upload'}
          </button>
        </div>
      )}
    </Modal>
  )
}
