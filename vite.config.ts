import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'

function adminEntryGuard(apiBase: string, origin: string): Plugin {
  const handle = async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
    const path = (req.url || '/').split('?')[0]
    const html = req.method === 'GET' && (req.headers.accept || '').includes('text/html')
    if (!html || path === '/' || path === '/login' || path.startsWith('/2fa/') || path.includes('.')) return next()
    try {
      const headers = { cookie: req.headers.cookie || '', accept: 'application/json', origin }
      const status = await fetch(`${apiBase}/two-factor/session`, { headers, redirect: 'manual' })
      if (status.ok) return next()
      const pending = await fetch(`${apiBase}/two-factor/challenge`, { headers })
      const data = pending.ok ? await pending.json() as { next?: string } : {}
      res.writeHead(302, { Location: data.next || '/login', 'Cache-Control': 'no-store' })
      res.end()
    } catch {
      res.writeHead(302, { Location: '/login', 'Cache-Control': 'no-store' })
      res.end()
    }
  }
  return {
    name: 'admin-entry-guard',
    configureServer(server) { server.middlewares.use((req, res, next) => { void handle(req, res, next) }) },
    configurePreviewServer(server) { server.middlewares.use((req, res, next) => { void handle(req, res, next) }) },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBase = (env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
  const origin = env.VITE_ADMIN_ORIGIN || 'http://localhost:5173'
  return { plugins: [react(), adminEntryGuard(apiBase, origin)] }
})