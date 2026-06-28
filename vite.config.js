import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Local dev API: runs every api/<name>.js handler inside the Vite dev server,
// so `npm run dev` serves the frontend AND /api/gemini, /api/ask, etc. together
// — no Vercel CLI / login needed. In production, Vercel runs these as real
// serverless functions (this plugin is dev-only).
function devApi() {
  return {
    name: 'saral-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const name = (req.url || '').split('?')[0].replace(/^\/+/, '')
        if (!/^[a-z0-9_-]+$/i.test(name)) return next()

        // Collect the request body.
        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        await new Promise((resolve) => req.on('end', resolve))
        try {
          req.body = raw ? JSON.parse(raw) : {}
        } catch {
          req.body = {}
        }

        // Shim the Vercel-style response helpers the handler expects.
        res.status = (code) => {
          res.statusCode = code
          return res
        }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }

        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          await mod.default(req, res)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Dev API error', detail: String(err) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load .env / .env.local (incl. non-VITE_ secrets) for the dev API handler.
  const env = loadEnv(mode, process.cwd(), '')
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY

  return {
    plugins: [react(), tailwindcss(), devApi()],
    server: {
      port: 5173,
    },
  }
})
