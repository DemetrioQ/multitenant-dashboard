import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useDropzone } from 'react-dropzone'
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
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const handleFile = (file: File) => {
    setError(null)
    releaseObjectUrl()
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setImageSrc(url)
  }

  useEffect(() => releaseObjectUrl, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      if (accepted[0]) handleFile(accepted[0])
    },
    accept: { 'image/*': [] },
    multiple: false,
  })

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

  if (!open) return null

  return (
    <Modal title={title} onClose={handleClose}>
      {!imageSrc ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer aspect-square w-full transition-colors ${
            isDragActive
              ? 'bg-indigo-500/10 border-indigo-500'
              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-gray-500 mb-3" />
          <p className="text-sm text-gray-400">
            {isDragActive ? 'Drop the image here...' : 'Drag & drop or click to select'}
          </p>
          <p className="text-xs text-gray-600 mt-1">{maxSizeLabel}</p>
        </div>
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
