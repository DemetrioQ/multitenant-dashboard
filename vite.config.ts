import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage } from 'node:http'

function collectBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

export default defineConfig(({ mode }) => {
  // loadEnv with '' prefix loads ALL env vars (not just VITE_*)
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'https://localhost:7000'

  // UploadThing reads from process.env at runtime — Vite doesn't set non-VITE_ vars automatically
  if (env.UPLOADTHING_TOKEN) process.env.UPLOADTHING_TOKEN = env.UPLOADTHING_TOKEN

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'uploadthing-dev',
        configureServer(server) {
          let handler: ((req: Request) => Promise<Response>) | null = null

          server.middlewares.use('/api/uploadthing', async (req: any, res: any, _next: any) => {
            try {
              if (!handler) {
                const { createRouteHandler } = await import('uploadthing/server')
                const { ourFileRouter } = await import('./src/uploadthing/router')
                handler = createRouteHandler({ router: ourFileRouter })
              }

              const protocol = req.socket?.encrypted ? 'https' : 'http'
              const url = `${protocol}://${req.headers.host}${req.originalUrl || req.url}`
              const body = req.method !== 'GET' ? await collectBody(req) : undefined

              const webReq = new Request(url, {
                method: req.method,
                headers: req.headers as Record<string, string>,
                body,
              })

              const webRes = await handler(webReq)

              res.writeHead(webRes.status, Object.fromEntries(webRes.headers.entries()))
              const resBody = await webRes.text()
              res.end(resBody)
            } catch (err) {
              console.error('[uploadthing]', err)
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'UploadThing server error' }))
              }
            }
          })
        },
      },
    ],
    server: {
      proxy: {
        // Only proxy /api/v1 — leaves /api/uploadthing for the dev plugin above
        '/api/v1': {
          target: apiTarget,
          changeOrigin: true,
          secure: false, // allow self-signed certs in dev
        },
      },
    },
  }
})
