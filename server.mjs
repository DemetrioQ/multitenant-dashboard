// Production server: serves the built Vite SPA from dist/ and hosts the
// UploadThing route handler at /api/uploadthing. In dev this work is done
// by the uploadthing-dev plugin in vite.config.ts. The router definition
// here must stay in sync with src/uploadthing/router.ts.
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRouteHandler } from 'uploadthing/express'
import { createUploadthing } from 'uploadthing/server'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const port = Number(process.env.PORT) || 80

const f = createUploadthing()
const ourFileRouter = {
  avatarUploader: f({ image: { maxFileSize: '2MB' } }).onUploadComplete(({ file }) => {
    console.log('Avatar upload complete:', file.ufsUrl)
  }),
  productImageUploader: f({ image: { maxFileSize: '4MB' } }).onUploadComplete(({ file }) => {
    console.log('Product image upload complete:', file.ufsUrl)
  }),
}

const app = express()

app.use(
  '/api/uploadthing',
  createRouteHandler({
    router: ourFileRouter,
    config: { token: process.env.UPLOADTHING_TOKEN },
  }),
)

app.use(express.static(distDir, { index: false, maxAge: '1h' }))

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(port, () => {
  console.log(`saas-dashboard listening on :${port}`)
  if (!process.env.UPLOADTHING_TOKEN) {
    console.warn('WARNING: UPLOADTHING_TOKEN not set — uploads will fail')
  }
})
