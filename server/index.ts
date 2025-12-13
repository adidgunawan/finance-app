import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local first, then .env (local takes precedence)
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })
import express from 'express'
import { auth } from './auth.js'
import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.VITE_APP_URL || process.env.APP_URL || 'http://localhost:5173',
  credentials: true
}))

// Better Auth API routes - must be mounted BEFORE express.json()
// toNodeHandler returns a middleware function that should be used directly
const authHandler = toNodeHandler(auth)

// Request logging middleware (optional, for debugging)
app.use('/api/auth', (req, res, next) => {
  console.log(`[Better Auth] ${req.method} ${req.path}`)
  next()
})

// Mount Better Auth handler directly - it handles all methods and paths under /api/auth
// Wrap in error handler to catch and log any errors (including async errors)
app.use('/api/auth', async (req, res, next) => {
  try {
    // Call the handler - it's a standard Express middleware
    const result = authHandler(req, res, next)
    // If it returns a promise, await it to catch any async errors
    if (result && typeof result.then === 'function') {
      await result
    }
  } catch (error: any) {
    console.error('[Better Auth] Handler error:', error)
    console.error('[Better Auth] Error stack:', error?.stack)
    console.error('[Better Auth] Request:', { method: req.method, path: req.path })
    if (!res.headersSent) {
      return res.status(500).json({
        status: 'error',
        message: error?.message || 'Internal Server Error',
        ...(process.env.NODE_ENV !== 'production' && { 
          stack: error?.stack,
          path: req.path,
          method: req.method
        })
      })
    }
  }
})

// Mount express.json() after Better Auth handler
app.use(express.json())

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Better Auth server running on http://localhost:${PORT}`)
  console.log(`Environment check:`)
  console.log(`- APP_URL: ${process.env.APP_URL || 'not set'}`)
  console.log(`- SUPABASE_DATABASE_URL: ${process.env.SUPABASE_DATABASE_URL ? 'set' : 'not set'}`)
  console.log(`- GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'set' : 'not set'}`)
  console.log(`\nTest the server: curl http://localhost:${PORT}/health`)
  console.log(`Test Better Auth: curl http://localhost:${PORT}/api/auth/get-session\n`)
})

