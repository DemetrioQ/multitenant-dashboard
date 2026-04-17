import { generateReactHelpers } from '@uploadthing/react'
import type { OurFileRouter } from './router'

export const { uploadFiles } = generateReactHelpers<OurFileRouter>()
